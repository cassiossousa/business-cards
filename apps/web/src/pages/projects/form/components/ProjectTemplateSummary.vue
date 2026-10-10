<script setup lang="ts">
defineProps<{
  templateName: string;
}>();
</script>

<template>
  <section class="locked-template" aria-label="Selected template">
    <span class="locked-label">Template</span>
    <strong>{{ templateName }}</strong>
    <p>
      The template is fixed for this project. You can still update the card
      fields below.
    </p>
  </section>
</template>

<style scoped>
.locked-template {
  display: grid;
  justify-items: start;
  gap: var(--space-1);
  padding: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.locked-label {
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.locked-template strong {
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.locked-template p {
  margin: var(--space-1) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
}
</style>
