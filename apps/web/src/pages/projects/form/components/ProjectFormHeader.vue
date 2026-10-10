<script setup lang="ts">
defineProps<{
  isEditing: boolean;
}>();
</script>

<template>
  <header class="page-header">
    <p class="eyebrow">PROJECTS</p>
    <h2 class="page-heading">
      {{ isEditing ? "Edit project" : "New project" }}
    </h2>
    <p class="page-description">
      {{
        isEditing
          ? "Update the project name and the information on your card."
          : "Name your project, choose a template, and add your card details."
      }}
    </p>
  </header>
</template>

<style scoped>
.page-header {
  margin-bottom: var(--space-6);
}

.eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.page-heading {
  margin: 0;
  font: var(--font-h2);
  letter-spacing: var(--tracking-tight);
}

.page-description {
  margin: var(--space-2) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
}
</style>
