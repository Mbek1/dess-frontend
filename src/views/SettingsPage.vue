<template>
  <main class="settings-page">
    <header class="settings-header">
      <div>
        <p class="settings-eyebrow"><i class="bi bi-sliders2" aria-hidden="true"></i> ACCOUNT / PREFERENCES</p>
        <h1>Settings</h1>
        <p class="settings-intro">Choose how DESS looks and how its workspace behaves in this browser.</p>
      </div>
      <button class="settings-back" type="button" @click="goBack">
        <i class="bi bi-arrow-left" aria-hidden="true"></i>
        <span>Back to {{ roleHomeLabel }}</span>
      </button>
    </header>

    <div class="settings-layout">
      <div class="settings-main">
        <section class="settings-panel">
          <div class="panel-heading">
            <span class="panel-icon"><i class="bi bi-display-fill" aria-hidden="true"></i></span>
            <div><h2>Appearance</h2><p>Apply a theme across the DESS workspace.</p></div>
          </div>
          <fieldset class="theme-fieldset">
            <legend>Theme</legend>
            <div class="theme-options">
              <label v-for="theme in themes" :key="theme.value" class="theme-option" :class="{ selected: settings.theme === theme.value }">
                <input v-model="settings.theme" type="radio" name="theme" :value="theme.value" />
                <i class="bi" :class="theme.icon" aria-hidden="true"></i>
                <span>{{ theme.label }}</span>
              </label>
            </div>
          </fieldset>
          <label class="preference-row" for="compact-lists">
            <span class="preference-copy">
              <strong>Compact lists</strong>
              <small>Reduce row spacing in the case repository and message list.</small>
            </span>
            <span class="switch-control">
              <input id="compact-lists" v-model="settings.compactLists" type="checkbox" role="switch" />
              <span class="switch-track" aria-hidden="true"></span>
            </span>
          </label>
        </section>

        <section class="settings-panel">
          <div class="panel-heading">
            <span class="panel-icon"><i class="bi bi-folder2-open" aria-hidden="true"></i></span>
            <div><h2>Research repository</h2><p>Set how many archived cases appear on each page.</p></div>
          </div>
          <label class="setting-select-row" for="items-per-page">
            <span>
              <strong>Cases per page</strong>
              <small>This setting controls the repository's working pagination.</small>
            </span>
            <span class="number-select-wrap">
              <select id="items-per-page" v-model.number="settings.itemsPerPage">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
              <span>cases</span>
            </span>
          </label>
        </section>

        <section class="settings-panel">
          <div class="panel-heading">
            <span class="panel-icon"><i class="bi bi-chat-square-text-fill" aria-hidden="true"></i></span>
            <div><h2>Messages &amp; activity</h2><p>Control the message and notification elements shown in your workspace.</p></div>
          </div>
          <label class="preference-row" for="notification-badges">
            <span class="preference-copy">
              <strong>Show unread badges</strong>
              <small>Display unread counts beside Messages and Notifications in the navigation bar.</small>
            </span>
            <span class="switch-control">
              <input id="notification-badges" v-model="settings.showNotificationBadges" type="checkbox" role="switch" />
              <span class="switch-track" aria-hidden="true"></span>
            </span>
          </label>
          <label class="preference-row" for="message-previews">
            <span class="preference-copy">
              <strong>Show message previews</strong>
              <small>Show the latest message text in the conversation list.</small>
            </span>
            <span class="switch-control">
              <input id="message-previews" v-model="settings.showMessagePreviews" type="checkbox" role="switch" />
              <span class="switch-track" aria-hidden="true"></span>
            </span>
          </label>
          <label class="preference-row" for="confirm-delete">
            <span class="preference-copy">
              <strong>Confirm before deleting conversations</strong>
              <small>Ask before removing a conversation from your own message view.</small>
            </span>
            <span class="switch-control">
              <input id="confirm-delete" v-model="settings.confirmBeforeDelete" type="checkbox" role="switch" />
              <span class="switch-track" aria-hidden="true"></span>
            </span>
          </label>
        </section>

        <section class="settings-panel security-card">
          <div class="panel-heading">
            <span class="panel-icon"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i></span>
            <div><h2>Current session</h2><p>Account details for this signed-in browser session.</p></div>
          </div>
          <dl class="session-details">
            <div><dt>Name</dt><dd>{{ sessionUser.name || 'Not available' }}</dd></div>
            <div><dt>Email</dt><dd>{{ sessionUser.email || 'Not available' }}</dd></div>
            <div><dt>Role</dt><dd>{{ roleLabel }}</dd></div>
            <div><dt>Session</dt><dd>Signed in on this browser</dd></div>
          </dl>
          <p class="settings-note"><i class="bi bi-info-circle" aria-hidden="true"></i> These preferences are saved in this browser only. They do not change server-side permissions, password policy or authentication expiry.</p>
          <button class="session-button" type="button" @click="showSessionDetails = true">
            <i class="bi bi-person-lock" aria-hidden="true"></i><span>View session details</span><i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        </section>

        <div v-if="error" class="settings-feedback error-feedback" role="alert">
          <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i> {{ error }}
        </div>
        <div v-if="saved" class="settings-feedback success-feedback" role="status">
          <i class="bi bi-check-circle-fill" aria-hidden="true"></i> Preferences saved and applied.
        </div>
      </div>

      <aside class="settings-aside">
        <section class="settings-panel summary-panel">
          <div class="panel-heading">
            <span class="panel-icon"><i class="bi bi-check2-circle" aria-hidden="true"></i></span>
            <div><h2>Preference summary</h2><p>Current selection</p></div>
          </div>
          <div class="summary-line"><span>Appearance</span><strong>{{ themeLabel }}</strong></div>
          <div class="summary-line"><span>Repository page size</span><strong>{{ settings.itemsPerPage }} cases</strong></div>
          <div class="summary-line"><span>List density</span><strong>{{ settings.compactLists ? 'Compact' : 'Comfortable' }}</strong></div>
          <div class="summary-line"><span>Message previews</span><strong>{{ settings.showMessagePreviews ? 'Shown' : 'Hidden' }}</strong></div>
          <div class="summary-line"><span>Unread badges</span><strong>{{ settings.showNotificationBadges ? 'Shown' : 'Hidden' }}</strong></div>
          <div class="summary-status">
            <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
            <span>{{ isDirty ? 'Unsaved changes' : 'All changes saved' }}</span>
          </div>
        </section>

        <section class="settings-panel security-card">
          <div class="panel-heading">
            <span class="panel-icon"><i class="bi bi-info-circle-fill" aria-hidden="true"></i></span>
            <div><h2>What these settings do</h2></div>
          </div>
          <ul>
            <li><i class="bi bi-palette-fill" aria-hidden="true"></i><span>Theme changes apply to the repository, messages and settings workspaces.</span></li>
            <li><i class="bi bi-list-ul" aria-hidden="true"></i><span>Repository page size and compact lists change how records are displayed.</span></li>
            <li><i class="bi bi-eye" aria-hidden="true"></i><span>Message preview and unread badge options control what appears in your interface.</span></li>
          </ul>
        </section>

        <div class="settings-actions">
          <button class="save-button" type="button" :disabled="isSaving || !isDirty" @click="saveSettings">
            <i class="bi" :class="isSaving ? 'bi-arrow-repeat' : 'bi-floppy-fill'" aria-hidden="true"></i>
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button class="reset-button" type="button" @click="resetSettings">
            <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Reset to defaults
          </button>
        </div>
      </aside>
    </div>

    <div v-if="showSessionDetails" class="dialog-backdrop" @click.self="showSessionDetails = false">
      <section class="session-dialog" role="dialog" aria-modal="true" aria-labelledby="session-dialog-title">
        <div class="dialog-heading">
          <div class="panel-icon"><i class="bi bi-person-lock" aria-hidden="true"></i></div>
          <button class="close-dialog" type="button" aria-label="Close session details" @click="showSessionDetails = false"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
        </div>
        <h2 id="session-dialog-title">Current session</h2>
        <p class="dialog-description">Details loaded from the active browser session.</p>
        <dl class="session-details">
          <div><dt>Name</dt><dd>{{ sessionUser.name || 'Not available' }}</dd></div>
          <div><dt>Email</dt><dd>{{ sessionUser.email || 'Not available' }}</dd></div>
          <div><dt>Role</dt><dd>{{ roleLabel }}</dd></div>
        </dl>
        <button class="save-button dialog-done" type="button" @click="showSessionDetails = false">Done</button>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

