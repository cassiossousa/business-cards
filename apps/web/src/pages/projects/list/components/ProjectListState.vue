<script setup lang="ts">
import AppButton from "../../../../components/AppButton.vue";

defineProps<{
  kind: "loading" | "error" | "empty";
  showLoadingState?: boolean;
}>();

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div v-if="kind === 'loading'" aria-busy="true">
    <template v-if="showLoadingState">
      <ul class="skeleton-list" aria-hidden="true">
        <li v-for="index in 3" :key="index"></li>
      </ul>

      <p class="state-panel" role="status">Loading projects…</p>
    </template>
  </div>

  <div v-else-if="kind === 'error'" class="state-panel">
    <p>Could not load your projects.</p>

    <AppButton variant="secondary" type="button" @click="emit('retry')">
      Try again
    </AppButton>
  </div>

  <p v-else class="state-panel">
    No projects yet. Create your first card project above.
  </p>
</template>

<style scoped>
.state-panel {
  padding: var(--space-10) var(--space-6);
  text-align: center;
  color: var(--text-secondary);
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.skeleton-list li {
  height: 2.75rem;
  border-radius: var(--radius-sm);
  background: var(--surface-subtle);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.55;
  }

  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-list li {
    animation: none;
  }
}
</style>
