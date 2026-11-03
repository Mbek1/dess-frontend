<template>
  <main class="settings-page">
    <header class="settings-header">
      <div>
        <p class="settings-eyebrow"><i class="bi bi-sliders2" aria-hidden="true"></i> ACCOUNT / PREFERENCES</p>
        <h1>Settings</h1>
        <p class="settings-intro">Manage how DESS looks and how account preferences are stored.</p>
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
            <span class="panel-icon"><i class="bi bi-bell-fill" aria-hidden="true"></i></span>
            <div>
              <h2>Notifications</h2>
              <p>Choose which activity preferences are saved for this browser.</p>
            </div>
          </div>

          <label class="preference-row" for="email-notifications">
            <span class="preference-copy">
              <strong>Email notifications</strong>
              <small>Receive updates about case activity and messages.</small>
            </span>
            <span class="switch-control">
              <input id="email-notifications" v-model="settings.emailNotifications" type="checkbox" role="switch" />
              <span class="switch-track" aria-hidden="true"></span>
            </span>
          </label>
          <label class="preference-row" for="weekly-digest">
            <span class="preference-copy">
              <strong>Weekly digest</strong>
              <small>Include a weekly activity summary in your preferences.</small>
            </span>
            <span class="switch-control">
              <input id="weekly-digest" v-model="settings.weeklyDigest" type="checkbox" role="switch" />
              <span class="switch-track" aria-hidden="true"></span>
            </span>
          </label>
          <label class="preference-row" for="critical-alerts">
            <span class="preference-copy">
              <strong>Critical alerts only</strong>
              <small>Prefer critical case events over general activity.</small>
            </span>
            <span class="switch-control">
              <input id="critical-alerts" v-model="settings.criticalAlerts" type="checkbox" role="switch" />
              <span class="switch-track" aria-hidden="true"></span>
            </span>
          </label>
        </section>

        <section class="settings-panel">
          <div class="panel-heading">
            <span class="panel-icon"><i class="bi bi-display-fill" aria-hidden="true"></i></span>
            <div>
              <h2>Display</h2>
              <p>Set your preferred appearance and list density.</p>
            </div>
          </div>

          <fieldset class="theme-fieldset">
            <legend>Appearance</legend>
            <div class="theme-options">
              <label v-for="theme in themes" :key="theme.value" class="theme-option" :class="{ selected: settings.theme === theme.value }">
                <input v-model="settings.theme" type="radio" name="theme" :value="theme.value" />
                <i class="bi" :class="theme.icon" aria-hidden="true"></i>
                <span>{{ theme.label }}</span>
              </label>
            </div>
          </fieldset>

          <label class="setting-select-row" for="items-per-page">
            <span>
              <strong>Items per page</strong>
              <small>Default number of results shown in lists.</small>
            </span>
            <span class="number-select-wrap">
              <input id="items-per-page" v-model.number="settings.itemsPerPage" type="number" min="10" max="50" step="10" />
              <span>items</span>
            </span>
          </label>
        </section>

        <section class="settings-panel">
          <div class="panel-heading">
            <span class="panel-icon"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i></span>
            <div>
              <h2>Privacy &amp; Security</h2>
              <p>Review saved session preferences and account information.</p>
            </div>
          </div>

          <label class="preference-row" for="auto-logout">
            <span class="preference-copy">
              <strong>Auto-logout preference</strong>
              <small>Save a preferred inactivity interval for your account.</small>
            </span>
            <span class="switch-control">
              <input id="auto-logout" v-model="settings.autoLogoutEnabled" type="checkbox" role="switch" />
              <span class="switch-track" aria-hidden="true"></span>
            </span>
          </label>
          <div v-if="settings.autoLogoutEnabled" class="timeout-control">
            <label for="logout-minutes">Preferred inactivity interval</label>
            <div class="timeout-input-wrap">
              <input id="logout-minutes" v-model.number="settings.autoLogoutMinutes" type="number" min="5" max="120" step="5" />
              <span>minutes</span>
            </div>
          </div>
          <p class="settings-note"><i class="bi bi-info-circle" aria-hidden="true"></i> These preferences are stored in this browser. Automatic session enforcement is not configured.</p>
          <button class="session-button" type="button" @click="showSessionDetails = true">
            <i class="bi bi-person-lock" aria-hidden="true"></i>
            <span>Current session details</span>
            <i class="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        </section>

        <div v-if="error" class="settings-feedback error-feedback" role="alert">
          <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i> {{ error }}
        </div>
        <div v-if="saved" class="settings-feedback success-feedback" role="status">
          <i class="bi bi-check-circle-fill" aria-hidden="true"></i> Preferences saved on this browser.
        </div>
      </div>

      <aside class="settings-aside">
        <section class="settings-panel summary-panel">
          <div class="panel-heading">
            <span class="panel-icon"><i class="bi bi-check2-circle" aria-hidden="true"></i></span>
            <div>
              <h2>Preference Summary</h2>
              <p>Current unsaved selection</p>
            </div>
          </div>
          <div class="summary-line">
            <span>Notifications</span>
            <strong>{{ settings.criticalAlerts ? 'Critical only' : 'All activity' }}</strong>
          </div>
          <div class="summary-line">
            <span>Weekly digest</span>
            <strong>{{ settings.weeklyDigest ? 'On' : 'Off' }}</strong>
          </div>
          <div class="summary-line">
            <span>Appearance</span>
            <strong>{{ themeLabel }}</strong>
          </div>
          <div class="summary-line">
            <span>List size</span>
            <strong>{{ settings.itemsPerPage }} items</strong>
          </div>
          <div class="summary-status">
            <i class="bi bi-cloud-check-fill" aria-hidden="true"></i>
            <span>{{ isDirty ? 'Unsaved changes' : 'All changes saved' }}</span>
          </div>
        </section>

        <section class="settings-panel security-card">
          <div class="panel-heading">
            <span class="panel-icon"><i class="bi bi-shield-check" aria-hidden="true"></i></span>
            <div><h2>Account Security</h2></div>
          </div>
          <ul>
            <li><i class="bi bi-lock-fill" aria-hidden="true"></i><span>Your password is never displayed.</span></li>
            <li><i class="bi bi-person-check-fill" aria-hidden="true"></i><span>Your account role is {{ roleLabel }}.</span></li>
            <li><i class="bi bi-device-hdd-fill" aria-hidden="true"></i><span>Preferences remain in this browser’s local storage.</span></li>
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
          <button class="close-dialog" type="button" aria-label="Close session details" @click="showSessionDetails = false">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <h2 id="session-dialog-title">Current session</h2>
        <p class="dialog-description">Account information for this signed-in browser session.</p>
        <dl class="session-details">
          <div><dt>Name</dt><dd>{{ sessionUser.name || 'Not available' }}</dd></div>
          <div><dt>Email</dt><dd>{{ sessionUser.email || 'Not available' }}</dd></div>
          <div><dt>Role</dt><dd>{{ roleLabel }}</dd></div>
          <div><dt>Saved timeout preference</dt><dd>{{ settings.autoLogoutEnabled ? `${settings.autoLogoutMinutes} minutes` : 'Disabled' }}</dd></div>
        </dl>
        <button class="save-button dialog-done" type="button" @click="showSessionDetails = false">Done</button>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isSaving = ref(false);