type ThemeChoice = 'light' | 'dark' | 'system';

interface UiSettings {
  theme: ThemeChoice;
  itemsPerPage: number;
  compactLists: boolean;
  showNotificationBadges: boolean;
  showMessagePreviews: boolean;
  confirmBeforeDelete: boolean;
}

const router = useRouter();
const isSaving = ref(false);
const saved = ref(false);
const error = ref('');
const showSessionDetails = ref(false);
const sessionUser = ref<{ name?: string; email?: string; role?: string }>({});

const defaultSettings: UiSettings = {
  theme: 'light',
  itemsPerPage: 20,
  compactLists: false,
  showNotificationBadges: true,
  showMessagePreviews: true,
  confirmBeforeDelete: true
};

const themes = [
  { value: 'light', label: 'Light', icon: 'bi-sun-fill' },
  { value: 'dark', label: 'Dark', icon: 'bi-moon-stars-fill' },
  { value: 'system', label: 'System', icon: 'bi-circle-half' }
] as const;

const settings = ref<UiSettings>({ ...defaultSettings });
const savedSnapshot = ref(JSON.stringify(defaultSettings));
const roleLabel = computed(() => {
  const role = sessionUser.value.role || 'user';
  return role.charAt(0).toUpperCase() + role.slice(1);
});
const roleHomeLabel = computed(() => sessionUser.value.role === 'researcher' ? 'Repository' : sessionUser.value.role === 'admin' ? 'Admin Panel' : 'Dashboard');
const themeLabel = computed(() => themes.find(theme => theme.value === settings.value.theme)?.label || 'Light');
const isDirty = computed(() => JSON.stringify(settings.value) !== savedSnapshot.value);

