<template>
  <main class="researcher-page" :class="{ 'compact-list-view': compactLists }">
    <header class="repository-header">
      <div class="brand-mark"><i class="bi bi-archive-fill" aria-hidden="true"></i></div>
      <div class="repository-title">
        <p class="repository-eyebrow">CASE REPOSITORY</p>
        <h1>Closed case library</h1>
        <p>Review archived cases and evidence approved for research access.</p>
      </div>
      <button class="activity-button" type="button" @click="showNotifications = !showNotifications">
        <i class="bi bi-bell" aria-hidden="true"></i>
        Activity
        <span v-if="unreadNotifications" class="unread-count">{{ unreadNotifications }}</span>
      </button>
    </header>

    <section class="repository-stats" aria-label="Repository summary">
      <div class="stat-item"><span class="stat-icon"><i class="bi bi-folder2-open" aria-hidden="true"></i></span><span class="stat-copy"><small>Closed cases</small><strong>{{ stats.closedCases }}</strong></span></div>
      <div class="stat-item"><span class="stat-icon"><i class="bi bi-file-earmark-check" aria-hidden="true"></i></span><span class="stat-copy"><small>Shared evidence files</small><strong>{{ stats.sharedEvidence }}</strong></span></div>
      <div class="stat-item"><span class="stat-icon"><i class="bi bi-shield-lock" aria-hidden="true"></i></span><span class="stat-copy"><small>Research-restricted items</small><strong>{{ stats.restrictedEvidence }}</strong></span></div>
      <div class="stat-aside"><i class="bi bi-shield-check" aria-hidden="true"></i><span>Case and evidence access is managed by authorised case teams.</span></div>
    </section>

    <section v-if="showNotifications" class="activity-panel" aria-labelledby="activity-heading">
      <div class="activity-heading"><div><p class="section-eyebrow">ACCOUNT ACTIVITY</p><h2 id="activity-heading">Recent notifications</h2></div><button class="icon-button" type="button" aria-label="Close activity" @click="showNotifications = false"><i class="bi bi-x-lg" aria-hidden="true"></i></button></div>
      <div v-if="notificationsLoading" class="inline-state">Loading activity...</div>
      <div v-else-if="notifications.length === 0" class="inline-state">No recent notifications.</div>
      <div v-else class="activity-list">
        <button v-for="notification in notifications" :key="notification._id" class="activity-row" type="button" @click="openNotification(notification)">
          <span class="activity-mark" :class="activityTone(notification.kind)"><i class="bi" :class="activityIcon(notification.kind)" aria-hidden="true"></i></span>
          <span class="activity-copy"><strong>{{ notification.title }}</strong><small>{{ notification.body }}</small><time>{{ formatRelative(notification.createdAt) }}</time></span>
          <span v-if="!notification.readAt" class="activity-unread" aria-label="Unread"></span>
        </button>
      </div>
    </section>

    <section class="repository-toolbar" aria-label="Case search and filters">
      <label class="case-search" for="case-search">
        <i class="bi bi-search" aria-hidden="true"></i>
        <input id="case-search" v-model="search" type="search" placeholder="Search case ID, title, description or keywords" @input="scheduleSearch" />
        <kbd>/</kbd>
      </label>
      <label class="sort-control" for="case-type-filter"><span>Classification</span><select id="case-type-filter" v-model="caseTypeFilter" @change="loadCases"><option value="">All types</option><option value="civil">Civil</option><option value="criminal">Criminal</option></select></label>
      <label class="sort-control" for="evidence-type-filter"><span>Evidence</span><select id="evidence-type-filter" v-model="evidenceTypeFilter" @change="loadCases"><option value="">All evidence</option><option v-for="type in availableEvidenceTypes" :key="type" :value="type">{{ type }}</option></select></label>
      <label class="sort-control" for="organization-filter"><span>Organisation</span><select id="organization-filter" v-model="organizationFilter" @change="loadCases"><option value="">All organisations</option><option v-for="name in availableOrganizations" :key="name" :value="name">{{ name }}</option></select></label>
      <label class="sort-control" for="case-sort"><span>Sort</span><select id="case-sort" v-model="sortBy" @change="loadCases"><option value="createdAt">Date created</option><option value="updatedAt">Recently updated</option><option value="name">Case name</option><option value="caseId">Case ID</option><option value="caseType">Classification</option></select></label>
      <label class="sort-control order-control" for="case-order"><span>Order</span><select id="case-order" v-model="sortOrder" @change="loadCases"><option value="desc">Newest first</option><option value="asc">Oldest first</option></select></label>
      <button class="clear-filters-button" type="button" @click="clearFilters"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Clear filters</button>
    </section>

    <section class="case-results" aria-labelledby="results-heading">
      <div class="results-heading"><div><p class="section-eyebrow">ARCHIVED MATERIAL</p><h2 id="results-heading">Cases <span>{{ filteredCases.length }}</span></h2></div><div class="results-note"><i class="bi bi-info-circle" aria-hidden="true"></i> Restricted evidence is counted but not identifiable or downloadable.</div></div>
      <div v-if="loading" class="repository-state"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Loading repository</div>
      <div v-else-if="error" class="repository-state error-state" role="alert"><i class="bi bi-exclamation-circle" aria-hidden="true"></i>{{ error }}</div>
      <div v-else-if="filteredCases.length === 0" class="repository-state empty-state"><i class="bi bi-folder2-open" aria-hidden="true"></i><strong>No archived cases found</strong><span>Adjust your search or check back when a case has been closed.</span></div>
      <div v-else class="case-table-wrap">
        <table class="case-table">
          <thead><tr><th>Case</th><th>Classification</th><th>Evidence access</th><th>Archived</th><th><span class="visually-hidden">Actions</span></th></tr></thead>
          <tbody>
            <tr v-for="caseItem in paginatedCases" :key="caseItem._id">
              <td class="case-cell"><strong>{{ caseItem.caseId || `Case ${caseItem.number}` }}</strong><span>{{ caseItem.name }}</span><small>{{ caseItem.description }}</small></td>
              <td><span class="case-type">{{ capitalizeCase(caseItem.caseType) }}</span></td>
              <td><div class="access-counts"><span class="shared-count"><i class="bi bi-file-earmark-check" aria-hidden="true"></i>{{ sharedCount(caseItem) }} shared</span><span class="restricted-count"><i class="bi bi-lock" aria-hidden="true"></i>{{ restrictedCount(caseItem) }} restricted</span></div></td>
              <td class="date-cell">{{ formatDate(caseItem.updatedAt || caseItem.createdAt) }}</td>
              <td class="case-actions"><button class="details-button" type="button" @click="inspectCase(caseItem)"><i class="bi bi-eye" aria-hidden="true"></i> Details</button><button class="details-button" type="button" @click="saveBookmark(caseItem)"><i class="bi bi-bookmark-plus" aria-hidden="true"></i> Save</button><button class="download-button" type="button" :disabled="downloadingId === caseItem._id" @click="downloadCase(caseItem)"><i class="bi" :class="downloadingId === caseItem._id ? 'bi-arrow-repeat' : 'bi-download'" aria-hidden="true"></i>{{ downloadingId === caseItem._id ? 'Preparing' : 'Download' }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav v-if="totalPages > 1" class="repository-pagination" aria-label="Repository pages">
        <span>Showing {{ (currentPage - 1) * itemsPerPage + 1 }}–{{ Math.min(currentPage * itemsPerPage, filteredCases.length) }} of {{ filteredCases.length }} cases</span>
        <div class="pagination-actions">
          <button type="button" :disabled="currentPage === 1" @click="currentPage--"><i class="bi bi-chevron-left" aria-hidden="true"></i> Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button type="button" :disabled="currentPage === totalPages" @click="currentPage++">Next <i class="bi bi-chevron-right" aria-hidden="true"></i></button>
        </div>
      </nav>
    </section>


    <div v-if="selectedCase" class="dialog-backdrop" @click.self="selectedCase = null" @keydown.esc="selectedCase = null">
      <section class="case-dialog case-dialog-redesigned" role="dialog" aria-modal="true" :aria-labelledby="`case-title-${selectedCase._id}`">
        <header class="case-modal-header">
          <div class="case-modal-heading">
            <div class="case-modal-icon"><i class="bi bi-folder2-open" aria-hidden="true"></i></div>
            <div class="case-modal-title">
              <div class="case-modal-kickers">
                <span class="case-modal-eyebrow">CASE REPOSITORY</span>
                <span class="case-modal-status"><i class="bi bi-check-circle-fill"></i> Closed case</span>
              </div>
              <h2 :id="`case-title-${selectedCase._id}`">{{ selectedCase.name }}</h2>
              <p>{{ selectedCase.caseId || `Case ${selectedCase.number}` }}</p>
            </div>
          </div>
          <button class="case-modal-close" type="button" aria-label="Close case details" @click="selectedCase = null"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
        </header>

        <div class="case-modal-summary">
          <span><i class="bi bi-diagram-3"></i>{{ capitalizeCase(selectedCase.caseType) }} case</span>
          <span><i class="bi bi-calendar3"></i>Updated {{ formatDate(selectedCase.updatedAt || selectedCase.createdAt) }}</span>
          <span><i class="bi bi-file-earmark-check"></i>{{ sharedEvidence(selectedCase).length }} shared evidence items</span>
          <span><i class="bi bi-chat-square-text"></i>{{ discussions.length }} discussions</span>
        </div>

        <div class="case-workspace-layout">
          <aside class="case-workspace-sidebar" aria-label="Case workspace navigation">
            <div class="workspace-sidebar-label">CASE WORKSPACE</div>
            <nav class="case-detail-tabs" role="tablist" aria-label="Case details sections">
              <button type="button" role="tab" :aria-selected="activeCaseTab === 'overview'" :class="{ active: activeCaseTab === 'overview' }" @click="activeCaseTab = 'overview'">
                <i class="bi bi-grid-1x2"></i><span>Overview</span>
              </button>
              <button type="button" role="tab" :aria-selected="activeCaseTab === 'evidence'" :class="{ active: activeCaseTab === 'evidence' }" @click="activeCaseTab = 'evidence'">
                <i class="bi bi-file-earmark-lock"></i><span>Evidence</span><small>{{ selectedCase.evidence.length }}</small>
              </button>
              <button type="button" role="tab" :aria-selected="activeCaseTab === 'related'" :class="{ active: activeCaseTab === 'related' }" @click="activeCaseTab = 'related'">
                <i class="bi bi-diagram-2"></i><span>Related cases</span><small>{{ relatedLoading ? '…' : relatedCases.length }}</small>
              </button>
              <button type="button" role="tab" :aria-selected="activeCaseTab === 'discussion'" :class="{ active: activeCaseTab === 'discussion' }" @click="activeCaseTab = 'discussion'">
                <i class="bi bi-chat-square-text"></i><span>Discussion</span><small>{{ discussions.length }}</small>
              </button>
            </nav>
            <div class="case-sidebar-access">
              <span class="sidebar-access-icon"><i class="bi bi-shield-check"></i></span>
              <strong>Research access</strong>
              <p>Only material explicitly shared by the case team is available in this workspace.</p>
              <div class="sidebar-access-counts">
                <span><b>{{ sharedEvidence(selectedCase).length }}</b> Available</span>
                <span><b>{{ restrictedCount(selectedCase) }}</b> Restricted</span>
              </div>
            </div>
          </aside>
          <div class="case-modal-body">
          <section v-if="reportTarget" class="repository-report-form" aria-labelledby="repository-report-heading">
            <div class="report-form-heading">
              <div><span class="case-section-eyebrow">REPOSITORY GOVERNANCE</span><h3 id="repository-report-heading">Report {{ reportTarget.label }}</h3><p>Reports are reviewed by a DESS administrator. Include enough detail to explain the concern.</p></div>
              <button type="button" class="case-subtle-button" @click="closeReportForm">Cancel</button>
            </div>
            <label>Reason for report
              <select v-model="reportCategory">
                <option value="inaccurate_information">Potentially inaccurate information</option>
                <option value="privacy_concern">Privacy concern</option>
                <option value="sensitive_information">Sensitive information</option>
                <option value="inappropriate_content">Inappropriate content</option>
                <option value="copyright_concern">Copyright concern</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>Details
              <textarea v-model.trim="reportDescription" rows="3" maxlength="2000" minlength="10" placeholder="Describe the issue and why it should be reviewed..." required></textarea>
            </label>
            <p v-if="reportError" class="governance-error" role="alert">{{ reportError }}</p>
            <p v-if="reportNotice" class="governance-notice" role="status">{{ reportNotice }}</p>
            <div class="report-form-actions"><small>{{ reportDescription.length }}/2,000 characters</small><button type="button" :disabled="submittingReport || reportDescription.trim().length < 10" @click="submitRepositoryReport">{{ submittingReport ? 'Submitting…' : 'Submit report' }}</button></div>
          </section>
          <section v-if="activeCaseTab === 'overview'" class="case-tab-panel" role="tabpanel">
            <div class="case-overview-layout">
              <article class="case-info-card case-description-card">
                <div class="case-section-heading"><div><span class="case-section-eyebrow">CASE SUMMARY</span><h3>About this case</h3></div><span class="case-type-pill">{{ capitalizeCase(selectedCase.caseType) }}</span></div>
                <p>{{ selectedCase.description || 'No case description has been provided.' }}</p>
              </article>
              <aside class="case-overview-side">
                <div class="case-info-card access-card">
                  <span class="case-section-eyebrow">RESEARCH ACCESS</span>
                  <div class="access-card-status"><i class="bi bi-shield-check"></i><div><strong>Closed archive record</strong><small>Researcher access is limited to material shared by the case team.</small></div></div>
                  <div class="access-card-counts">
                    <div><strong>{{ sharedEvidence(selectedCase).length }}</strong><span>Available</span></div>
                    <div><strong>{{ restrictedCount(selectedCase) }}</strong><span>Restricted</span></div>
                  </div>
                </div>
                <div class="case-info-card case-actions-card">
                  <span class="case-section-eyebrow">QUICK ACTIONS</span>
                  <button type="button" @click="saveBookmark(selectedCase)"><i class="bi bi-bookmark-plus"></i> Save this case</button>
                  <router-link class="case-actions-link" to="/research-workspace"><i class="bi bi-journal-bookmark"></i> Open Research Workspace</router-link>
                  <button type="button" @click="activeCaseTab = 'evidence'"><i class="bi bi-file-earmark-check"></i> Review shared evidence</button>
                  <button type="button" @click="activeCaseTab = 'related'"><i class="bi bi-diagram-3"></i> Explore related cases</button>
                  <button type="button" @click="activeCaseTab = 'discussion'"><i class="bi bi-chat-square-text"></i> Join case discussion</button>
                  <button type="button" @click="openReport('case', selectedCase._id, 'case record')"><i class="bi bi-flag"></i> Report case record</button>
                </div>
              </aside>
            </div>
            <article v-if="restrictedCount(selectedCase)" class="repository-access-card">
              <div class="repository-access-heading"><span class="repository-access-icon"><i class="bi bi-shield-lock"></i></span><div><strong>Request additional evidence access</strong><p>You can ask the assigned case team to consider selected restricted material for your research. The investigator will decide which individual items, if any, to release.</p></div></div>
              <div v-if="selectedCaseAccessRequest?.status === 'pending'" class="access-request-state">
                <span><i class="bi bi-hourglass-split"></i> Your request is pending review by the assigned case team.</span>
                <button type="button" class="case-subtle-button" :disabled="cancellingAccessRequest" @click="cancelAccessRequest(selectedCaseAccessRequest._id)">{{ cancellingAccessRequest ? 'Cancelling…' : 'Cancel request' }}</button>
              </div>
              <div v-else-if="selectedCaseAccessRequest" class="access-request-state">
                <span><i class="bi bi-info-circle"></i> Your latest request was {{ selectedCaseAccessRequest.status }}.<small v-if="selectedCaseAccessRequest.decisionNote"> · {{ selectedCaseAccessRequest.decisionNote }}</small></span>
              </div>
              <form v-if="selectedCaseAccessRequest?.status !== 'pending'" class="access-request-form" @submit.prevent="submitAccessRequest">
                <label>Research purpose
                  <textarea v-model.trim="accessPurpose" rows="3" minlength="20" maxlength="2000" placeholder="Explain your research question and why additional evidence access is relevant..." required></textarea>
                </label>
                <div class="access-request-actions"><small>{{ accessPurpose.length }}/2,000 characters (minimum 20)</small><button type="submit" :disabled="submittingAccessRequest || accessPurpose.trim().length < 20">{{ submittingAccessRequest ? 'Sending…' : 'Send access request' }}</button></div>
              </form>
              <p v-if="accessRequestError" class="governance-error" role="alert">{{ accessRequestError }}</p>
              <p v-if="accessRequestNotice" class="governance-notice" role="status">{{ accessRequestNotice }}</p>
              <small class="access-security-note"><i class="bi bi-lock-fill"></i> A request never grants access automatically. Global evidence-sharing settings remain under the control of the case team.</small>
            </article>
            <div v-if="bookmarkNotice" class="discussion-notice">{{ bookmarkNotice }}</div>
            <div v-if="restrictedCount(selectedCase)" class="restricted-summary">
              <i class="bi bi-shield-lock-fill" aria-hidden="true"></i>
              <span><strong>{{ restrictedCount(selectedCase) }} evidence item(s) are restricted</strong><small>These items remain visible to the assigned DESS team. Their names, contents and files are not exposed in the Case Repository.</small></span>
            </div>
          </section>

          <section v-else-if="activeCaseTab === 'evidence'" class="case-tab-panel" role="tabpanel">
            <div class="case-section-heading case-tab-intro"><div><span class="case-section-eyebrow">RESEARCHER-APPROVED MATERIAL</span><h3>Evidence available for review</h3><p>Only evidence explicitly shared by the case team is listed here.</p></div><span class="case-tab-count">{{ sharedEvidence(selectedCase).length }} available</span></div>
            <div v-if="bookmarkNotice" class="discussion-notice">{{ bookmarkNotice }}</div>
            <div v-if="sharedEvidence(selectedCase).length" class="case-evidence-grid">
              <article v-for="evidence in sharedEvidence(selectedCase)" :key="evidence._id" class="case-evidence-card">
                <div class="case-evidence-icon"><i class="bi bi-file-earmark-check"></i></div>
                <div class="case-evidence-main">
                  <strong>{{ evidence.name }}</strong>
                  <p>{{ evidence.description || 'No evidence description provided.' }}</p>
                  <div class="case-evidence-meta"><span>{{ evidence.type || 'Unclassified' }}</span><span>{{ evidence.format || 'File' }}</span><span v-if="evidence.uploadedAt">{{ formatDate(evidence.uploadedAt) }}</span></div>
                  <code v-if="evidence.hash">SHA-256 · {{ evidence.hash }}</code>
                </div>
                <button class="evidence-save-button" type="button" @click="saveBookmark(selectedCase, evidence)" title="Save evidence to your Research Workspace"><i class="bi bi-bookmark-plus"></i><span>Save</span></button>
              </article>
            </div>
            <div v-else class="case-tab-empty"><i class="bi bi-file-earmark-lock"></i><strong>No shared evidence yet</strong><span>The case team has not made any evidence items available to researchers.</span></div>
            <div v-if="restrictedCount(selectedCase)" class="restricted-summary">
              <i class="bi bi-shield-lock-fill" aria-hidden="true"></i>
              <span><strong>{{ restrictedCount(selectedCase) }} restricted evidence item(s)</strong><small>Restricted evidence is deliberately excluded from this list and from researcher downloads.</small></span>
            </div>
          </section>

          <section v-else-if="activeCaseTab === 'related'" class="case-tab-panel" role="tabpanel">
            <div class="case-section-heading case-tab-intro"><div><span class="case-section-eyebrow">DISCOVERY</span><h3>Related cases</h3><p>Other closed cases with overlapping topics, classifications or shared evidence types.</p></div><button class="case-subtle-button" type="button" @click="loadRelatedCases(selectedCase._id)" :disabled="relatedLoading"><i class="bi bi-arrow-clockwise"></i> Refresh</button></div>
            <div v-if="relatedLoading" class="case-tab-empty"><span class="spinner-border spinner-border-sm"></span><strong>Finding related cases</strong><span>Comparing case descriptions, keywords and researcher-visible evidence types.</span></div>
            <div v-else-if="relatedCases.length" class="related-case-grid">
              <button v-for="related in relatedCases" :key="related._id" class="related-case-card" type="button" @click="inspectCase(related)">
                <span class="related-case-card-icon"><i class="bi bi-folder2-open"></i></span>
                <span class="related-case-card-copy"><strong>{{ related.caseId || related.name }}</strong><b>{{ related.name }}</b><small>{{ capitalizeCase(related.caseType) }} · {{ related.relevanceReasons?.join(' · ') }}</small></span>
                <i class="bi bi-arrow-up-right related-case-open"></i>
              </button>
            </div>
            <div v-else class="case-tab-empty"><i class="bi bi-diagram-2"></i><strong>No related cases found</strong><span>There are no sufficiently similar cases in the accessible archive.</span></div>
          </section>

          <section v-else class="case-tab-panel case-discussion-tab" role="tabpanel">
            <section class="repository-discussion-panel">
              <div class="discussion-heading">
                <div><span class="case-section-eyebrow">RESEARCH COMMUNITY</span><h3>Case discussion</h3><small>Share research questions, observations and findings. These discussions are separate from private DESS team chats.</small></div>
                <button class="discussion-refresh" type="button" @click="loadDiscussions(selectedCase._id)" :disabled="discussionsLoading"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
              </div>
              <div v-if="discussionError" class="discussion-alert">{{ discussionError }}</div>
              <div v-if="discussionNotice" class="discussion-notice">{{ discussionNotice }}</div>
              <form class="discussion-composer" @submit.prevent="postDiscussion">
                <label :for="'discussion-new-' + selectedCase._id">Start a discussion</label>
                <textarea :id="'discussion-new-' + selectedCase._id" v-model="newDiscussionContent" rows="3" maxlength="5000" placeholder="Share a research question, observation or finding..." required></textarea>
                <div class="discussion-compose-footer"><small>{{ newDiscussionContent.length }}/5,000</small><button type="submit" :disabled="postingDiscussion || !newDiscussionContent.trim()">{{ postingDiscussion ? 'Posting...' : 'Post discussion' }}</button></div>
              </form>
              <div v-if="discussionsLoading" class="discussion-empty">Loading case discussions...</div>
              <div v-else-if="!discussions.length" class="discussion-empty">No discussions yet. Start the first research conversation for this case.</div>
              <article v-for="thread in discussions" :key="thread._id" class="discussion-thread" :class="{ 'discussion-pinned': thread.isPinned }">
                <div class="discussion-author-row">
                  <div class="discussion-author"><span class="discussion-avatar">{{ initials(thread.author?.name) }}</span><span><strong>{{ thread.author?.name || thread.authorName }}</strong><small>{{ thread.author?.userType || 'Researcher' }}<span v-if="thread.author?.organizationName"> · {{ thread.author.organizationName }}</span> · {{ formatDate(thread.createdAt) }}</small></span></div>
                  <span v-if="thread.isPinned" class="discussion-pin-label"><i class="bi bi-pin-angle-fill"></i> Pinned</span>
                </div>
                <p class="discussion-content">{{ thread.content }}</p>
                <div class="discussion-actions">
                  <button v-if="thread.isMine && !thread.isDeleted" type="button" @click="toggleDiscussionPin(thread)"><i class="bi bi-pin-angle"></i> {{ thread.isPinned ? 'Unpin' : 'Pin' }}</button>
                  <button v-if="thread.isMine && !thread.isDeleted" type="button" @click="removeDiscussion(thread)"><i class="bi bi-trash3"></i> Delete</button>
                  <button v-if="!thread.isMine && !thread.isDeleted && !thread.isModerated" type="button" @click="startCollaborationInvite(thread.author)"><i class="bi bi-people"></i> Request collaboration</button>
                  <button v-if="!thread.isMine && !thread.isDeleted && !thread.isModerated" type="button" @click="openReport('discussion', thread._id, 'discussion contribution')"><i class="bi bi-flag"></i> Report</button>
                  <button v-if="!thread.isDeleted && !thread.isModerated" type="button" @click="replyingToDiscussionId = replyingToDiscussionId === thread._id ? '' : thread._id"><i class="bi bi-reply"></i> Reply ({{ thread.replies?.length || 0 }})</button>
                </div>
                <form v-if="replyingToDiscussionId === thread._id" class="discussion-reply-form" @submit.prevent="postDiscussionReply(thread)">
                  <textarea v-model="discussionReplyContent" rows="2" maxlength="5000" placeholder="Write a reply..." required></textarea>
                  <div><button type="button" class="discussion-cancel" @click="replyingToDiscussionId = ''; discussionReplyContent = ''">Cancel</button><button type="submit" :disabled="postingDiscussion || !discussionReplyContent.trim()">{{ postingDiscussion ? 'Sending...' : 'Send reply' }}</button></div>
                </form>
                <div v-if="thread.replies?.length" class="discussion-replies">
                  <article v-for="reply in thread.replies" :key="reply._id" class="discussion-reply">
                    <div class="discussion-author-row"><div class="discussion-author"><span class="discussion-avatar reply-avatar">{{ initials(reply.author?.name) }}</span><span><strong>{{ reply.author?.name || reply.authorName }}</strong><small>{{ reply.author?.userType || 'Researcher' }} · {{ formatDate(reply.createdAt) }}</small></span></div></div>
                    <p class="discussion-content">{{ reply.content }}</p>
                    <div class="discussion-actions">
                      <button v-if="!reply.isMine && !reply.isDeleted && !reply.isModerated" type="button" @click="startCollaborationInvite(reply.author)"><i class="bi bi-people"></i> Request collaboration</button>
                      <button v-if="!reply.isMine && !reply.isDeleted && !reply.isModerated" type="button" @click="openReport('discussion', reply._id, 'discussion reply')"><i class="bi bi-flag"></i> Report</button>
                      <button v-if="reply.isMine && !reply.isDeleted" type="button" @click="removeDiscussion(reply)"><i class="bi bi-trash3"></i> Delete</button>
                    </div>
                  </article>
                </div>
              </article>
              <div v-if="collaborationTarget" class="collaboration-invite-panel">
                <div><strong>Invite {{ collaborationTarget.name }} to collaborate</strong><small>This invitation is limited to this research case. It does not grant access to restricted evidence or DESS operational case rooms.</small></div>
                <textarea v-model="collaborationMessage" rows="2" maxlength="1000" placeholder="Add a short note (optional)..."></textarea>
                <div><button type="button" class="discussion-cancel" @click="collaborationTarget = null; collaborationMessage = ''">Cancel</button><button type="button" @click="sendCollaborationInvite" :disabled="sendingCollaborationInvite">{{ sendingCollaborationInvite ? 'Sending...' : 'Send invitation' }}</button></div>
              </div>
            </section>
          </section>
          </div>
        </div>

        <footer class="case-modal-footer">
          <span><i class="bi bi-shield-check"></i> Only researcher-approved evidence is available here.</span>
          <div><button class="case-footer-close" type="button" @click="selectedCase = null">Close</button><button class="download-button" type="button" :disabled="downloadingId === selectedCase._id" @click="downloadCase(selectedCase)"><i class="bi bi-download" aria-hidden="true"></i>{{ downloadingId === selectedCase._id ? 'Preparing…' : 'Download available evidence' }}</button></div>
        </footer>
      </section>
    </div>

    <div v-if="openCaseError" class="dialog-backdrop" @click.self="openCaseError = null">
      <section class="case-dialog open-case-dialog" role="dialog" aria-modal="true" aria-labelledby="open-case-title">
        <header class="dialog-header"><div><p class="section-eyebrow">SEARCH RESULT</p><h2 id="open-case-title">{{ openCaseError.caseId }}</h2><p>{{ openCaseError.name }}</p></div><button class="icon-button" type="button" aria-label="Close case notice" @click="openCaseError = null"><i class="bi bi-x-lg" aria-hidden="true"></i></button></header>
        <div class="dialog-content"><div class="open-case-status"><i class="bi bi-hourglass-split" aria-hidden="true"></i><span>This case is still open. Repository access becomes available after closure.</span></div><div v-if="openCaseError.createdBy" class="case-manager"><span class="person-initials">{{ initials(openCaseError.createdBy.name) }}</span><span><strong>{{ openCaseError.createdBy.name }}</strong><small>Case manager · {{ openCaseError.createdBy.email }}</small></span></div></div>
        <footer class="dialog-footer"><span>Contact is sent through DESS internal messages.</span><button v-if="openCaseError.createdBy" class="download-button" type="button" @click="contactInvestigator"><i class="bi bi-send" aria-hidden="true"></i> Contact case lead</button></footer>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { API_CONFIG } from '@/config';

interface EvidenceSummary {
  _id: string;
  availableToResearchers: boolean;
  name?: string;
  description?: string;
  type?: string;
  format?: string;
  hash?: string;
  uploadedAt?: string;
}
interface CaseRecord {
  _id: string;
  caseId: string;
  number: number;
  name: string;
  caseType: string;
  description: string;
  status: string;
  evidence: EvidenceSummary[];
  createdAt: string;
  updatedAt: string;
  relevanceScore?: number;
  relevanceReasons?: string[];
}
interface NotificationRecord {
  _id: string;
  kind: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
  link?: string;
}

const router = useRouter();
const search = ref('');
const caseTypeFilter = ref('');
const evidenceTypeFilter = ref('');
const organizationFilter = ref('');
const availableEvidenceTypes = ref<string[]>([]);
const availableOrganizations = ref<string[]>([]);
const relatedCases = ref<CaseRecord[]>([]);
const relatedLoading = ref(false);
const sortBy = ref('createdAt');
const sortOrder = ref('desc');
const allCases = ref<CaseRecord[]>([]);
const loading = ref(false);
const error = ref('');
const downloadingId = ref('');
const selectedCase = ref<CaseRecord | null>(null);
const activeCaseTab = ref<'overview' | 'evidence' | 'related' | 'discussion'>('overview');
const openCaseError = ref<any>(null);
const discussions = ref<any[]>([]);
const discussionsLoading = ref(false);
const discussionError = ref('');
const discussionNotice = ref('');
const newDiscussionContent = ref('');
const discussionReplyContent = ref('');
const replyingToDiscussionId = ref('');
const postingDiscussion = ref(false);
const collaborationTarget = ref<any>(null);
const collaborationMessage = ref('');
const sendingCollaborationInvite = ref(false);
const bookmarkNotice = ref('');
const caseAccessRequests = ref<any[]>([]);
const accessPurpose = ref('');
const submittingAccessRequest = ref(false);
const cancellingAccessRequest = ref(false);
const accessRequestError = ref('');
const accessRequestNotice = ref('');
const reportTarget = ref<{ targetType: 'case' | 'discussion'; targetId: string; label: string } | null>(null);
const reportCategory = ref('inaccurate_information');
const reportDescription = ref('');
const reportError = ref('');
const reportNotice = ref('');
const submittingReport = ref(false);
const selectedCaseAccessRequest = computed(() =>
  caseAccessRequests.value.find(item => String(item.caseId) === String(selectedCase.value?._id) && item.status !== 'cancelled') || null
);
const showNotifications = ref(false);
const notifications = ref<NotificationRecord[]>([]);
const notificationsLoading = ref(false);
const unreadNotifications = ref(0);
const itemsPerPage = ref(20);
const currentPage = ref(1);
const compactLists = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | undefined;
let refreshTimer: ReturnType<typeof setInterval> | undefined;

const getToken = () => sessionStorage.getItem('dess_token') || '';
const headers = () => ({ Authorization: `Bearer ${getToken()}` });
const filteredCases = computed(() => allCases.value);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCases.value.length / itemsPerPage.value)));
const paginatedCases = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredCases.value.slice(start, start + itemsPerPage.value);
});
const stats = computed(() => ({
  closedCases: allCases.value.length,
  sharedEvidence: allCases.value.reduce((sum, item) => sum + sharedCount(item), 0),
  restrictedEvidence: allCases.value.reduce((sum, item) => sum + restrictedCount(item), 0)
}));

function syncUiPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem('dess_settings') || '{}');
    const requestedPageSize = Number(saved.itemsPerPage);
    itemsPerPage.value = [10, 20, 50].includes(requestedPageSize) ? requestedPageSize : 20;
    compactLists.value = saved.compactLists === true;
    currentPage.value = 1;
  } catch {
    itemsPerPage.value = 20;
    compactLists.value = false;
    currentPage.value = 1;
  }
}
function handleSettingsUpdated() {
  syncUiPreferences();
}

function sharedCount(caseItem: CaseRecord) { return caseItem.evidence.filter(item => item.availableToResearchers).length; }
function restrictedCount(caseItem: CaseRecord) { return caseItem.evidence.filter(item => !item.availableToResearchers).length; }
function sharedEvidence(caseItem: CaseRecord) { return caseItem.evidence.filter(item => item.availableToResearchers); }
function capitalizeCase(value: string) { return value ? value[0].toUpperCase() + value.slice(1) : 'Unclassified'; }
function initials(name?: string) { return (name || 'DESS').split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase(); }
function formatDate(value: string) { return value ? new Date(value).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not recorded'; }
function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return formatDate(value);
}
function activityIcon(kind: string) {
  if (kind === 'REPOSITORY_DISCUSSION_REPLY') return 'bi-chat-left-text';
  if (kind === 'RESEARCH_COLLABORATION_REQUEST' || kind === 'RESEARCH_COLLABORATION_RESPONSE') return 'bi-people';
  if (kind.includes('DELETION')) return 'bi-trash3';
  if (kind === 'EVIDENCE_UPLOAD') return 'bi-file-earmark-plus';
  if (kind === 'EVIDENCE_VISIBILITY') return 'bi-eye';
  return 'bi-info-circle';
}
function activityTone(kind: string) { return kind.includes('DELETION') ? 'tone-warning' : kind === 'EVIDENCE_UPLOAD' ? 'tone-success' : 'tone-info'; }

function scheduleSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  currentPage.value = 1;
  searchTimer = setTimeout(() => { void loadCases(); }, 250);
}

async function loadCases() {
  loading.value = true;
  error.value = '';
  try {
    const params = new URLSearchParams({ sortBy: sortBy.value, order: sortOrder.value });
    if (search.value.trim()) params.set('search', search.value.trim());
    if (caseTypeFilter.value) params.set('caseType', caseTypeFilter.value);
    if (evidenceTypeFilter.value) params.set('evidenceType', evidenceTypeFilter.value);
    if (organizationFilter.value) params.set('organization', organizationFilter.value);
    const response = await fetch(`${API_CONFIG.baseURL}/api/researcher/cases?${params}`, { headers: headers() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load repository');
    allCases.value = data.closedCases || [];
    availableEvidenceTypes.value = data.filters?.evidenceTypes || [];
    availableOrganizations.value = data.filters?.organizations || [];
    currentPage.value = 1;
    openCaseError.value = data.openCaseFound && search.value.trim() ? data.openCaseFound : null;
  } catch (loadError: any) {
    error.value = loadError?.message || 'Failed to load the research repository.';
  } finally {
    loading.value = false;
  }
}

async function loadNotifications() {
  notificationsLoading.value = true;
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/notifications?limit=8`, { headers: headers() });
    const data = await response.json();
    if (response.ok) {
      notifications.value = data.notifications || [];
      unreadNotifications.value = data.unreadCount || 0;
    }
  } catch {
    notifications.value = [];
  } finally {
    notificationsLoading.value = false;
  }
}

async function openNotification(notification: NotificationRecord) {
  if (!notification.readAt) {
    await fetch(`${API_CONFIG.baseURL}/api/notifications/${notification._id}/read`, { method: 'PATCH', headers: headers() });
    notification.readAt = new Date().toISOString();
    unreadNotifications.value = Math.max(0, unreadNotifications.value - 1);
  }
  if (notification.link) await router.push(notification.link);
}

async function saveBookmark(caseItem: CaseRecord, evidence?: EvidenceSummary) {
  const belongsToOpenCase = selectedCase.value?._id === caseItem._id;
  if (belongsToOpenCase) bookmarkNotice.value = '';
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/research-workspace/bookmarks`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: caseItem._id, ...(evidence ? { evidenceId: evidence._id } : {}) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 409) throw new Error(data.error || 'Could not save bookmark');
    const message = response.status === 409
      ? 'This item is already in your Research Workspace.'
      : evidence ? 'Evidence saved to your Research Workspace.' : 'Case saved to your Research Workspace.';
    if (belongsToOpenCase) bookmarkNotice.value = message;
    else error.value = message;
  } catch (bookmarkError: any) {
    const message = bookmarkError?.message || 'Could not save bookmark.';
    if (belongsToOpenCase) bookmarkNotice.value = message;
    else error.value = message;
  }
}