const saved = ref(false);
const error = ref('');
const showSessionDetails = ref(false);
const sessionUser = ref<{ name?: string; email?: string; role?: string }>({});

const defaultSettings = {
  emailNotifications: true,
  weeklyDigest: true,
  criticalAlerts: false,
  theme: 'light' as 'light' | 'dark' | 'auto',
  itemsPerPage: 20,
  autoLogoutEnabled: true,
  autoLogoutMinutes: 30
};

const themes = [
  { value: 'light', label: 'Light', icon: 'bi-sun-fill' },
  { value: 'dark', label: 'Dark', icon: 'bi-moon-stars-fill' },
  { value: 'auto', label: 'System', icon: 'bi-circle-half' }
] as const;
const settings = ref({ ...defaultSettings });
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

function loadSettings() {
  readSessionUser();
  try {
    const stored = JSON.parse(localStorage.getItem('dess_settings') || 'null');
    const nextSettings = { ...defaultSettings, ...(stored && typeof stored === 'object' ? stored : {}) };
    nextSettings.itemsPerPage = Math.min(50, Math.max(10, Math.round((Number(nextSettings.itemsPerPage) || defaultSettings.itemsPerPage) / 10) * 10));
    nextSettings.autoLogoutMinutes = Math.min(120, Math.max(5, Number(nextSettings.autoLogoutMinutes) || defaultSettings.autoLogoutMinutes));
    if (!['light', 'dark', 'auto'].includes(nextSettings.theme)) nextSettings.theme = defaultSettings.theme;
    settings.value = nextSettings;
    savedSnapshot.value = JSON.stringify(nextSettings);
  } catch {
    settings.value = { ...defaultSettings };
    savedSnapshot.value = JSON.stringify(defaultSettings);
  }
}

