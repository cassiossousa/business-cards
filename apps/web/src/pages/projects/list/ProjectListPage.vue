<script setup lang="ts">
import ProjectListHeader from "./components/ProjectListHeader.vue";
import ProjectListSection from "./components/ProjectListSection.vue";
import { useProjectList } from "./useProjectList";

const {
  projects,
  loadState,
  showLoadingState,
  deleteFeedback,
  pendingDeleteId,
  deletingId,
  loadProjects,
  requestDelete,
  cancelDelete,
  confirmDelete,
} = useProjectList();
</script>

<template>
  <main class="page">
    <ProjectListHeader />

    <ProjectListSection
      :projects="projects"
      :load-state="loadState"
      :show-loading-state="showLoadingState"
      :delete-feedback="deleteFeedback"
      :pending-delete-id="pendingDeleteId"
      :deleting-id="deletingId"
      @retry="loadProjects"
      @request-delete="requestDelete"
      @cancel-delete="cancelDelete"
      @confirm-delete="confirmDelete"
    />
  </main>
</template>

<style scoped>
.page {
  width: 100%;
}
</style>
