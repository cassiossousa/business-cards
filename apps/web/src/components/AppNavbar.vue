<script setup lang="ts">
import { ref } from "vue";

import AppSelect from "./AppSelect.vue";
import {
  getThemePreference,
  setThemePreference,
  type ThemePreference,
} from "../theme/theme";

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
        <h1 class="app-title">
          <RouterLink to="/projects" class="brand-link">
            Business Cards
          </RouterLink>
        </h1>
        <p class="app-subtitle">Create and manage your card projects</p>
      </div>
      <nav class="app-nav" aria-label="Main">
        <RouterLink to="/projects" class="nav-link">Projects</RouterLink>
      </nav>
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
</template>

<style scoped>
.app-header {
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.app-header .container {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-3) var(--space-5);
  padding-block: var(--space-5);
}

.app-heading {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.app-title {
  margin: 0;
  font: var(--font-h1);
  letter-spacing: var(--tracking-tight);
}

.brand-link {
  color: inherit;
  text-decoration: none;
}

.brand-link:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: var(--space-1);
  border-radius: var(--radius-sm);
}

.app-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.app-nav {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
}

.nav-link {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
}

.nav-link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

/* RouterLink sets aria-current="page" on the active route; the weight
   change keeps the current page identifiable without relying on color. */
.nav-link[aria-current="page"] {
  color: var(--primary);
  font-weight: 550;
}

.nav-link:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: var(--space-1);
  border-radius: var(--radius-sm);
}

.theme-control {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.theme-label {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}
</style>
