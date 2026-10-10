<script setup lang="ts">
import { ref } from "vue";

import AppSelect from "./components/AppSelect.vue";
import ProjectListPage from "./pages/projects/ProjectListPage.vue";
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "./theme/theme";

const themePreference = ref<ThemePreference>(getThemePreference());

function onThemeChange(value: string) {
  const preference = value as ThemePreference;
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
        <AppSelect
          id="theme-select"
          :model-value="themePreference"
          @update:model-value="onThemeChange"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </AppSelect>
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
  max-width: 45rem;
  margin-inline: auto;
  padding-inline: var(--space-6);
}

.app-header {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
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
  font-size: 1.25rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.app-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.theme-control {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.theme-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
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
