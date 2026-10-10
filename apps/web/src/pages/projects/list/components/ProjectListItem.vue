<script setup lang="ts">
import type { CardProject } from "../../../../api/types";
import AppButton from "../../../../components/AppButton.vue";
import ProjectActionLink from "./ProjectActionLink.vue";

defineProps<{
  project: CardProject;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
}>();

const emit = defineEmits<{
  "request-delete": [project: CardProject];
  "cancel-delete": [];
  "confirm-delete": [];
}>();

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
</script>

<template>
  <li class="project-item">
    <div class="project-details">
      <span class="project-name">
        {{ project.name }}
      </span>

      <span class="project-created">
        Created {{ formatDate(project.createdAt) }}
      </span>
    </div>

    <div v-if="!isConfirmingDelete" class="project-actions">
      <ProjectActionLink
        variant="secondary"
        :to="{
          name: 'project-edit',
          params: { id: project.id },
        }"
      >
        Edit
      </ProjectActionLink>

      <AppButton
        variant="danger"
        type="button"
        @click="emit('request-delete', project)"
      >
        Delete
      </AppButton>
    </div>

    <div v-else class="project-actions">
      <AppButton
        variant="danger-solid"
        type="button"
        :disabled="isDeleting"
        @click="emit('confirm-delete')"
      >
        {{ isDeleting ? "Deleting…" : "Confirm delete" }}
      </AppButton>

      <AppButton
        variant="secondary"
        type="button"
        :disabled="isDeleting"
        @click="emit('cancel-delete')"
      >
        Cancel
      </AppButton>
    </div>
  </li>
</template>

<style scoped>
.project-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.project-item:last-child {
  padding-bottom: var(--space-1);
  border-bottom: none;
}

.project-item:first-child {
  padding-top: var(--space-1);
}

.project-details {
  min-width: 0;
}

.project-name {
  display: block;
  font-weight: 550;
  overflow-wrap: anywhere;
}

.project-created {
  display: block;
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.project-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
  flex-wrap: wrap;
}

@media (max-width: 560px) {
  .project-actions {
    width: 100%;
    margin-left: 0;
  }

  .project-actions :deep(.action-link),
  .project-actions :deep(button) {
    flex: 1;
  }
}
</style>
