<script setup lang="ts">
import ProjectActionLink from "./ProjectActionLink.vue";
</script>

<template>
  <header class="page-heading-row">
    <h2 class="page-heading">Your projects</h2>

    <ProjectActionLink variant="primary" :to="{ name: 'project-new' }">
      Create project
    </ProjectActionLink>
  </header>
</template>

<style scoped>
.page-heading-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.page-heading {
  margin: 0;
  font: var(--font-h2);
  letter-spacing: var(--tracking-tight);
}

@media (max-width: 560px) {
  .page-heading-row {
    align-items: stretch;
  }

  .page-heading-row :deep(.action-link) {
    width: 100%;
  }
}
</style>