function saveSettings() {
  isSaving.value = true;
  error.value = '';
  saved.value = false;
  try {
    settings.value.itemsPerPage = Math.min(50, Math.max(10, Math.round((Number(settings.value.itemsPerPage) || 20) / 10) * 10));
    settings.value.autoLogoutMinutes = Math.min(120, Math.max(5, Number(settings.value.autoLogoutMinutes) || 30));
    localStorage.setItem('dess_settings', JSON.stringify(settings.value));
    savedSnapshot.value = JSON.stringify(settings.value);
    saved.value = true;
  } catch {
    error.value = 'Could not save preferences in this browser.';
  } finally {
    isSaving.value = false;
  }
}

function resetSettings() {
  if (!window.confirm('Reset all preferences to their defaults?')) return;
  settings.value = { ...defaultSettings };
  saveSettings();
}

onMounted(loadSettings);
</script>

<style scoped>
.settings-page {
  --settings-bg: #04152d;
  --panel-bg: #061d3a;
  --line: #123d6b;
  --text-main: #e7f2ff;
  --text-muted: #9db9d8;
  --blue: #168bff;
  --green: #06d6a0;
  min-height: calc(100vh - 56px);
  padding: 22px clamp(14px, 2.4vw, 34px) 36px;
  color: var(--text-main);
  background-color: var(--settings-bg);
  background-image: linear-gradient(rgba(24, 93, 154, .08) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 93, 154, .08) 1px, transparent 1px);
  background-size: 34px 34px;
}

.settings-header,
.settings-layout {
  width: min(1320px, 100%);
  margin-inline: auto;
}

.settings-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.settings-eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 7px;
  color: #57adff;
  font-size: 10px;
  font-weight: 750;
}