function getRole() {
  return sessionUser.value.role || sessionStorage.getItem('dess_user_role') || localStorage.getItem('dess_user_role') || '';
}

function goBack() {
  const role = getRole();
  if (role === 'researcher') router.push('/researcher');
  else if (role === 'investigator') router.push('/investigator');
  else if (role === 'admin') router.push('/admin');
  else router.push('/');
}

function readSessionUser() {
  try {
    sessionUser.value = JSON.parse(sessionStorage.getItem('user') || '{}');
  } catch {
    sessionUser.value = {};
  }
}

function normalizeSettings(value: any): UiSettings {
  const saved = value && typeof value === 'object' ? value : {};
  const requestedPageSize = Number(saved.itemsPerPage);
  const legacyTheme = saved.theme === 'auto' ? 'system' : saved.theme;
  return {
    theme: ['light', 'dark', 'system'].includes(legacyTheme) ? legacyTheme : defaultSettings.theme,
    itemsPerPage: [10, 20, 50].includes(requestedPageSize) ? requestedPageSize : defaultSettings.itemsPerPage,
    compactLists: saved.compactLists === true,
    showNotificationBadges: saved.showNotificationBadges !== false,
    showMessagePreviews: saved.showMessagePreviews !== false,
    confirmBeforeDelete: saved.confirmBeforeDelete !== false
  };
}

function loadSettings() {
  readSessionUser();
  try {
    settings.value = normalizeSettings(JSON.parse(localStorage.getItem('dess_settings') || 'null'));
  } catch {
    settings.value = { ...defaultSettings };
  }
  savedSnapshot.value = JSON.stringify(settings.value);
}

function applyTheme(theme: ThemeChoice) {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  document.documentElement.dataset.dessTheme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.dataset.dessThemeChoice = theme;
}

function saveSettings() {
  isSaving.value = true;
  error.value = '';
  saved.value = false;
  try {
    settings.value = normalizeSettings(settings.value);
    localStorage.setItem('dess_settings', JSON.stringify(settings.value));
    applyTheme(settings.value.theme);
    savedSnapshot.value = JSON.stringify(settings.value);
    saved.value = true;
    window.dispatchEvent(new CustomEvent('dess-settings-updated', { detail: settings.value }));
  } catch {
    error.value = 'Could not save preferences in this browser.';
  } finally {
    isSaving.value = false;
  }
}

function resetSettings() {
  if (!window.confirm('Reset your DESS preferences to their defaults?')) return;
  settings.value = { ...defaultSettings };
  saveSettings();
}

onMounted(() => {
  loadSettings();
  applyTheme(settings.value.theme);
});
</script>

