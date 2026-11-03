
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

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'LoginModal',
      component: LoginModal,
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
      path: '/researcher',
      name: 'ResearcherDashboard',
      component: ResearcherDashboard,
    },
    {
      path: '/investigator',
      name: 'InvestigatorDashboard',
      component: InvestigatorDashboard,
    },
    {
      path: '/profile',
      name: 'ProfilePage',
      component: ProfilePage,
    },
    {
      path: '/researcher-profile',
      name: 'ResearcherProfilePage',
      component: ResearcherProfilePage,
    },
    {
      path: '/settings',
      name: 'SettingsPage',
      component: SettingsPage,
    },
    {
      path: '/messages',
      name: 'MessagesPage',
      component: MessagesPage,
    },
    {
      path: '/archives',
      name: 'ArchivesPage',
      component: ArchivesPage,
    },
    {
      path: '/cases/:id/tracking',
      name: 'CaseTrackingPage',
      component: CaseTrackingPage,
      props: true,
    },
    {
      path: '/cases/:id',
      name: 'CaseDetails',
      component: CaseDetails,
      props: true,
    },
    {
      path: '/admin',
      name: 'AdminDashboard',
      component: AdminDashboard,
    },
  ],
});

export default router;
