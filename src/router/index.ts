
import CaseDetails from '../views/CaseDetails.vue';
import CaseTrackingPage from '../views/CaseTrackingPage.vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import LandingPage from '../views/LandingPage.vue';
import ResearcherDashboard from '../views/ResearcherDashboard.vue';
import InvestigatorDashboard from '../views/InvestigatorDashboard.vue';
import ProfilePage from '../views/ProfilePage.vue';
import ResearcherProfilePage from '../views/ResearcherProfilePage.vue';
import SettingsPage from '../views/SettingsPage.vue';
import ArchivesPage from '../views/ArchivesPage.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import AdminLoginPage from '../views/AdminLoginPage.vue';
import LoginModal from '@/components/LoginModal.vue';
import MessagesPage from '../views/MessagesPage.vue';
import OrganizationsPage from '../views/OrganizationsPage.vue';
import ResearchWorkspace from '../views/ResearchWorkspace.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'LoginModal',
      component: LoginModal,
    },
    {
      path: '/case-repo/login',
      name: 'CaseRepositoryLogin',
      component: LoginModal,
      props: { initialRole: 'researcher' },
    },
    {
      path: '/dess/login',
      name: 'DessPortalLogin',
      component: LoginModal,
      props: { initialRole: 'investigator' },
    },
    {
      path: '/admin-login',
      name: 'AdminLoginPage',
      component: AdminLoginPage,
    },
    {
      path: '/',
      name: 'LandingPage',
      component: LandingPage,
    },
    {
      path: '/research-workspace',
      name: 'ResearchWorkspace',
      component: ResearchWorkspace,
      meta: { roles: ['researcher'] },
    },
    {
      path: '/organizations',
      name: 'OrganizationsPage',
      component: OrganizationsPage,
      meta: { roles: ['researcher', 'investigator', 'admin'] },
    },
    {
      path: '/researcher',
      name: 'ResearcherDashboard',
      component: ResearcherDashboard,
      meta: { roles: ['researcher'] },
    },
    {
      path: '/investigator',
      name: 'InvestigatorDashboard',
      component: InvestigatorDashboard,
      meta: { roles: ['investigator'] },
    },
    {
      path: '/profile',
      name: 'ProfilePage',
      component: ProfilePage,
      meta: { roles: ['investigator', 'admin'] },
    },
    {
      path: '/researcher-profile',
      name: 'ResearcherProfilePage',
      component: ResearcherProfilePage,
      meta: { roles: ['researcher'] },
    },
    {
      path: '/settings',
      name: 'SettingsPage',
      component: SettingsPage,
      meta: { roles: ['researcher', 'investigator', 'admin'] },
    },
    {
      path: '/messages',
      name: 'MessagesPage',
      component: MessagesPage,
      meta: { roles: ['researcher', 'investigator'] },
    },
    {
      path: '/archives',
      name: 'ArchivesPage',
      component: ArchivesPage,
      meta: { roles: ['investigator'] },
    },
    {
      path: '/cases/:id/tracking',
      name: 'CaseTrackingPage',
      component: CaseTrackingPage,
      props: true,
      meta: { roles: ['investigator'] },
    },
    {
      path: '/cases/:id',
      name: 'CaseDetails',
      component: CaseDetails,
      props: true,
      meta: { roles: ['investigator'] },
    },
    {
      path: '/admin',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: { roles: ['admin'] },
    },
  ],
});

router.beforeEach((to) => {
  const token = sessionStorage.getItem('dess_token');
  let role = '';
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    role = String(user.role || sessionStorage.getItem('dess_user_role') || '').toLowerCase();
  } catch {
    role = String(sessionStorage.getItem('dess_user_role') || '').toLowerCase();
  }

  const allowedRoles = to.meta.roles as string[] | undefined;
  if (allowedRoles) {
    if (!token || !role) {
      return to.path.startsWith('/research') || to.path.startsWith('/case-repo')
        ? { path: '/case-repo/login', query: { redirect: to.fullPath } }
        : { path: '/dess/login', query: { redirect: to.fullPath } };
    }
    if (!allowedRoles.includes(role)) {
      if (role === 'researcher') return { path: '/researcher' };
      if (role === 'admin') return { path: '/admin' };
      if (role === 'investigator') return { path: '/investigator' };
      return { path: '/' };
    }
  }

  if (token && role && ['/login', '/case-repo/login', '/dess/login'].includes(to.path)) {
    return role === 'researcher' ? { path: '/researcher' } : role === 'admin' ? { path: '/admin' } : { path: '/investigator' };
  }
  return true;
});

export default router;
