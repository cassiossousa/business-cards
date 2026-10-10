<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";

defineProps<{
  to: RouteLocationRaw;
  variant: "primary" | "secondary";
}>();
</script>

<template>
  <RouterLink class="action-link" :class="`action-link--${variant}`" :to="to">
    <slot />
  </RouterLink>
</template>

<style scoped>
.action-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font: inherit;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

.action-link--primary {
  color: var(--accent-contrast);
  background: var(--accent);
}

.action-link--primary:hover {
  background: var(--accent-hover);
}

.action-link--secondary {
  color: var(--text);
  background: transparent;
  border-color: var(--border);
}

.action-link--secondary:hover {
  background: var(--page-bg);
}

.action-link:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
</style>