async function loadAccessRequests() {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/repository-governance/access-requests/mine`, { headers: headers(), credentials: 'include' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not load evidence access requests.');
    caseAccessRequests.value = data.requests || [];
  } catch (requestError: any) {
    accessRequestError.value = requestError?.message || 'Could not load evidence access requests.';
  }
}

async function submitAccessRequest() {
  if (!selectedCase.value || accessPurpose.value.trim().length < 20) return;
  submittingAccessRequest.value = true;
  accessRequestError.value = '';
  accessRequestNotice.value = '';
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/repository-governance/access-requests/${selectedCase.value._id}`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ purpose: accessPurpose.value.trim() })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not submit the evidence access request.');
    accessPurpose.value = '';
    accessRequestNotice.value = data.message || 'Your request was sent to the assigned case team.';
    await loadAccessRequests();
  } catch (requestError: any) {
    accessRequestError.value = requestError?.message || 'Could not submit the evidence access request.';
  } finally {
    submittingAccessRequest.value = false;
  }
}

async function cancelAccessRequest(requestId: string) {
  if (!requestId) return;
  cancellingAccessRequest.value = true;
  accessRequestError.value = '';
  accessRequestNotice.value = '';
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/repository-governance/access-requests/${encodeURIComponent(requestId)}/cancel`, {
      method: 'PATCH', headers: headers(), credentials: 'include'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not cancel the request.');
    accessRequestNotice.value = 'Your pending request was cancelled.';
    await loadAccessRequests();
  } catch (requestError: any) {
    accessRequestError.value = requestError?.message || 'Could not cancel the request.';
  } finally {
    cancellingAccessRequest.value = false;
  }
}

function openReport(targetType: 'case' | 'discussion', targetId: string, label: string) {
  reportTarget.value = { targetType, targetId, label };
  reportCategory.value = 'inaccurate_information';
  reportDescription.value = '';
  reportError.value = '';
  reportNotice.value = '';
}
function closeReportForm() {
  reportTarget.value = null;
  reportDescription.value = '';
  reportError.value = '';
  reportNotice.value = '';
}
async function submitRepositoryReport() {
  if (!reportTarget.value || reportDescription.value.trim().length < 10) return;
  submittingReport.value = true;
  reportError.value = '';
  reportNotice.value = '';
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/repository-governance/reports`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        targetType: reportTarget.value.targetType,
        targetId: reportTarget.value.targetId,
        category: reportCategory.value,
        description: reportDescription.value.trim()
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Could not submit the report.');
    reportNotice.value = data.message || 'Your report has been sent to the moderation team.';
    reportTarget.value = null;
    reportDescription.value = '';
    discussionNotice.value = reportNotice.value;
  } catch (submitError: any) {
    reportError.value = submitError?.message || 'Could not submit the report.';
  } finally {
    submittingReport.value = false;
  }
}

async function loadDiscussions(caseId: string) {
  discussionsLoading.value = true;
  discussionError.value = '';
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/repository-collaboration/cases/${caseId}/discussions`, { headers: headers() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load case discussions');
    discussions.value = data.discussions || [];
  } catch (loadError: any) {
    discussionError.value = loadError?.message || 'Could not load case discussions.';
  } finally {
    discussionsLoading.value = false;
  }
}

async function postDiscussion() {
  if (!selectedCase.value || !newDiscussionContent.value.trim()) return;
  postingDiscussion.value = true;
  discussionError.value = '';
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/repository-collaboration/cases/${selectedCase.value._id}/discussions`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newDiscussionContent.value.trim() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not post discussion');
    newDiscussionContent.value = '';
    await loadDiscussions(selectedCase.value._id);
  } catch (postError: any) {
    discussionError.value = postError?.message || 'Could not post discussion.';
  } finally {
    postingDiscussion.value = false;
  }
}

async function postDiscussionReply(thread: any) {
  if (!selectedCase.value || !discussionReplyContent.value.trim()) return;
  postingDiscussion.value = true;
  discussionError.value = '';
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/repository-collaboration/cases/${selectedCase.value._id}/discussions`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: discussionReplyContent.value.trim(), parentDiscussionId: thread._id })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not post reply');
    discussionReplyContent.value = '';
    replyingToDiscussionId.value = '';
    await loadDiscussions(selectedCase.value._id);
  } catch (postError: any) {
    discussionError.value = postError?.message || 'Could not post reply.';
  } finally {
    postingDiscussion.value = false;
  }
}

async function toggleDiscussionPin(thread: any) {
  if (!selectedCase.value) return;
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/repository-collaboration/discussions/${thread._id}/pin`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !thread.isPinned })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not update pin');
    await loadDiscussions(selectedCase.value._id);
  } catch (pinError: any) {
    discussionError.value = pinError?.message || 'Could not update pin.';
  }
}

async function removeDiscussion(item: any) {
  if (!selectedCase.value || !window.confirm('Remove this discussion post? Replies will remain in the thread.')) return;
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/repository-collaboration/discussions/${item._id}`, {
      method: 'DELETE',
      headers: headers()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not remove discussion');
    await loadDiscussions(selectedCase.value._id);
  } catch (removeError: any) {
    discussionError.value = removeError?.message || 'Could not remove discussion.';
  }
}

function startCollaborationInvite(author: any) {
  if (!author?._id || author._id === sessionUserId()) return;
  collaborationTarget.value = author;
  collaborationMessage.value = '';
}

function sessionUserId() {
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return String(user.id || user._id || '');
  } catch {
    return '';
  }
}

async function sendCollaborationInvite() {
  if (!selectedCase.value || !collaborationTarget.value?._id) return;
  sendingCollaborationInvite.value = true;
  discussionError.value = '';
  discussionNotice.value = '';
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/repository-collaboration/cases/${selectedCase.value._id}/collaboration-requests`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: collaborationTarget.value._id, message: collaborationMessage.value.trim() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not send collaboration invitation');
    collaborationTarget.value = null;
    collaborationMessage.value = '';
    discussionNotice.value = 'Collaboration invitation sent. Track its status in your Research Workspace.';
  } catch (inviteError: any) {
    discussionError.value = inviteError?.message || 'Could not send collaboration invitation.';
  } finally {
    sendingCollaborationInvite.value = false;
  }
}

async function loadRelatedCases(caseId: string) {
  relatedLoading.value = true;
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/researcher/cases/${caseId}/related`, { headers: headers() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load related cases');
    relatedCases.value = data.relatedCases || [];
  } catch {
    relatedCases.value = [];
  } finally {
    relatedLoading.value = false;
  }
}

async function inspectCase(caseItem: CaseRecord) {
  selectedCase.value = caseItem;
  activeCaseTab.value = 'overview';
  discussionError.value = '';
  discussionNotice.value = '';
  bookmarkNotice.value = '';
  discussions.value = [];
  newDiscussionContent.value = '';
  discussionReplyContent.value = '';
  replyingToDiscussionId.value = '';
  collaborationTarget.value = null;
  accessPurpose.value = '';
  accessRequestError.value = '';
  accessRequestNotice.value = '';
  reportTarget.value = null;
  relatedCases.value = [];
  void loadAccessRequests();
  void loadDiscussions(caseItem._id);
  void loadRelatedCases(caseItem._id);
}

function clearFilters() {
  search.value = '';
  caseTypeFilter.value = '';
  evidenceTypeFilter.value = '';
  organizationFilter.value = '';
  sortBy.value = 'createdAt';
  sortOrder.value = 'desc';
  currentPage.value = 1;
  void loadCases();
}

async function downloadCase(caseItem: CaseRecord) {
  downloadingId.value = caseItem._id;
  error.value = '';
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/researcher/cases/${caseItem._id}/download`, { headers: headers() });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Download failed');
    }
    const blob = await response.blob();
    const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || `${caseItem.caseId}-research-archive.zip`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (downloadError: any) {
    error.value = downloadError?.message || 'Could not download this case archive.';
  } finally {
    downloadingId.value = '';
  }
}

async function contactInvestigator() {
  const manager = openCaseError.value?.createdBy;
  if (!manager) return;
  const recipient = manager.id || manager._id || manager.userId;
  if (!recipient) {
    error.value = 'The case manager has no messaging account linked to this case.';
    return;
  }
  await router.push({ path: '/messages', query: { recipient: String(recipient), caseNumber: openCaseError.value.caseId } });
  openCaseError.value = null;
}

function handleResearcherActivity() { showNotifications.value = true; }
onMounted(() => {
  syncUiPreferences();
  window.addEventListener('dess-settings-updated', handleSettingsUpdated);
  void loadCases();
  void loadNotifications();
  window.addEventListener('open-researcher-notifications', handleResearcherActivity);
  refreshTimer = setInterval(() => { void loadNotifications(); }, 60000);
});
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
  if (refreshTimer) clearInterval(refreshTimer);
  window.removeEventListener('dess-settings-updated', handleSettingsUpdated);
  window.removeEventListener('open-researcher-notifications', handleResearcherActivity);
});
</script>