<style scoped>
.settings-page {
  --settings-bg: #f1f6f3;
  --panel-bg: #fff;
  --line: #e1eae4;
  --text-main: #21372a;
  --text-muted: #738379;
  --blue: #168c67;
  --green: #18ad78;
  min-height: calc(100vh - 56px);
  padding: 22px clamp(14px, 2.4vw, 34px) 36px;
  color: var(--text-main);
  background: #f1f6f3;
  background-image: radial-gradient(rgba(31, 131, 83, .045) .8px, transparent .8px);
  background-size: 18px 18px;
}
.settings-header,.settings-layout { width: min(1320px, 100%); margin-inline: auto; }
.settings-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.settings-eyebrow { display: flex; align-items: center; gap: 7px; margin: 0 0 7px; color: #15966c; font-size: 10px; font-weight: 750; }
.settings-header h1 { margin: 0; color: #20372a; font-size: 25px; font-weight: 750; }
.settings-intro { margin: 5px 0 0; color: var(--text-muted); font-size: 12px; }
.settings-back,.save-button,.reset-button,.session-button {
  display: inline-flex; min-height: 38px; align-items: center; justify-content: center; gap: 8px;
  padding: 8px 12px; border: 1px solid #cfe5d7; border-radius: 6px; color: #287653;
  background: #fff; cursor: pointer; font-size: 11px; font-weight: 650; transition: .16s ease;
}
.settings-back:hover,.reset-button:hover,.session-button:hover { border-color: #9fd5b4; color: #126b4b; background: #f1faf5; }
.settings-layout { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(280px, .8fr); gap: 14px; align-items: start; }
.settings-main,.settings-aside { display: grid; min-width: 0; gap: 12px; }
.settings-panel { padding: 17px; border: 1px solid var(--line); border-radius: 9px; background: #fff; box-shadow: 0 7px 22px rgba(35, 75, 50, .045); }
.panel-heading { display: flex; align-items: center; gap: 11px; margin-bottom: 12px; }
.panel-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border: 1px solid #d4ebdc; border-radius: 8px; color: #17875e; background: #eaf7ef; font-size: 16px; }
.panel-heading h2 { margin: 0; color: #253a2d; font-size: 14px; font-weight: 700; }
.panel-heading p { margin: 3px 0 0; color: #7c8c81; font-size: 10px; }
.preference-row { display: flex; min-height: 60px; align-items: center; justify-content: space-between; gap: 16px; padding: 11px 2px; border-top: 1px solid #edf2ee; cursor: pointer; }
.preference-copy { display: grid; min-width: 0; gap: 4px; }
.preference-copy strong { color: #31483a; font-size: 11px; font-weight: 650; }
.preference-copy small { color: #829087; font-size: 10px; line-height: 1.4; }
.switch-control { position: relative; display: inline-flex; width: 40px; height: 22px; flex: 0 0 40px; align-items: center; }
.switch-control input { position: absolute; z-index: 1; width: 40px; height: 22px; margin: 0; opacity: 0; cursor: pointer; }
.switch-track { position: absolute; inset: 0; border: 1px solid #cad8ce; border-radius: 999px; background: #e6ece8; transition: background .16s ease, border-color .16s ease; }
.switch-track::after { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.18); content: ''; transition: transform .16s ease; }
.switch-control input:checked + .switch-track { border-color: #18ad78; background: #18ad78; }
.switch-control input:checked + .switch-track::after { transform: translateX(18px); }
.switch-control input:focus-visible + .switch-track { outline: 2px solid #71c1a0; outline-offset: 3px; }
.theme-fieldset { margin: 0 0 13px; padding: 0; border: 0; }
.theme-fieldset legend { margin-bottom: 8px; color: #596d60; font-size: 10px; font-weight: 650; }
.theme-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.theme-option { display: flex; min-height: 43px; align-items: center; justify-content: center; gap: 7px; padding: 8px; border: 1px solid #e0eae3; border-radius: 6px; color: #718177; background: #fbfdfb; cursor: pointer; font-size: 10px; }
.theme-option.selected { border-color: #9fd6b5; color: #176d4c; background: #f0faf4; box-shadow: inset 0 0 0 1px rgba(24, 173, 120, .12); }
.theme-option input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.theme-option:focus-within { outline: 2px solid #71c1a0; outline-offset: 2px; }
.theme-option i { color: #21976a; font-size: 14px; }
.setting-select-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-top: 13px; border-top: 1px solid #edf2ee; }
.setting-select-row > span:first-child { display: grid; gap: 4px; }
.setting-select-row strong { color: #31483a; font-size: 11px; }
.setting-select-row small { color: #829087; font-size: 10px; }
.number-select-wrap { display: inline-flex; align-items: center; gap: 7px; color: #77877c; font-size: 10px; }
.number-select-wrap select { min-width: 76px; min-height: 34px; padding: 6px 8px; border: 1px solid #dce8df; border-radius: 6px; color: #31483a; background: #fff; }
.settings-note { display: flex; align-items: flex-start; gap: 7px; margin: 10px 0 13px; color: #7f8f84; font-size: 10px; line-height: 1.5; }
.settings-note i { flex: 0 0 13px; color: #29986c; }
.session-button { width: 100%; justify-content: flex-start; border-color: #e0eae3; background: #fbfdfb; }
.session-button i:last-child { margin-left: auto; font-size: 10px; }
.summary-panel { border-color: #d8e9de; }
.summary-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 0; border-top: 1px solid #edf2ee; font-size: 10px; }
.summary-line span { color: #7d8d82; }
.summary-line strong { color: #354b3d; font-size: 10px; text-align: right; }
.summary-status { display: flex; align-items: center; gap: 7px; margin-top: 8px; padding: 10px; border: 1px solid #dcefe3; border-radius: 6px; color: #1d8057; background: #f1faf5; font-size: 10px; font-weight: 650; }
.security-card ul { display: grid; gap: 11px; margin: 0; padding: 0; list-style: none; }
.security-card li { display: flex; align-items: flex-start; gap: 9px; color: #697c70; font-size: 10px; line-height: 1.45; }
.security-card li i { flex: 0 0 14px; color: #29986c; font-size: 12px; }
.session-details { display: grid; gap: 0; margin: 0; }
.session-details div { display: flex; justify-content: space-between; gap: 14px; padding: 10px 0; border-top: 1px solid #edf2ee; font-size: 11px; }
.session-details dt { color: #7d8d82; }
.session-details dd { margin: 0; color: #354b3d; text-align: right; overflow-wrap: anywhere; }
.settings-actions { display: grid; gap: 8px; }
.save-button { min-height: 40px; border-color: #18ad78; color: white; background: #17ad78; }
.save-button:hover:not(:disabled) { border-color: #0e9465; background: #0e9465; color: white; }
.save-button:disabled { opacity: .58; cursor: default; }
.reset-button { width: 100%; min-height: 38px; }
.settings-feedback { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 6px; font-size: 11px; }
.error-feedback { border: 1px solid #f0d3d1; color: #a33e39; background: #fff6f5; }
.success-feedback { border: 1px solid #d8ebdf; color: #247d55; background: #f1faf5; }
.dialog-backdrop { position: fixed; z-index: 1100; inset: 0; display: grid; place-items: center; padding: 16px; background: rgba(19, 39, 28, .48); }
.session-dialog { width: min(440px, 100%); padding: 20px; border: 1px solid #dce9df; border-radius: 9px; color: #273b2f; background: #fff; box-shadow: 0 24px 70px rgba(0, 0, 0, .2); }
.dialog-heading { display: flex; align-items: center; justify-content: space-between; }
.close-dialog { display: grid; width: 32px; height: 32px; place-items: center; border: 1px solid #e0eae3; border-radius: 6px; color: #718177; background: transparent; cursor: pointer; }
.session-dialog h2 { margin: 14px 0 4px; color: #24382c; font-size: 17px; }
.dialog-description { margin: 0 0 14px; color: #78887e; font-size: 11px; }
.dialog-done { width: 100%; margin-top: 15px; }
@media (max-width: 850px) {
  .settings-layout { grid-template-columns: minmax(0, 1fr); }
  .settings-aside { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
  .settings-actions { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .settings-page { padding: 16px 12px 26px; }
  .settings-header { align-items: flex-start; }
  .settings-header h1 { font-size: 22px; }
  .settings-intro { max-width: 280px; line-height: 1.45; }
  .settings-back { min-height: 34px; padding: 7px 9px; font-size: 0; }
  .settings-back i { font-size: 13px; }
  .settings-aside { grid-template-columns: minmax(0, 1fr); }
  .settings-actions { grid-template-columns: minmax(0, 1fr); }
  .settings-panel { padding: 14px; }
  .theme-options { gap: 5px; }
  .theme-option { flex-direction: column; min-height: 55px; gap: 4px; padding: 6px 3px; font-size: 9px; }
  .preference-row { gap: 10px; }
}
</style>
