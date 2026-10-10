<script setup lang="ts">
import type { CardProject } from "../../../../api/types";
import type { ProjectFeedback, ProjectLoadState } from "../useProjectList";
import ProjectList from "./ProjectList.vue";
import ProjectListState from "./ProjectListState.vue";

defineProps<{
  projects: CardProject[];
  loadState: ProjectLoadState;
  showLoadingState: boolean;
  deleteFeedback: ProjectFeedback | null;
  pendingDeleteId: string | null;
  deletingId: string | null;
}>();

const emit = defineEmits<{
  retry: [];
  "request-delete": [project: CardProject];
  "cancel-delete": [];
  "confirm-delete": [];
}>();
</script>

<template>
  <section class="card" aria-labelledby="project-list-title">
    <h3 id="project-list-title" class="card-title">All projects</h3>

    <p
      v-if="deleteFeedback"
      class="form-feedback"
      role="alert"
      :data-tone="deleteFeedback.tone"
    >
      {{ deleteFeedback.text }}
    </p>

    <ProjectListState
      v-if="loadState === 'loading'"
      kind="loading"
      :show-loading-state="showLoadingState"
    />

    <ProjectListState
      v-else-if="loadState === 'error'"
      kind="error"
      @retry="emit('retry')"
    />

    <ProjectListState v-else-if="projects.length === 0" kind="empty" />

    <ProjectList
      v-else
      :projects="projects"
      :pending-delete-id="pendingDeleteId"
      :deleting-id="deletingId"
      @request-delete="emit('request-delete', $event)"
      @cancel-delete="emit('cancel-delete')"
      @confirm-delete="emit('confirm-delete')"
    />
  </section>
</template>

<style scoped>
.card {
  padding: var(--space-6);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.card-title {
  margin: 0 0 var(--space-4);
  font: var(--font-h3);
}

.form-feedback {
  margin: var(--space-3) 0 0;
  font-size: var(--text-sm);
}

.form-feedback[data-tone="error"] {
  color: var(--danger);
}

@media (max-width: 560px) {
  .card {
    padding: var(--space-4);
  }
}
</style>