<style scoped>
.researcher-page {
  --repo-bg: #04152d;
  --repo-panel: #061d3a;
  --repo-line: #123d6b;
  --repo-text: #e7f2ff;
  --repo-muted: #9db9d8;
  min-height: calc(100vh - 56px);
  padding: 22px clamp(14px, 2.2vw, 32px) 34px;
  color: var(--repo-text);
  background-color: var(--repo-bg);
  background-image: linear-gradient(rgba(24, 93, 154, .07) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 93, 154, .07) 1px, transparent 1px);
  background-size: 34px 34px;
}
.repository-header,.repository-stats,.repository-toolbar,.case-results { width: min(1450px, 100%); margin-inline: auto; }
.repository-header { display: flex; align-items: center; gap: 14px; margin-bottom: 15px; }
.brand-mark { display: grid; width: 48px; height: 48px; flex: 0 0 48px; place-items: center; border: 1px solid #1d629a; border-radius: 10px; color: #82caff; background: #0a3156; font-size: 22px; }
.repository-title { min-width: 0; flex: 1; }
.repository-eyebrow,.section-eyebrow { margin: 0 0 5px; color: #5daeff; font-size: 9px; font-weight: 750; }
.repository-title h1 { margin: 0; color: #f0f7ff; font-size: 22px; font-weight: 750; }
.repository-title > p:last-child { margin: 4px 0 0; color: var(--repo-muted); font-size: 10px; }
.activity-button { position: relative; display: inline-flex; min-height: 36px; align-items: center; gap: 7px; padding: 7px 10px; border: 1px solid #1f527c; border-radius: 6px; color: #cde7ff; background: #082345; cursor: pointer; font-size: 10px; font-weight: 650; }
.unread-count { display: inline-grid; min-width: 17px; height: 17px; place-items: center; border-radius: 999px; color: #06203b; background: #5dc5ff; font-size: 8px; font-weight: 800; }
.repository-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(180px, 1.15fr); gap: 0; margin-bottom: 14px; border: 1px solid var(--repo-line); border-radius: 7px; background: rgba(6, 29, 58, .92); }
.stat-item { display: flex; min-width: 0; align-items: center; gap: 10px; padding: 12px 14px; border-right: 1px solid rgba(18, 61, 107, .8); }
.stat-icon { display: grid; width: 33px; height: 33px; flex: 0 0 33px; place-items: center; border-radius: 8px; color: #77c3ff; background: #0b3156; font-size: 16px; }
.stat-copy { display: grid; gap: 3px; }
.stat-copy small { color: #93afcd; font-size: 9px; }
.stat-copy strong { color: #e8f4ff; font-size: 17px; line-height: 1; }
.stat-aside { display: flex; align-items: center; gap: 8px; padding: 10px 14px; color: #9db9d8; font-size: 9px; line-height: 1.4; }
.stat-aside i { flex: 0 0 15px; color: #57d2ac; font-size: 15px; }
.activity-panel { width: min(1450px, 100%); margin: 0 auto 13px; padding: 13px; border: 1px solid var(--repo-line); border-radius: 7px; background: rgba(6, 29, 58, .96); }
.activity-heading,.results-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.activity-heading h2,.results-heading h2 { margin: 0; color: #e8f4ff; font-size: 14px; }
.icon-button { display: grid; width: 30px; height: 30px; place-items: center; border: 1px solid #21476d; border-radius: 5px; color: #adc8e2; background: transparent; cursor: pointer; }
.activity-list { display: grid; margin-top: 9px; }
.activity-row { display: flex; align-items: center; gap: 9px; padding: 9px 5px; border: 0; border-top: 1px solid #143553; color: inherit; text-align: left; background: transparent; cursor: pointer; }
.activity-mark { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 7px; font-size: 13px; }
.tone-warning { color: #ffd48a; background: rgba(150, 94, 0, .2); }.tone-success { color: #72f5ce; background: rgba(0, 130, 103, .23); }.tone-info { color: #90cdff; background: rgba(15, 88, 150, .27); }
.activity-copy { display: grid; min-width: 0; flex: 1; gap: 3px; }
.activity-copy strong { color: #dcecff; font-size: 10px; }
.activity-copy small { overflow: hidden; color: #9db9d8; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.activity-copy time { color: #7894b0; font-size: 8px; }
.activity-unread { width: 7px; height: 7px; border-radius: 50%; background: #3bbcff; }
.inline-state { padding: 12px 4px; color: #8ca9c6; font-size: 10px; }
.repository-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin-bottom: 15px; padding: 10px; border: 1px solid var(--repo-line); border-radius: 7px; background: rgba(6, 29, 58, .9); }
.clear-filters-button { display: inline-flex; min-height: 34px; align-items: center; gap: 5px; padding: 6px 9px; border: 1px solid #d8e8dd; border-radius: 5px; color: #267452; background: #fff; cursor: pointer; font-size: 9px; font-weight: 650; }
.clear-filters-button:hover { border-color: #9fd5b4; background: #f1faf5; }
.repository-discussion-panel { display: grid; gap: 10px; padding: 13px; border: 1px solid #e1eae4; border-radius: 8px; background: #fbfdfb; }
.discussion-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.discussion-heading h3 { margin: 0; color: #30463a; font-size: 12px; }
.discussion-heading small { display: block; max-width: 560px; margin-top: 4px; color: #819087; font-size: 8px; line-height: 1.5; }
.discussion-refresh,.discussion-actions button,.discussion-compose-footer button,.discussion-reply-form button,.collaboration-invite-panel button { display: inline-flex; align-items: center; gap: 5px; padding: 6px 9px; border: 1px solid #cfe5d7; border-radius: 5px; color: #267452; background: #fff; cursor: pointer; font-size: 8px; font-weight: 650; }
.discussion-refresh:disabled,.discussion-compose-footer button:disabled,.discussion-reply-form button:disabled,.collaboration-invite-panel button:disabled { opacity: .5; cursor: wait; }
.discussion-composer,.discussion-reply-form,.collaboration-invite-panel { display: grid; gap: 7px; padding: 10px; border: 1px solid #e3ece6; border-radius: 7px; background: #fff; }
.discussion-composer label { color: #3d5647; font-size: 9px; font-weight: 700; }
.discussion-composer textarea,.discussion-reply-form textarea,.collaboration-invite-panel textarea { width: 100%; padding: 8px; border: 1px solid #dfe9e2; border-radius: 5px; color: #30463a; background: #fbfdfb; font-size: 9px; resize: vertical; }
.discussion-compose-footer,.discussion-reply-form > div,.collaboration-invite-panel > div:last-child { display: flex; align-items: center; justify-content: flex-end; gap: 7px; }
.discussion-compose-footer small { margin-right: auto; color: #91a097; font-size: 8px; }
.discussion-compose-footer button,.collaboration-invite-panel > div:last-child button:last-child { border-color: #18ac78; color: #fff; background: #17ad78; }
.discussion-notice { padding: 8px 10px; border: 1px solid #cce8d7; border-radius: 5px; color: #287750; background: #f1faf4; font-size: 9px; }
.discussion-alert { padding: 8px 10px; border: 1px solid #f0d6c8; border-radius: 5px; color: #985b3c; background: #fff8f3; font-size: 9px; }
.discussion-empty { padding: 12px; border: 1px dashed #dfe9e2; border-radius: 6px; color: #87958c; text-align: center; font-size: 9px; }
.discussion-thread { padding: 10px; border: 1px solid #e6eee8; border-radius: 7px; background: #fff; }
.discussion-pinned { border-color: #b8dbc6; background: #f8fcf9; }
.discussion-author-row,.discussion-author { display: flex; align-items: center; gap: 8px; }
.discussion-author-row { justify-content: space-between; }
.discussion-author > span:last-child { display: grid; gap: 2px; }
.discussion-author strong { color: #344a3c; font-size: 9px; }
.discussion-author small { color: #8a9990; font-size: 8px; }
.discussion-avatar { display: grid; width: 28px; height: 28px; flex: 0 0 28px; place-items: center; border-radius: 50%; color: #27744f; background: #e6f4eb; font-size: 8px; font-weight: 800; }
.discussion-pin-label { color: #16865f; font-size: 8px; font-weight: 700; }
.discussion-content { margin: 9px 0; color: #52685a; font-size: 9px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.discussion-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.discussion-actions button { padding: 4px 7px; font-size: 8px; }
.discussion-replies { display: grid; gap: 7px; margin: 10px 0 0 15px; padding-left: 12px; border-left: 2px solid #e4eee7; }
.discussion-reply { padding: 8px; border-radius: 6px; background: #f8fbf9; }
.reply-avatar { width: 23px; height: 23px; flex-basis: 23px; }
.discussion-cancel { border-color: #e1e9e3 !important; color: #77877d !important; background: #fff !important; }
.collaboration-invite-panel { border-color: #cfe5d7; background: #f8fcf9; }
.collaboration-invite-panel strong,.collaboration-invite-panel small { display: block; color: #385444; font-size: 9px; }
.collaboration-invite-panel small { margin-top: 4px; color: #829187; font-size: 8px; line-height: 1.5; }
.related-cases-panel { display: grid; gap: 8px; padding: 12px; border: 1px solid #e1eae4; border-radius: 8px; background: #f8fbf9; }
.related-cases-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.related-cases-heading h3 { margin: 0; color: #30463a; font-size: 12px; }
.related-cases-heading > span { color: #819087; font-size: 8px; }
.related-case-list { display: grid; }
.related-case-row { display: flex; align-items: center; gap: 9px; padding: 9px 2px; border: 0; border-top: 1px solid #e7eee9; color: #344a3c; text-align: left; background: transparent; cursor: pointer; }
.related-case-row:hover { background: #f0f8f3; }
.related-case-icon { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 6px; color: #18875f; background: #e5f4eb; }
.related-case-copy { display: grid; min-width: 0; flex: 1; gap: 3px; }
.related-case-copy strong { color: #14845f; font-size: 9px; }
.related-case-copy small { overflow: hidden; color: #819087; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.related-case-row > i { color: #819087; font-size: 10px; }
.related-state { margin: 0; color: #819087; font-size: 9px; }
.case-search { display: flex; min-width: 180px; flex: 1; align-items: center; gap: 8px; padding: 0 9px; border: 1px solid #1b436b; border-radius: 5px; color: #8cabc9; background: #041a34; }
.case-search input { width: 100%; min-width: 0; height: 34px; border: 0; outline: 0; color: #e1efff; background: transparent; font-size: 10px; }
.case-search input::placeholder { color: #7894b0; }
.case-search kbd { padding: 2px 5px; border: 1px solid #31516f; border-radius: 3px; color: #8ca9c6; background: #0a2848; font-size: 8px; }
.sort-control { display: flex; align-items: center; gap: 7px; color: #9bb6d1; font-size: 9px; }
.sort-control select { min-height: 34px; padding: 6px 25px 6px 8px; border: 1px solid #21476d; border-radius: 5px; color: #dcecff; background: #061a33; font-size: 9px; }
.results-heading { margin-bottom: 9px; }
.results-heading h2 span { margin-left: 5px; color: #7ebcf1; font-size: 10px; font-weight: 500; }
.results-note { display: flex; align-items: center; gap: 6px; color: #8eaac5; font-size: 9px; }
.case-table-wrap { overflow-x: auto; border: 1px solid var(--repo-line); border-radius: 7px; background: rgba(6, 29, 58, .94); }
.case-table { width: 100%; border-collapse: collapse; }
.case-table th { padding: 10px 12px; border-bottom: 1px solid #1b436b; color: #88a6c4; text-align: left; font-size: 8px; font-weight: 750; text-transform: uppercase; }
.case-table td { padding: 12px; border-bottom: 1px solid rgba(18, 61, 107, .55); color: #bad0e6; vertical-align: middle; font-size: 10px; }
.case-table tbody tr:last-child td { border-bottom: 0; }
.case-cell { min-width: 210px; }
.case-cell strong,.case-cell span,.case-cell small { display: block; }
.case-cell strong { color: #9ed3ff; font-size: 9px; }
.case-cell span { margin-top: 3px; color: #e0edfa; font-weight: 650; }
.case-cell small { overflow: hidden; max-width: 350px; margin-top: 4px; color: #89a5c1; text-overflow: ellipsis; white-space: nowrap; }
.case-type { display: inline-flex; padding: 4px 7px; border: 1px solid #275279; border-radius: 4px; color: #c8dff3; background: #0a2949; font-size: 8px; }
.access-counts { display: grid; gap: 4px; white-space: nowrap; }
.shared-count,.restricted-count { display: inline-flex; align-items: center; gap: 5px; font-size: 9px; }
.shared-count { color: #78e1c4; }.restricted-count { color: #a4b9ce; }
.date-cell { color: #96afc7 !important; white-space: nowrap; font-size: 9px !important; }
.case-actions { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.details-button,.download-button,.evidence-save-button { display: inline-flex; min-height: 30px; align-items: center; gap: 5px; padding: 6px 8px; border: 1px solid #245478; border-radius: 5px; color: #b8d9f5; background: transparent; cursor: pointer; font-size: 9px; }
.details-button:hover { border-color: #3e8cc5; background: rgba(20, 84, 133, .25); }
.evidence-save-button { align-items: center; gap: 5px; padding: 5px 8px; border: 1px solid #245478; border-radius: 5px; color: #b8d9f5; background: transparent; cursor: pointer; font-size: 9px; }
.download-button { border-color: #1378cb; color: white; background: #086cbd; }
.download-button:hover:not(:disabled) { background: #1288e8; }
.download-button:disabled { opacity: .55; cursor: wait; }
.repository-state { display: flex; min-height: 180px; flex-direction: column; align-items: center; justify-content: center; gap: 9px; border: 1px solid var(--repo-line); border-radius: 7px; color: #92acc7; background: rgba(6, 29, 58, .88); font-size: 10px; text-align: center; }
.empty-state i { color: #4c88b8; font-size: 26px; }.empty-state strong { color: #d3e6f7; font-size: 12px; }.empty-state span { max-width: 320px; line-height: 1.5; }
.error-state { color: #ffbaba; }
.dialog-backdrop { position: fixed; z-index: 1100; inset: 0; display: grid; place-items: center; padding: 16px; background: rgba(0, 8, 20, .8); }
.case-dialog { display: flex; width: min(740px, 100%); max-height: 90vh; flex-direction: column; overflow: hidden; border: 1px solid #1c5785; border-radius: 8px; background: #071d39; box-shadow: 0 24px 70px rgba(0, 0, 0, .42); }
.dialog-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 17px; border-bottom: 1px solid #173b60; background: #0a2748; }
.dialog-header h2 { margin: 0; color: #eaf5ff; font-size: 16px; }.dialog-header p:last-child { margin: 4px 0 0; color: #a3bdd5; font-size: 10px; }
.dialog-content { display: grid; gap: 15px; overflow-y: auto; padding: 16px; }
.case-description span { color: #82a2c0; font-size: 8px; font-weight: 750; text-transform: uppercase; }.case-description p { margin: 5px 0 0; color: #c8dcef; font-size: 10px; line-height: 1.55; }
.evidence-heading { display: flex; align-items: end; justify-content: space-between; gap: 10px; }.evidence-heading h3 { margin: 0; color: #e3f0fc; font-size: 12px; }.access-legend { color: #76ddbf; font-size: 8px; }
.shared-evidence-list { display: grid; border-top: 1px solid #173b60; }.shared-evidence-row { display: flex; align-items: center; gap: 9px; padding: 9px 1px; border-bottom: 1px solid #173b60; }
.evidence-file-icon { display: grid; width: 30px; height: 30px; flex: 0 0 30px; place-items: center; border-radius: 6px; color: #80d5bf; background: #0b3c4b; }
.shared-evidence-copy { display: grid; min-width: 0; flex: 1; gap: 3px; }.shared-evidence-copy strong { color: #dcecff; font-size: 9px; }.shared-evidence-copy small { color: #90abc5; font-size: 8px; }.shared-evidence-copy code { overflow: hidden; color: #78c1f3; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.available-label { color: #71ddbd; font-size: 8px; white-space: nowrap; }.restricted-only { padding: 12px; border: 1px dashed #31516f; border-radius: 5px; color: #9db9d8; font-size: 9px; }
.restricted-summary { display: flex; align-items: flex-start; gap: 9px; padding: 10px; border: 1px solid #35516c; border-radius: 6px; color: #b5cbe0; background: rgba(10, 34, 59, .8); }.restricted-summary>i { flex: 0 0 14px; color: #8da7c0; }.restricted-summary span { display: grid; gap: 3px; }.restricted-summary strong { font-size: 9px; }.restricted-summary small { color: #8da8c3; font-size: 8px; line-height: 1.4; }
.dialog-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 16px; border-top: 1px solid #173b60; }.dialog-footer>span { color: #8faac5; font-size: 8px; }.open-case-status { display: flex; align-items: center; gap: 8px; padding: 11px; border: 1px solid rgba(255, 190, 80, .35); border-radius: 6px; color: #ffd48a; background: rgba(150, 94, 0, .16); font-size: 10px; line-height: 1.4; }
.case-manager { display: flex; align-items: center; gap: 9px; padding-top: 12px; border-top: 1px solid #173b60; }.person-initials { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid #24699e; border-radius: 50%; color: #bde2ff; background: #0b3b69; font-size: 10px; }.case-manager>span:last-child { display: grid; gap: 3px; }.case-manager strong { color: #e3f0fc; font-size: 10px; }.case-manager small { color: #91acc9; font-size: 8px; }

@media (max-width: 900px) {
  .repository-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .stat-aside { grid-column: 1 / -1; border-top: 1px solid rgba(18, 61, 107, .8); }
  .case-actions { flex-direction: column; align-items: stretch; }
}
@media (max-width: 650px) {
  .researcher-page { padding: 14px 10px 24px; }
  .repository-header { gap: 9px; }.brand-mark { width: 40px; height: 40px; flex-basis: 40px; font-size: 18px; }
  .repository-title h1 { font-size: 18px; }.repository-title > p:last-child { max-width: 225px; font-size: 9px; line-height: 1.4; }
  .activity-button { font-size: 0; }.activity-button i,.unread-count { font-size: 10px; }
  .repository-stats { grid-template-columns: 1fr 1fr; }.stat-item { padding: 9px; }.stat-item:nth-child(2) { border-right: 0; }.stat-item:nth-child(3) { border-top: 1px solid rgba(18, 61, 107, .8); }.stat-aside { grid-column: auto; border-top: 1px solid rgba(18, 61, 107, .8); }
  .repository-toolbar { flex-wrap: wrap; }.case-search { flex-basis: 100%; }.sort-control { flex: 1; justify-content: space-between; }.sort-control select { min-width: 0; max-width: 135px; }.order-control { max-width: 170px; }
  .results-heading { align-items: flex-start; flex-direction: column; gap: 5px; }
  .case-table,.case-table tbody,.case-table tr,.case-table td { display: block; width: 100%; }.case-table thead { display: none; }.case-table tr { padding: 8px 10px; border-bottom: 1px solid #173b60; }.case-table td { padding: 5px 2px; border: 0; }.case-cell small { max-width: 100%; }.case-actions { flex-direction: row; }.case-actions button { flex: 1; justify-content: center; }
  .dialog-footer { align-items: stretch; flex-direction: column; }.available-label { display: none; }
}


/* Brighter repository palette with clear case and evidence access states. */
.researcher-page {
  --repo-bg: #f1f6f3;
  --repo-panel: #ffffff;
  --repo-line: #e1eae4;
  --repo-text: #20342a;
  --repo-muted: #718479;
  padding: 22px clamp(14px, 2.2vw, 32px) 34px;
  color: var(--repo-text);
  background: #f1f6f3;
  background-image: radial-gradient(rgba(31, 131, 83, .045) .8px, transparent .8px);
  background-size: 18px 18px;
}
.brand-mark { border-color: #cce7d8; color: #16865f; background: #e4f4ea; }
.repository-eyebrow,.section-eyebrow { color: #15966c; }
.repository-title h1 { color: #1d3327; }
.repository-title > p:last-child { color: #718479; }
.activity-button { border-color: #cfe5d7; color: #257553; background: #fff; }
.activity-button:hover { border-color: #9fd8b7; background: #f4fbf6; }
.unread-count { color: #fff; background: #18ad78; }
.repository-stats { border-color: #e0e9e3; border-radius: 10px; background: #fff; box-shadow: 0 6px 20px rgba(35, 75, 50, .045); }
.stat-item { border-right-color: #edf2ee; }
.stat-icon { color: #18875f; background: #eaf7ef; }
.stat-copy small { color: #7c8d82; }
.stat-copy strong { color: #20392b; }
.stat-aside { color: #708277; }
.stat-aside i { color: #18a477; }
.activity-panel { border-color: #e0e9e3; border-radius: 10px; background: #fff; box-shadow: 0 6px 20px rgba(35, 75, 50, .045); }
.activity-heading h2,.results-heading h2 { color: #20392b; }
.icon-button { border-color: #e2ebe5; color: #75867b; background: #fff; }
.icon-button:hover { color: #13845d; background: #f1faf5; }
.activity-row { border-top-color: #edf2ee; }
.activity-copy strong { color: #344a3c; }
.activity-copy small { color: #77887d; }
.activity-copy time { color: #91a096; }
.activity-unread { background: #18b981; }
.inline-state { color: #839188; }
.repository-toolbar { border-color: #e0e9e3; border-radius: 10px; background: #fff; box-shadow: 0 5px 16px rgba(35, 75, 50, .04); }
.case-search { border-color: #e0e9e3; color: #829187; background: #f8fbf9; }
.case-search input { color: #263a2e; }
.case-search input::placeholder { color: #9aa89f; }
.case-search kbd { border-color: #e3ebe6; color: #78877e; background: #fff; }
.sort-control { color: #728278; }
.sort-control select { border-color: #dfe9e2; color: #30493a; background: #f9fcfa; }
.results-heading h2 span { color: #13966c; }
.results-note { color: #849289; }
.case-table-wrap { border-color: #e0e9e3; border-radius: 10px; background: #fff; box-shadow: 0 8px 24px rgba(35, 75, 50, .045); }
.case-table th { border-bottom-color: #e9f0eb; color: #829087; background: #f8fbf9; }
.case-table td { border-bottom-color: #edf2ee; color: #52685a; }
.case-table tbody tr:hover { background: #fbfefc; }
.case-cell strong { color: #14845f; }
.case-cell span { color: #2b4033; }
.case-cell small { color: #87958b; }
.case-type { border-color: #dbece1; color: #327653; background: #f0f8f3; }
.shared-count { color: #16895f; }.restricted-count { color: #87948b; }
.date-cell { color: #7d8b82 !important; }
.details-button,.download-button,.evidence-save-button { border-color: #cfe5d7; color: #257553; background: #fff; }
.details-button:hover { border-color: #a2d8b7; background: #f1faf5; }
.download-button { border-color: #18ac78; color: #fff; background: #17ad78; }
.download-button:hover:not(:disabled) { background: #0e9465; }
.repository-state { border-color: #e0e9e3; border-radius: 10px; color: #819087; background: #fff; }
.empty-state i { color: #8eb9a0; }.empty-state strong { color: #30463a; }.empty-state span { color: #849289; }
.dialog-backdrop { background: rgba(19, 39, 28, .48); }
.case-dialog { border-color: #e1eae4; border-radius: 12px; background: #fff; box-shadow: 0 24px 70px rgba(24, 57, 37, .2); }
.dialog-header { border-bottom-color: #eaf0ec; background: #f6faf7; }
.dialog-header h2 { color: #20372a; }.dialog-header p:last-child { color: #718479; }
.dialog-content { background: #fff; }
.case-description span { color: #168b64; }.case-description p { color: #52685a; }
.evidence-heading h3 { color: #30463a; }.access-legend { color: #138a60; }
.shared-evidence-list { border-top-color: #eaf0ec; }
.shared-evidence-row { border-bottom-color: #eaf0ec; }
.evidence-file-icon { color: #18875f; background: #eaf7ef; }
.shared-evidence-copy strong { color: #354d3f; }.shared-evidence-copy small { color: #819087; }.shared-evidence-copy code { color: #458b68; }
.available-label { color: #18875f; }
.restricted-only { border-color: #e1e9e3; color: #78887e; }
.restricted-summary { border-color: #e4ece6; color: #697b70; background: #f8fbf9; }
.restricted-summary>i { color: #8a9a90; }.restricted-summary small { color: #87958c; }
.dialog-footer { border-top-color: #eaf0ec; }.dialog-footer>span { color: #7d8c83; }
.open-case-status { border-color: #f0e0bf; color: #936d28; background: #fff9ed; }
.case-manager { border-top-color: #eaf0ec; }.person-initials { border-color: #d1e9da; color: #237b55; background: #e7f5eb; }
.case-manager strong { color: #30463a; }.case-manager small { color: #7d8d82; }
.repository-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid #e0e9e3; border-top: 0; border-radius: 0 0 10px 10px; color: #819087; background: #fff; font-size: .75rem; }
.pagination-actions { display: flex; align-items: center; gap: 10px; }
.pagination-actions span { color: #6f8175; font-size: .7rem; white-space: nowrap; }
.pagination-actions button { min-height: 32px; padding: 6px 10px; border: 1px solid #d8e8dd; border-radius: 6px; color: #267452; background: #fff; cursor: pointer; font-size: .72rem; font-weight: 650; }
.pagination-actions button:hover:not(:disabled) { border-color: #9fd5b4; background: #f1faf5; }
.pagination-actions button:disabled { opacity: .4; cursor: not-allowed; }
.compact-list-view .case-table td { padding-top: 7px; padding-bottom: 7px; }
.compact-list-view .case-table th { padding-top: 8px; padding-bottom: 8px; }

@media (max-width: 650px) {
  .repository-pagination { align-items: flex-start; flex-direction: column; }
  .pagination-actions { width: 100%; justify-content: space-between; }
  .stat-item { border-color: #edf2ee !important; }
}


/* Structured case detail window */
.case-dialog-redesigned {
  width: min(960px, 100%);
  max-height: min(92vh, 920px);
  border: 1px solid #dce9df;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 28px 90px rgba(15, 47, 30, .24);
}
.case-modal-header {
  display:flex; align-items:flex-start; justify-content:space-between; gap:18px;
  padding:20px 24px 17px; border-bottom:1px solid #edf2ee; background:#fff;
}
.case-modal-heading { display:flex; min-width:0; align-items:center; gap:14px; }
.case-modal-icon { display:grid; width:48px; height:48px; flex:0 0 48px; place-items:center; border:1px solid #d9ece0; border-radius:13px; color:#17845d; background:#eff8f2; font-size:21px; }
.case-modal-title { min-width:0; }
.case-modal-kickers { display:flex; align-items:center; flex-wrap:wrap; gap:9px; margin-bottom:5px; }
.case-modal-eyebrow,.case-section-eyebrow { color:#168b64; font-size:9px; font-weight:800; letter-spacing:.12em; }
.case-modal-status { display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:20px; color:#1d8158; background:#edf8f1; font-size:8px; font-weight:750; }
.case-modal-title h2 { margin:0; color:#20392b; font-size:clamp(17px,2.3vw,22px); font-weight:800; line-height:1.2; overflow-wrap:anywhere; }
.case-modal-title p { margin:4px 0 0; color:#809087; font-size:10px; font-weight:650; letter-spacing:.04em; }
.case-modal-close { display:grid; width:34px; height:34px; flex:0 0 34px; place-items:center; border:1px solid #e4ece6; border-radius:9px; color:#728278; background:#fff; cursor:pointer; }
.case-modal-close:hover { border-color:#cce5d5; color:#167b55; background:#f4faf6; }
.case-modal-summary { display:flex; flex-wrap:wrap; gap:8px 18px; padding:11px 24px; border-bottom:1px solid #edf2ee; background:#f9fcfa; }
.case-modal-summary span { display:inline-flex; align-items:center; gap:6px; color:#6e8075; font-size:9px; }
.case-modal-summary i { color:#168b64; font-size:11px; }
.case-detail-tabs { display:flex; gap:4px; padding:0 20px; border-bottom:1px solid #e8efe9; background:#fff; }
.case-detail-tabs button { position:relative; display:inline-flex; min-height:48px; align-items:center; gap:7px; padding:0 13px; border:0; color:#75867c; background:transparent; cursor:pointer; font-size:10px; font-weight:700; }
.case-detail-tabs button::after { position:absolute; right:10px; bottom:-1px; left:10px; height:2px; border-radius:2px 2px 0 0; background:transparent; content:""; }
.case-detail-tabs button.active { color:#137d57; }
.case-detail-tabs button.active::after { background:#18a675; }
.case-detail-tabs button small { display:grid; min-width:18px; height:18px; place-items:center; padding:0 5px; border-radius:20px; color:#698076; background:#f0f5f1; font-size:8px; }
.case-detail-tabs button.active small { color:#187a55; background:#e7f5ec; }
.case-modal-body { min-height:260px; flex:1; overflow-y:auto; padding:20px 24px 24px; background:#fbfdfb; }
.case-tab-panel { display:grid; gap:15px; }
.case-overview-layout { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(230px,.85fr); gap:14px; align-items:start; }
.case-info-card { padding:17px; border:1px solid #e4ece6; border-radius:12px; background:#fff; box-shadow:0 3px 12px rgba(28,69,42,.025); }
.case-section-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.case-section-heading h3,.discussion-heading h3 { margin:4px 0 0; color:#263f30; font-size:14px; font-weight:800; }
.case-description-card > p { margin:14px 0 0; color:#596e60; font-size:11px; line-height:1.75; white-space:pre-wrap; overflow-wrap:anywhere; }
.case-type-pill,.case-tab-count { display:inline-flex; padding:5px 9px; border:1px solid #dcece1; border-radius:20px; color:#277650; background:#f3faf5; font-size:8px; font-weight:750; text-transform:capitalize; }
.case-overview-side { display:grid; gap:12px; }
.access-card-status { display:flex; gap:10px; align-items:flex-start; margin-top:12px; }
.access-card-status > i { color:#17956a; font-size:19px; }
.access-card-status strong,.access-card-status small { display:block; }
.access-card-status strong { color:#31483a; font-size:10px; }
.access-card-status small { margin-top:4px; color:#829187; font-size:9px; line-height:1.5; }
.access-card-counts { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:14px; padding-top:12px; border-top:1px solid #edf2ee; }
.access-card-counts div { display:grid; gap:3px; }
.access-card-counts strong { color:#264b36; font-size:17px; }
.access-card-counts span { color:#819087; font-size:8px; }
.case-actions-card { display:grid; gap:6px; }
.case-actions-card > button,.case-actions-link { display:flex; align-items:center; gap:8px; padding:8px 9px; border:1px solid #edf2ee; border-radius:7px; color:#496653; text-align:left; background:#fbfdfb; cursor:pointer; font-size:9px; font-weight:650; }
.case-actions-link { align-items:center; gap:8px; padding:8px 9px; border:1px solid #edf2ee; border-radius:7px; color:#496653; text-decoration:none; background:#fbfdfb; font-size:9px; font-weight:650; }
.case-actions-link i { color:#198c63; }
.case-actions-link:hover { border-color:#cde6d6; color:#147b55; background:#f2faf5; }
.case-actions-card > button:hover { border-color:#cde6d6; color:#147b55; background:#f2faf5; }
.case-actions-card > button i { color:#198c63; }
.restricted-summary { border-color:#e2ebe5; color:#667a6d; background:#f7faf8; }
.restricted-summary small { color:#87958c; }
.case-tab-intro { align-items:flex-start; margin-bottom:2px; }
.case-tab-intro h3 { margin:4px 0 3px; color:#263f30; font-size:15px; font-weight:800; }
.case-tab-intro p { margin:4px 0 0; color:#809087; font-size:9px; line-height:1.5; }
.case-evidence-grid { display:grid; gap:9px; }
.case-evidence-card { display:flex; min-width:0; align-items:flex-start; gap:12px; padding:13px; border:1px solid #e3ece6; border-radius:10px; background:#fff; }
.case-evidence-icon { display:grid; width:36px; height:36px; flex:0 0 36px; place-items:center; border-radius:9px; color:#17885f; background:#edf8f1; font-size:16px; }
.case-evidence-main { display:grid; min-width:0; flex:1; gap:5px; }
.case-evidence-main > strong { color:#30483a; font-size:10px; overflow-wrap:anywhere; }
.case-evidence-main > p { margin:0; color:#73847a; font-size:9px; line-height:1.5; }
.case-evidence-meta { display:flex; flex-wrap:wrap; gap:5px; }
.case-evidence-meta span { padding:3px 7px; border-radius:20px; color:#64796a; background:#f2f6f3; font-size:8px; text-transform:capitalize; }
.case-evidence-main code { display:block; overflow:hidden; color:#438765; font-size:8px; text-overflow:ellipsis; white-space:nowrap; }
.case-evidence-card .evidence-save-button { flex:0 0 auto; align-self:center; gap:6px; border-color:#d4e9dc; color:#237b53; font-size:9px; }
.case-tab-empty { display:grid; min-height:170px; align-content:center; justify-items:center; gap:8px; padding:25px; border:1px dashed #d9e7dd; border-radius:12px; color:#84958a; text-align:center; background:#fff; }
.case-tab-empty > i { color:#7cae8d; font-size:25px; }
.case-tab-empty strong { color:#3c5846; font-size:11px; }
.case-tab-empty span { max-width:360px; color:#84958a; font-size:9px; line-height:1.55; }
.case-subtle-button { display:inline-flex; align-items:center; gap:6px; padding:7px 10px; border:1px solid #dce9e0; border-radius:7px; color:#557361; background:#fff; cursor:pointer; font-size:9px; }
.case-subtle-button:disabled { opacity:.5; cursor:wait; }
.related-case-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
.related-case-card { display:flex; min-width:0; align-items:flex-start; gap:10px; padding:12px; border:1px solid #e2ebe5; border-radius:10px; color:inherit; text-align:left; background:#fff; cursor:pointer; }
.related-case-card:hover { border-color:#c7e4d2; background:#f7fcf8; }
.related-case-card-icon { display:grid; width:34px; height:34px; flex:0 0 34px; place-items:center; border-radius:9px; color:#18865e; background:#edf8f1; }
.related-case-card-copy { display:grid; min-width:0; flex:1; gap:4px; }
.related-case-card-copy strong { color:#16865e; font-size:9px; }
.related-case-card-copy b { color:#344b3b; font-size:10px; overflow-wrap:anywhere; }
.related-case-card-copy small { color:#809087; font-size:8px; line-height:1.45; }
.related-case-open { margin-left:auto; color:#8aa092; font-size:11px; }
.case-discussion-tab .repository-discussion-panel { gap:11px; padding:0; border:0; background:transparent; }
.case-discussion-tab .discussion-heading { align-items:center; padding:0 0 11px; border-bottom:1px solid #e6eee8; }
.case-discussion-tab .discussion-heading h3 { font-size:14px; }
.case-discussion-tab .discussion-heading small { max-width:620px; color:#829187; font-size:9px; }
.case-discussion-tab .discussion-composer { padding:13px; border-color:#dfeae3; border-radius:10px; background:#fff; }
.case-discussion-tab .discussion-composer textarea,.case-discussion-tab .discussion-reply-form textarea,.case-discussion-tab .collaboration-invite-panel textarea { min-height:74px; border-color:#dbe7df; border-radius:8px; color:#30483a; background:#fbfdfb; font-size:10px; }
.case-discussion-tab .discussion-thread { padding:14px; border-color:#e1ebe4; border-radius:10px; background:#fff; }
.case-discussion-tab .discussion-thread.discussion-pinned { border-color:#c4e4cf; background:#f7fcf8; }
.case-discussion-tab .discussion-content { color:#52685a; font-size:10px; line-height:1.65; }
.case-discussion-tab .discussion-replies { margin-left:18px; }
.case-discussion-tab .discussion-reply { border:1px solid #edf2ee; border-radius:8px; background:#f9fcfa; }
.case-modal-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 20px; border-top:1px solid #e8efe9; background:#fff; }
.case-modal-footer > span { display:inline-flex; align-items:center; gap:7px; color:#7d8c82; font-size:8px; line-height:1.4; }
.case-modal-footer > span i { color:#19936a; font-size:12px; }
.case-modal-footer > div { display:flex; align-items:center; gap:8px; }
.case-footer-close { min-height:34px; padding:7px 12px; border:1px solid #e1e9e3; border-radius:7px; color:#617369; background:#fff; cursor:pointer; font-size:9px; font-weight:650; }
.case-modal-footer .download-button { min-height:34px; padding:7px 12px; border-radius:7px; font-size:9px; font-weight:750; }
@media (max-width:720px) {
  .dialog-backdrop { display:block; padding:0; }
  .case-dialog-redesigned { width:100%; height:100%; max-height:100dvh; border:0; border-radius:0; }
  .case-modal-header { padding:15px 15px 12px; }
  .case-modal-summary { gap:7px 12px; padding:9px 15px; }
  .case-modal-summary span { font-size:8px; }
  .case-detail-tabs { justify-content:space-between; gap:0; padding:0 8px; }
  .case-detail-tabs button { min-height:46px; gap:5px; padding:0 8px; font-size:8px; }
  .case-detail-tabs button span { max-width:78px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .case-modal-body { padding:14px 13px 20px; }
  .case-overview-layout { grid-template-columns:1fr; }
  .case-overview-side { grid-template-columns:1fr; }
  .related-case-grid { grid-template-columns:1fr; }
  .case-evidence-card { gap:8px; padding:10px; }
  .case-evidence-card .evidence-save-button { padding:6px; }
  .case-evidence-card .evidence-save-button span { display:none; }
  .case-modal-footer { align-items:stretch; flex-direction:column; padding:10px 13px calc(10px + env(safe-area-inset-bottom)); }
  .case-modal-footer > div { width:100%; }
  .case-modal-footer > div button { flex:1; justify-content:center; }
  .case-discussion-tab .discussion-heading { align-items:flex-start; }
  .case-discussion-tab .discussion-replies { margin-left:8px; padding-left:8px; }
}
@media (max-width:420px) {
  .case-modal-icon { width:39px; height:39px; flex-basis:39px; font-size:18px; }
  .case-modal-title h2 { font-size:16px; }
  .case-modal-status { font-size:7px; }
  .case-detail-tabs button { flex-direction:column; justify-content:center; gap:2px; min-width:0; padding:4px 6px; }
  .case-detail-tabs button small { position:absolute; top:4px; right:0; min-width:15px; height:15px; font-size:7px; }
  .case-modal-summary { display:grid; grid-template-columns:1fr 1fr; }
  .case-modal-footer > span { font-size:7px; }
}


/* Case Repository: immersive research workspace visual refresh */
.case-dialog-redesigned {
  display: flex;
  width: min(1180px, calc(100vw - 64px));
  height: min(900px, 90vh);
  max-height: 90vh;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #d7e7dc;
  border-radius: 20px;
  background: #f8fbf9;
  box-shadow: 0 32px 100px rgba(13, 43, 27, .30);
}
.case-modal-header {
  min-height: 104px;
  align-items: center;
  padding: 22px 28px;
  border-bottom: 1px solid #e2ede5;
  background:
    radial-gradient(circle at 78% 5%, rgba(30, 171, 116, .12), transparent 28%),
    linear-gradient(115deg, #ffffff 0%, #f7fcf8 100%);
}
.case-modal-heading { gap: 17px; }
.case-modal-icon {
  width: 58px;
  height: 58px;
  flex-basis: 58px;
  border: 1px solid #c9e7d4;
  border-radius: 17px;
  color: #0e875b;
  background: linear-gradient(145deg, #eaf8ef, #d9f1e2);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 6px 18px rgba(27, 129, 82, .08);
  font-size: 24px;
}
.case-modal-kickers { gap: 10px; margin-bottom: 7px; }
.case-modal-eyebrow { font-size: 10px; letter-spacing: .16em; }
.case-modal-status { padding: 5px 10px; font-size: 9px; }
.case-modal-title h2 { font-size: clamp(21px, 2.1vw, 28px); letter-spacing: -.035em; }
.case-modal-title p { margin-top: 6px; font-size: 11px; }
.case-modal-close { width: 38px; height: 38px; flex-basis: 38px; border-radius: 11px; font-size: 13px; }
.case-modal-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 14px 26px;
  border-bottom: 1px solid #e6eee8;
  background: #fff;
}
.case-modal-summary span {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 10px;
  padding: 8px 11px;
  border: 1px solid #edf2ee;
  border-radius: 10px;
  color: #536d5d;
  background: #fbfdfb;
  font-size: 10px;
  font-weight: 650;
}
.case-modal-summary i { color: #15966b; font-size: 15px; }
.case-workspace-layout {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: 224px minmax(0, 1fr);
  overflow: hidden;
  background: #f7faf8;
}
.case-workspace-sidebar {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 15px;
  padding: 22px 14px 16px;
  border-right: 1px solid #e1ebe4;
  background: linear-gradient(180deg, #f4faf6 0%, #f9fcfa 100%);
}
.workspace-sidebar-label {
  padding: 0 11px;
  color: #8a9b90;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .15em;
}
.case-workspace-sidebar .case-detail-tabs {
  display: grid;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
}
.case-workspace-sidebar .case-detail-tabs button {
  display: flex;
  width: 100%;
  min-height: 46px;
  align-items: center;
  gap: 11px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: #65796c;
  text-align: left;
  background: transparent;
  font-size: 11px;
  font-weight: 700;
  transition: background .16s ease, border-color .16s ease, color .16s ease;
}
.case-workspace-sidebar .case-detail-tabs button::after { display: none; }
.case-workspace-sidebar .case-detail-tabs button > i { width: 18px; color: #80978a; font-size: 15px; text-align: center; }
.case-workspace-sidebar .case-detail-tabs button > span { flex: 1; }
.case-workspace-sidebar .case-detail-tabs button > small { min-width: 21px; height: 21px; border: 1px solid #e5eee8; color: #6e8677; background: #fff; font-size: 9px; }
.case-workspace-sidebar .case-detail-tabs button:hover { border-color: #e0ece4; color: #26734f; background: rgba(255,255,255,.72); }
.case-workspace-sidebar .case-detail-tabs button.active {
  border-color: #cce8d6;
  color: #116c48;
  background: #e9f7ee;
  box-shadow: 0 4px 12px rgba(30, 125, 77, .06);
}
.case-workspace-sidebar .case-detail-tabs button.active > i { color: #109765; }
.case-workspace-sidebar .case-detail-tabs button.active > small { border-color: #d2eadb; color: #16764e; background: #f8fdf9; }
.case-sidebar-access {
  display: grid;
  gap: 8px;
  margin-top: auto;
  padding: 14px 13px;
  border: 1px solid #dcebe1;
  border-radius: 12px;
  background: linear-gradient(145deg, #ffffff, #f4faf6);
  box-shadow: 0 5px 18px rgba(25, 90, 52, .035);
}
.sidebar-access-icon {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border-radius: 9px;
  color: #16875b;
  background: #e7f6ec;
  font-size: 15px;
}
.case-sidebar-access strong { color: #2d4b38; font-size: 11px; }
.case-sidebar-access p { margin: 0; color: #819187; font-size: 9px; line-height: 1.55; }
.sidebar-access-counts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding-top: 9px; border-top: 1px solid #eaf1ec; }
.sidebar-access-counts span { display: grid; gap: 2px; color: #839188; font-size: 8px; }
.sidebar-access-counts b { color: #2a6141; font-size: 15px; }
.case-workspace-layout .case-modal-body {
  min-width: 0;
  min-height: 0;
  max-height: none;
  flex: 1;
  overflow: auto;
  padding: 26px clamp(20px, 2.8vw, 36px) 32px;
  background: #f8fbf9;
  scrollbar-color: #c8d9ce transparent;
}
.case-workspace-layout .case-tab-panel { gap: 18px; }
.case-workspace-layout .case-info-card { padding: 21px; border-color: #e1ebe4; border-radius: 14px; box-shadow: 0 5px 18px rgba(27, 75, 43, .035); }
.case-workspace-layout .case-section-eyebrow { font-size: 9px; letter-spacing: .14em; }
.case-workspace-layout .case-section-heading h3,
.case-workspace-layout .discussion-heading h3 { font-size: 17px; }
.case-workspace-layout .case-description-card > p { font-size: 13px; line-height: 1.8; }
.case-workspace-layout .access-card-status strong { font-size: 12px; }
.case-workspace-layout .access-card-status small { font-size: 10px; }
.case-workspace-layout .case-actions-card > button,
.case-workspace-layout .case-actions-link { min-height: 38px; font-size: 10px; }
.case-workspace-layout .case-tab-intro h3 { font-size: 19px; }
.case-workspace-layout .case-tab-intro p { font-size: 11px; }
.case-workspace-layout .case-evidence-card { padding: 16px; border-radius: 12px; box-shadow: 0 4px 14px rgba(27, 75, 43, .025); }
.case-workspace-layout .case-evidence-main > strong { font-size: 12px; }
.case-workspace-layout .case-evidence-main > p { font-size: 11px; }
.case-workspace-layout .case-evidence-meta span { font-size: 9px; }
.case-workspace-layout .case-evidence-main code { font-size: 9px; }
.case-workspace-layout .related-case-card { min-height: 92px; padding: 15px; border-radius: 12px; }
.case-workspace-layout .related-case-card-copy strong { font-size: 10px; }
.case-workspace-layout .related-case-card-copy b { font-size: 12px; }
.case-workspace-layout .related-case-card-copy small { font-size: 9px; }
.case-workspace-layout .case-discussion-tab .discussion-heading small { font-size: 10px; line-height: 1.55; }
.case-workspace-layout .case-discussion-tab .discussion-composer { padding: 17px; border-radius: 12px; }
.case-workspace-layout .case-discussion-tab .discussion-composer textarea,
.case-workspace-layout .case-discussion-tab .discussion-reply-form textarea,
.case-workspace-layout .case-discussion-tab .collaboration-invite-panel textarea { font-size: 12px; }
.case-workspace-layout .case-discussion-tab .discussion-thread { padding: 17px; border-radius: 12px; }
.case-workspace-layout .case-discussion-tab .discussion-content { font-size: 12px; line-height: 1.75; }
.case-modal-footer { min-height: 58px; padding: 11px 24px; }
.case-modal-footer > span { font-size: 9px; }
.case-footer-close { min-height: 37px; font-size: 10px; }
.case-modal-footer .download-button { min-height: 37px; font-size: 10px; }
@media (max-width: 820px) {
  .case-dialog-redesigned { width: min(100vw - 28px, 1180px); height: min(94vh, 900px); max-height: 94vh; }
  .case-workspace-layout { grid-template-columns: 190px minmax(0, 1fr); }
  .case-workspace-sidebar { padding-right: 10px; padding-left: 10px; }
  .case-modal-summary { padding-right: 18px; padding-left: 18px; }
  .case-modal-summary span { padding: 7px 8px; font-size: 9px; }
  .case-workspace-layout .case-modal-body { padding: 22px 18px 26px; }
}
@media (max-width: 650px) {
  .case-dialog-redesigned { width: 100%; height: 100%; max-height: 100dvh; border: 0; border-radius: 0; }
  .case-modal-header { min-height: 82px; padding: 14px 15px; }
  .case-modal-icon { width: 43px; height: 43px; flex-basis: 43px; border-radius: 12px; font-size: 19px; }
  .case-modal-title h2 { font-size: 19px; }
  .case-modal-summary { grid-template-columns: 1fr 1fr; gap: 7px; padding: 10px 13px; }
  .case-modal-summary span { min-height: 37px; font-size: 8px; }
  .case-workspace-layout { display: flex; min-height: 0; flex: 1; flex-direction: column; }
  .case-workspace-sidebar { flex: 0 0 auto; gap: 8px; padding: 9px 10px 7px; border-right: 0; border-bottom: 1px solid #e1ebe4; }
  .workspace-sidebar-label,.case-sidebar-access { display: none; }
  .case-workspace-sidebar .case-detail-tabs { display: flex; gap: 5px; overflow-x: auto; padding: 0 0 2px; scrollbar-width: none; }
  .case-workspace-sidebar .case-detail-tabs::-webkit-scrollbar { display: none; }
  .case-workspace-sidebar .case-detail-tabs button { width: auto; min-width: max-content; min-height: 42px; gap: 6px; padding: 0 11px; border-radius: 8px; font-size: 9px; }
  .case-workspace-sidebar .case-detail-tabs button > i { width: auto; font-size: 13px; }
  .case-workspace-sidebar .case-detail-tabs button > small { min-width: 18px; height: 18px; font-size: 8px; }
  .case-workspace-layout .case-modal-body { padding: 16px 13px 22px; }
  .case-workspace-layout .case-info-card { padding: 16px; }
  .case-workspace-layout .case-description-card > p { font-size: 12px; }
  .case-overview-layout { grid-template-columns: 1fr; }
  .case-overview-side { grid-template-columns: 1fr; }
  .case-modal-footer { padding: 9px 12px calc(9px + env(safe-area-inset-bottom)); }
  .case-modal-footer > div { width: 100%; }
  .case-modal-footer > div button { flex: 1; }
}
@media (max-width: 390px) {
  .case-modal-summary { grid-template-columns: 1fr 1fr; }
  .case-modal-summary span { gap: 6px; font-size: 7px; }
  .case-modal-title h2 { font-size: 16px; }
  .case-modal-status { font-size: 7px; }
  .case-detail-tabs button { flex-direction: row; }
}


/* Phase 6 — Case Repository access requests and reporting */
.repository-access-card,.repository-report-form {
  display:grid; gap:13px; padding:18px; border:1px solid #dcebe1; border-radius:13px;
  background:linear-gradient(145deg,#fff,#f5faf6); box-shadow:0 5px 18px rgba(25,90,52,.035);
}
.repository-access-heading { display:flex; align-items:flex-start; gap:12px; }
.repository-access-icon { display:grid; width:38px; height:38px; flex:0 0 38px; place-items:center; border-radius:10px; color:#16875b; background:#e7f6ec; font-size:17px; }
.repository-access-heading strong { color:#2d4b38; font-size:12px; }
.repository-access-heading p,.report-form-heading p { margin:4px 0 0; color:#7c8c82; font-size:10px; line-height:1.6; }
.access-request-form,.repository-report-form { display:grid; gap:10px; }
.access-request-form label,.repository-report-form label { display:grid; gap:6px; color:#4c6655; font-size:10px; font-weight:700; }
.access-request-form textarea,.repository-report-form textarea,.repository-report-form select {
  width:100%; min-height:74px; padding:10px; border:1px solid #d7e6dc; border-radius:8px; color:#30483a; background:#fff; font-size:10px; resize:vertical;
}
.repository-report-form { margin-bottom:16px; border-color:#d9e8df; }
.report-form-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
.report-form-heading h3 { margin:4px 0 0; color:#294432; font-size:15px; }
.report-form-heading p { max-width:560px; }
.report-form-actions,.access-request-actions { display:flex; justify-content:space-between; align-items:center; gap:10px; }
.report-form-actions small,.access-request-actions small { color:#8a9a90; font-size:8px; }
.report-form-actions button,.access-request-actions button {
  min-height:34px; padding:7px 12px; border:1px solid #159968; border-radius:7px; color:#fff; background:#169c6b; cursor:pointer; font-size:9px; font-weight:750;
}
.report-form-actions button:disabled,.access-request-actions button:disabled { opacity:.45; cursor:not-allowed; }
.access-request-state { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 11px; border:1px solid #dcebe1; border-radius:8px; color:#52705d; background:#fff; font-size:9px; }
.access-request-state > span { display:flex; flex-wrap:wrap; align-items:center; gap:6px; }
.access-request-state i { color:#168e62; }
.access-security-note { display:flex; align-items:center; gap:6px; color:#8a9a90; font-size:8px; }
.governance-error,.governance-notice { margin:0; padding:8px 10px; border-radius:7px; font-size:9px; }
.governance-error { color:#a84b4b; background:#fff0f0; }
.governance-notice { color:#277650; background:#eaf7ef; }
@media(max-width:650px) {
  .repository-access-card,.repository-report-form { padding:13px; }
  .report-form-heading,.access-request-state { align-items:flex-start; flex-direction:column; }
  .report-form-actions,.access-request-actions { align-items:stretch; flex-direction:column; }
  .report-form-actions button,.access-request-actions button { width:100%; }
}

</style>