.settings-header h1 { margin: 0; color: #f0f7ff; font-size: 25px; font-weight: 750; }
.settings-intro { margin: 5px 0 0; color: var(--text-muted); font-size: 12px; }
.settings-back,
.save-button,
.reset-button,
.session-button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #1b659f;
  border-radius: 6px;
  color: #cde7ff;
  background: rgba(4, 36, 73, .85);
  cursor: pointer;
  font-size: 11px;
  font-weight: 650;
  transition: background .16s ease, border-color .16s ease;
}
.settings-back:hover,
.reset-button:hover,
.session-button:hover { border-color: #39a1ff; color: white; background: rgba(14, 88, 153, .4); }
.settings-layout { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(280px, .8fr); gap: 14px; align-items: start; }
.settings-main,
.settings-aside { display: grid; min-width: 0; gap: 12px; }
.settings-panel { padding: 17px; border: 1px solid var(--line); border-radius: 8px; background: linear-gradient(145deg, rgba(7, 32, 63, .98), rgba(4, 24, 49, .98)); box-shadow: 0 10px 24px rgba(0, 0, 0, .13); }
.panel-heading { display: flex; align-items: center; gap: 11px; margin-bottom: 12px; }
.panel-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border: 1px solid #19588c; border-radius: 8px; color: #62b8ff; background: #0a315a; font-size: 16px; }
.panel-heading h2 { margin: 0; color: #e8f4ff; font-size: 14px; font-weight: 700; }
.panel-heading p { margin: 3px 0 0; color: var(--text-muted); font-size: 10px; }
.preference-row { display: flex; min-height: 60px; align-items: center; justify-content: space-between; gap: 16px; padding: 11px 2px; border-top: 1px solid rgba(24, 67, 107, .7); cursor: pointer; }
.preference-copy { display: grid; min-width: 0; gap: 4px; }
.preference-copy strong { color: #dcecff; font-size: 11px; font-weight: 650; }
.preference-copy small { color: #91acc9; font-size: 10px; line-height: 1.4; }
.switch-control { position: relative; display: inline-flex; width: 40px; height: 22px; flex: 0 0 40px; align-items: center; }
.switch-control input { position: absolute; z-index: 1; width: 40px; height: 22px; margin: 0; opacity: 0; cursor: pointer; }
.switch-track { position: absolute; inset: 0; border: 1px solid #365572; border-radius: 999px; background: #193550; transition: background .16s ease, border-color .16s ease; }
.switch-track::after { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: #b6c8da; content: ''; transition: transform .16s ease; }
.switch-control input:checked + .switch-track { border-color: #08ad8c; background: #087c6c; }
.switch-control input:checked + .switch-track::after { transform: translateX(18px); background: white; }
.switch-control input:focus-visible + .switch-track { outline: 2px solid #71c1ff; outline-offset: 3px; }
.theme-fieldset { margin: 0 0 15px; padding: 0; border: 0; }
.theme-fieldset legend { margin-bottom: 8px; color: #c5d8eb; font-size: 10px; font-weight: 650; }
.theme-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.theme-option { display: flex; min-height: 43px; align-items: center; justify-content: center; gap: 7px; padding: 8px; border: 1px solid #21476d; border-radius: 6px; color: #adc5dd; background: rgba(3, 24, 47, .55); cursor: pointer; font-size: 10px; }
.theme-option.selected { border-color: #168bff; color: #e8f4ff; background: rgba(13, 85, 145, .38); box-shadow: inset 0 0 0 1px rgba(22, 139, 255, .18); }
.theme-option input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.theme-option:focus-within { outline: 2px solid #71c1ff; outline-offset: 2px; }
.theme-option i { color: #70bdff; font-size: 14px; }
.setting-select-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-top: 13px; border-top: 1px solid rgba(24, 67, 107, .7); }
.setting-select-row > span:first-child { display: grid; gap: 4px; }
.setting-select-row strong { color: #dcecff; font-size: 11px; }
.setting-select-row small { color: #91acc9; font-size: 10px; }
.number-select-wrap,
.timeout-input-wrap { display: inline-flex; align-items: center; gap: 7px; color: #a9c2da; font-size: 10px; }
.number-select-wrap input,
.timeout-input-wrap input { width: 72px; min-height: 34px; padding: 6px 8px; border: 1px solid #21476d; border-radius: 6px; color: #e4f2ff; background: #061a33; }
.number-select-wrap input:focus,
.timeout-input-wrap input:focus { border-color: #168bff; outline: 2px solid rgba(22, 139, 255, .16); }
.timeout-control { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 2px; border-top: 1px solid rgba(24, 67, 107, .7); }
.timeout-control > label { color: #c5d8eb; font-size: 10px; }
.settings-note { display: flex; align-items: flex-start; gap: 7px; margin: 8px 0 13px; color: #91acc9; font-size: 10px; line-height: 1.5; }
.settings-note i { flex: 0 0 13px; color: #66b9ff; }
.session-button { width: 100%; justify-content: flex-start; border-color: #21476d; background: rgba(3, 24, 47, .55); }
.session-button i:last-child { margin-left: auto; font-size: 10px; }
.summary-panel { border-color: #18558a; }
.summary-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 0; border-top: 1px solid rgba(24, 67, 107, .7); font-size: 10px; }
.summary-line span { color: #9eb8d2; }
.summary-line strong { color: #d9eaff; font-size: 10px; text-align: right; }
.summary-status { display: flex; align-items: center; gap: 7px; margin-top: 8px; padding: 10px; border: 1px solid rgba(6, 214, 160, .24); border-radius: 6px; color: #87e9cd; background: rgba(0, 130, 103, .14); font-size: 10px; font-weight: 650; }
.summary-status i { font-size: 14px; }
.security-card ul { display: grid; gap: 11px; margin: 0; padding: 0; list-style: none; }
.security-card li { display: flex; align-items: flex-start; gap: 9px; color: #b3c9df; font-size: 10px; line-height: 1.45; }
.security-card li i { flex: 0 0 14px; color: #63adf6; font-size: 12px; }
.settings-actions { display: grid; gap: 8px; }
.save-button { min-height: 40px; border-color: #168bff; color: white; background: #0876e1; }
.save-button:hover:not(:disabled) { background: #168bff; }
.save-button:disabled { opacity: .58; cursor: default; }
.reset-button { width: 100%; min-height: 38px; border-color: #31516f; background: rgba(4, 24, 49, .8); }
.settings-feedback { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 6px; font-size: 11px; }
.error-feedback { border: 1px solid rgba(255, 112, 112, .35); color: #ffc0c0; background: rgba(115, 20, 32, .25); }
.success-feedback { border: 1px solid rgba(6, 214, 160, .28); color: #8df0d2; background: rgba(0, 120, 90, .22); }
.dialog-backdrop { position: fixed; z-index: 1100; inset: 0; display: grid; place-items: center; padding: 16px; background: rgba(0, 8, 20, .76); }
.session-dialog { width: min(440px, 100%); padding: 20px; border: 1px solid #1c5785; border-radius: 9px; color: var(--text-main); background: #071d39; box-shadow: 0 24px 70px rgba(0, 0, 0, .4); }
.dialog-heading { display: flex; align-items: center; justify-content: space-between; }
.close-dialog { display: grid; width: 32px; height: 32px; place-items: center; border: 1px solid #254b70; border-radius: 6px; color: #a9c2da; background: transparent; cursor: pointer; }
.session-dialog h2 { margin: 14px 0 4px; color: #eff7ff; font-size: 17px; }
.dialog-description { margin: 0 0 14px; color: #9db9d8; font-size: 11px; }
.session-details { display: grid; gap: 0; margin: 0; }
.session-details div { display: flex; justify-content: space-between; gap: 14px; padding: 10px 0; border-top: 1px solid #153b60; font-size: 11px; }
.session-details dt { color: #9db9d8; }
.session-details dd { margin: 0; color: #e0efff; text-align: right; overflow-wrap: anywhere; }
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
