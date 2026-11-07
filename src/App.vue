
<template>
  <AppNavigation v-if="!isLandingPage" />
  <router-view />
  <FeedbackWidget />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppNavigation from './components/AppNavigation.vue';
import FeedbackWidget from './components/FeedbackWidget.vue';

const route = useRoute();
const isLandingPage = computed(() => route.path === '/');
</script>

<style scoped>
</style>
