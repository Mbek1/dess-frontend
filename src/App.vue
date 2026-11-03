
<template>
  <AppNavigation v-if="!isLandingPage" />
  <router-view />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppNavigation from './components/AppNavigation.vue';

const route = useRoute();
const isLandingPage = computed(() => route.path === '/');
</script>

<style scoped>
</style>
