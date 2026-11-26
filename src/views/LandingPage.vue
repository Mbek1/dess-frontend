<!-- Removed duplicate template block -->
<template>
  <div>
    <!-- Header -->
    <header id="header" class="header d-flex align-items-center fixed-top">
      <div class="container-fluid container-xl position-relative d-flex align-items-center justify-content-between">
        <a href="#" @click.prevent="scrollToSection('hero')" class="logo d-flex align-items-center" aria-label="DESS home">
          <img src="/img/dess-logo.svg" alt="DESS — Digital Evidence Storage System" class="landing-brand-logo" />
        </a>
        <nav id="navmenu" class="navmenu">
          <ul>
            <li><a href="#" data-scroll-target="hero" class="active" @click.prevent="scrollToSection('hero')">Home</a></li>
            <li><a href="#" data-scroll-target="about" @click.prevent="scrollToSection('about')">About DESS</a></li>
            <li><a href="#" data-scroll-target="how-it-works" @click.prevent="scrollToSection('how-it-works')">How It Works</a></li>
            <li><a href="#" data-scroll-target="features" @click.prevent="scrollToSection('features')">Features</a></li>
            <li><a href="#" data-scroll-target="audience" @click.prevent="scrollToSection('audience')">Who It's For</a></li>
            <li><a href="#" data-scroll-target="faq" @click.prevent="scrollToSection('faq')">FAQs</a></li>
          </ul>
          <i class="mobile-nav-toggle d-xl-none bi bi-list"></i>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section id="hero" class="hero section py-5 bg-dark text-white">
      <div class="container">
        <div class="row align-items-center gy-4">
          <div class="col-lg-7">
            <p class="text-success fw-semibold text-uppercase mb-3" style="letter-spacing: .12em; font-size: .78rem;">Investigative research & case management</p>
            <h1 class="display-4 fw-bold">Digital Evidence <span class="text-success">Storage System</span></h1>
            <p class="lead">Bring investigative information together in one connected environment. DESS supports people and teams conducting research, managing case information and collaborating across academic, professional and organisational settings.</p>
            <div class="d-flex flex-wrap gap-3 mt-4">
              <button class="btn btn-success btn-lg" @click="showAuth = true">Get Started <i class="bi bi-arrow-right ms-1"></i></button>
              <a href="#" @click.prevent="scrollToSection('how-it-works')" class="btn btn-outline-light btn-lg">Explore How It Works</a>
            </div>
            <div class="d-flex flex-wrap gap-3 mt-4 small text-white-50">
              <span><i class="bi bi-folder-check text-success me-1"></i> Connected case records</span>
              <span><i class="bi bi-fingerprint text-success me-1"></i> Controlled information access</span>
              <span><i class="bi bi-people text-success me-1"></i> Research and team collaboration</span>
            </div>
          </div>
          <div class="col-lg-5 text-center">
            <img src="/img/hero-img.png" class="img-fluid animated" alt="Digital evidence and case research illustration" style="max-height: 340px;" />
          </div>
        </div>
      </div>
      <LoginModal v-if="showAuth" @close="showAuth = false" />
    </section>

    <!-- About Section -->
    <section id="about" class="about section py-5 bg-white">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-xl-5 mb-4 mb-xl-0">
            <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">About DESS</p>
            <h2 class="fw-bold">A connected workspace for investigative work.</h2>
            <p class="text-muted">Investigative work often involves information, records, evidence and people spread across different teams and systems. DESS brings these elements into a structured environment, supporting both research into documented cases and the management of active investigative work.</p>
            <a href="#" @click.prevent="scrollToSection('how-it-works')" class="btn btn-link text-success px-0">See how DESS works <i class="bi bi-arrow-right"></i></a>
          </div>
          <div class="col-xl-7">
            <div class="row g-4">
              <div class="col-md-6">
                <div class="p-4 border rounded-3 h-100">
                  <i class="bi bi-folder2-open fs-2 text-success"></i>
                  <h5 class="mt-3">Case-centred records</h5>
                  <p class="mb-0 text-muted">Keep case identifiers, descriptions, team details, evidence and updates connected in a single case record.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-4 border rounded-3 h-100">
                  <i class="bi bi-fingerprint fs-2 text-success"></i>
                  <h5 class="mt-3">Evidence with context</h5>
                  <p class="mb-0 text-muted">Keep evidence connected to its case with descriptions, classifications and supporting metadata.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-4 border rounded-3 h-100">
                  <i class="bi bi-journal-text fs-2 text-success"></i>
                  <h5 class="mt-3">Documented case activity</h5>
                  <p class="mb-0 text-muted">Record case updates and review time-stamped activity so that important context does not get lost.</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="p-4 border rounded-3 h-100">
                  <i class="bi bi-people fs-2 text-success"></i>
                  <h5 class="mt-3">Controlled collaboration</h5>
                  <p class="mb-0 text-muted">Support collaboration through workspace-specific access controls, case discussions and team communication.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features section py-5 bg-light">
      <div class="container">
        <div class="text-center mb-4">
          <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">Platform capabilities</p>
          <h2 class="fw-bold">Everything stays connected to the case.</h2>
          <p class="text-muted mx-auto" style="max-width: 680px;">DESS helps users move from locating a case to understanding its evidence and collaborating around its context.</p>
        </div>
        <div class="row g-4">
          <div class="col-md-3 col-6" v-for="feature in features" :key="feature.title">
            <div class="text-center p-4 border rounded-3 bg-white h-100">
              <i :class="feature.icon + ' fs-1 text-success'"></i>
              <h6 class="mt-3 mb-0">{{ feature.title }}</h6>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Audience Section -->
    <section id="audience" class="py-5 bg-white">
      <div class="container">
        <div class="text-center mb-4">
          <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">Who DESS is for</p>
          <h2 class="fw-bold">For people and teams involved in investigative research.</h2>
        </div>
        <div class="row g-4">
          <div class="col-md-4">
            <article class="p-4 border rounded-3 h-100">
              <i class="bi bi-mortarboard fs-2 text-success"></i>
              <h5 class="mt-3">Students</h5>
              <p class="text-muted mb-0">Explore structured case examples, understand how evidence relates to an investigation and strengthen practical digital-forensics learning.</p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="p-4 border rounded-3 h-100">
              <i class="bi bi-search fs-2 text-success"></i>
              <h5 class="mt-3">Researchers</h5>
              <p class="text-muted mb-0">Search archived cases, compare related case records and review evidence that has been approved for research access.</p>
            </article>
          </div>
          <div class="col-md-4">
            <article class="p-4 border rounded-3 h-100">
              <i class="bi bi-shield-check fs-2 text-success"></i>
              <h5 class="mt-3">Practitioners</h5>
              <p class="text-muted mb-0">Organize case evidence, record updates, work with assigned teams and preserve useful investigative context.</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="details section py-5 bg-light">
      <div class="container">
        <div class="text-center mb-4">
          <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">A simple workflow</p>
          <h2 class="fw-bold">From case discovery to collaboration.</h2>
        </div>
        <div class="row g-4">
          <div class="col-lg-6" v-for="(detail, index) in details" :key="detail.title">
            <article class="p-4 p-lg-5 border rounded-3 bg-white h-100">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <span class="badge text-bg-success mb-2">{{ detail.label }}</span>
                  <h3 class="h4 fw-bold mb-1">{{ detail.title }}</h3>
                  <p class="text-muted mb-0">{{ detail.description }}</p>
                </div>
                <i :class="detail.icon + ' fs-1 text-success ms-3'"></i>
              </div>
              <div class="row g-3 mt-2">
                <div class="col-sm-6" v-for="(item, itemIndex) in detail.items" :key="item">
                  <div class="d-flex gap-2 h-100">
                    <span class="text-success fw-bold">{{ String(itemIndex + 1).padStart(2, '0') }}</span>
                    <span>{{ item }}</span>
                  </div>
                </div>
              </div>
              <div class="mt-4 pt-3 border-top">
                <button class="btn btn-success" @click="showAuth = true">{{ detail.action }} <i class="bi bi-arrow-right ms-1"></i></button>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="faq section py-5 bg-white">
      <div class="container">
        <div class="text-center mb-4">
          <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">Good to know</p>
          <h2 class="fw-bold">Frequently asked questions.</h2>
        </div>
        <div class="accordion mx-auto" id="faqAccordion" style="max-width: 900px;">
          <div class="accordion-item" v-for="(faq, idx) in faqs" :key="faq.q">
            <h2 class="accordion-header" :id="'heading' + idx">
              <button
                class="accordion-button"
                :class="{ collapsed: openFaqIndex !== idx }"
                type="button"
                :aria-expanded="openFaqIndex === idx"
                :aria-controls="'collapse' + idx"
                @click="toggleFaq(idx)"
              >
                <i class="bi bi-question-circle me-2 text-success"></i>{{ faq.q }}
              </button>
            </h2>
            <div
              :id="'collapse' + idx"
              class="accordion-collapse collapse"
              :class="{ show: openFaqIndex === idx }"
              :aria-labelledby="'heading' + idx"
            >
              <div class="accordion-body text-muted">{{ faq.a }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Access / Call to Action -->
    <section id="access" class="py-5 bg-dark text-white">
      <div class="container text-center">
        <p class="text-success fw-semibold text-uppercase mb-2" style="letter-spacing: .1em; font-size: .75rem;">Start exploring</p>
        <h2 class="fw-bold">Make every case a learning opportunity.</h2>
        <p class="lead text-white-50 mx-auto mt-3" style="max-width: 760px;">Whether your work is academic, professional or organisational, DESS provides tools to explore documented cases, manage investigative information and collaborate with relevant people.</p>
        <button class="btn btn-success btn-lg mt-3" @click="showAuth = true">Get Started <i class="bi bi-arrow-right ms-1"></i></button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer py-4 bg-dark text-white">
      <div class="container text-center">
        <p class="mb-2"><img src="/img/dess-logo.svg" alt="DESS — Digital Evidence Storage System" class="footer-brand-logo" /></p>
        <small class="d-block text-white-50">A connected platform for investigative research, case information and collaboration.</small>
        <small class="d-block text-white-50 mt-2">&copy; {{ new Date().getFullYear() }} DESS. For research and collaboration; not a replacement for official evidence-handling or court procedures.</small>
      </div>
    </footer>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import LoginModal from '../components/LoginModal.vue';

const features = [
  { icon: 'bi bi-search', title: 'Case Search & Discovery' },
  { icon: 'bi bi-folder-check', title: 'Case-linked Evidence' },
  { icon: 'bi bi-journal-text', title: 'Documented Case Updates' },
  { icon: 'bi bi-diagram-3', title: 'Related-case Discovery' },
  { icon: 'bi bi-card-checklist', title: 'Evidence Metadata & Records' },
  { icon: 'bi bi-shield-lock', title: 'Role-based Access' },
  { icon: 'bi bi-clock-history', title: 'Activity & Audit Trails' },
  { icon: 'bi bi-chat-square-text', title: 'Case-team Messaging' },
];
const details = [
  {
    label: 'Research workspace',
    icon: 'bi bi-journal-bookmark',
    title: 'Case Repository',
    description: 'Explore documented cases, build research and connect with others working on related topics.',
    action: 'Enter Case Repository',
    items: [
      'Search and discover closed case records and related cases',
      'Review evidence and information approved for research access',
      'Save cases, organise bookmarks, notes and research collections',
      'Discuss cases, share findings and send collaboration requests',
    ],
  },
  {
    label: 'Operational workspace',
    icon: 'bi bi-shield-lock',
    title: 'DESS Portal',
    description: 'Manage investigative casework, keep evidence organised and coordinate authorised case teams.',
    action: 'Enter DESS Portal',
    items: [
      'Create cases and maintain structured case information',
      'Upload, describe and link evidence to the relevant case',
      'Coordinate assigned team members through case communication',
      'Track case activity and manage access through role-based controls',
    ],
  },
];
const faqs = [
  { q: 'What is DESS?', a: 'DESS is a connected platform that supports investigative research and case management. It provides two workspaces: the Case Repository for research and collaboration, and the DESS Portal for managing investigative casework.' },
  { q: 'Who is DESS designed for?', a: 'DESS can support students, academic researchers, institutions, investigative teams and organisations that need to study documented cases, organise case information or collaborate on investigative work.' },
  { q: 'Can researchers view every case and every file?', a: 'No. Research access is permission-controlled. Researchers can browse closed case records and only the evidence files that have been approved for research access.' },
  { q: 'Can I ask about a related case that is still open?', a: 'When a search identifies a relevant open case, the repository can provide a way to contact the case lead through DESS internal messaging. The open case evidence itself remains restricted.' },
  { q: 'How does DESS support evidence integrity?', a: 'Evidence records can include descriptive metadata and supporting file information. DESS also maintains time-stamped activity records for supported case actions.' },
  { q: 'Does DESS determine whether evidence is admissible in court?', a: 'No. DESS supports evidence organization, research and collaboration. Legal admissibility and official evidence-handling requirements remain subject to the relevant laws, policies and procedures.' },
];

const showAuth = ref(false);
const openFaqIndex = ref<number | null>(null);

function toggleFaq(index: number) {
  openFaqIndex.value = openFaqIndex.value === index ? null : index;
}

function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;
  const margin = Number.parseInt(getComputedStyle(section).scrollMarginTop || '0', 10) || 0;
  const top = section.getBoundingClientRect().top + window.scrollY - margin;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

</script>

<style scoped>
.landing-brand-logo { display: block; width: 205px; max-width: 42vw; height: 54px; object-fit: contain; object-position: left center; }
.footer-brand-logo { display: inline-block; width: 190px; max-width: 70vw; height: 48px; object-fit: contain; }
@media (max-width: 575px) { .landing-brand-logo { width: 165px; height: 45px; } }
</style>
