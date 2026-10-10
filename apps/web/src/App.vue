<script setup lang="ts">
import { ref } from "vue";

import ProjectListPage from "./pages/projects/ProjectListPage.vue";
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "./theme/theme";

const themePreference = ref<ThemePreference>(getThemePreference());

function onThemeChange(event: Event) {
  const preference = (event.currentTarget as HTMLSelectElement)
    .value as ThemePreference;
  themePreference.value = preference;
  setThemePreference(preference);
}
</script>

<template>
  <header class="app-header">
    <div class="container">
      <div class="app-heading">
        <h1 class="app-title">Business Cards</h1>
        <p class="app-subtitle">Create and manage your card projects</p>
      </div>
      <div class="theme-control">
        <label class="theme-label" for="theme-select">Theme</label>
        <select
          id="theme-select"
          class="theme-select"
          :value="themePreference"
          @change="onThemeChange"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
    </div>
  </header>
  <main id="main" class="app-main">
    <div class="container">
      <ProjectListPage />
    </div>
  </main>
</template>

<style scoped>
.container {
  width: 100%;
  max-width: 720px;
  margin-inline: auto;
  padding-inline: var(--space-6);
}

.app-header {
  border-bottom: 1px solid var(--gray-200);
  background: var(--white);
}

.app-header .container {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-3);
  padding-block: var(--space-5);
}

.app-heading {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.app-subtitle {
  margin: 0;
  color: var(--gray-500);
  font-size: 14px;
}

.theme-control {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-left: auto;
}

.theme-label {
  color: var(--gray-500);
  font-size: 14px;
}

.theme-select {
  height: 32px;
  padding: 0 var(--space-2);
  font: inherit;
  font-size: 14px;
  color: var(--gray-900);
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-sm);
}

.theme-select:focus-visible {
  outline: 2px solid var(--violet-500);
  outline-offset: 2px;
}

.app-main {
  padding-block: var(--space-10) var(--space-16);
}

@media (max-width: 560px) {
  .container {
    padding-inline: var(--space-4);
  }
}
</style>
