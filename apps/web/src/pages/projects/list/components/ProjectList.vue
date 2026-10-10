<script setup lang="ts">
import type { CardProject } from "../../../../api/types";
import ProjectListItem from "./ProjectListItem.vue";

defineProps<{
  projects: CardProject[];
  pendingDeleteId: string | null;
  deletingId: string | null;
}>();

const emit = defineEmits<{
  "request-delete": [project: CardProject];
  "cancel-delete": [];
  "confirm-delete": [];
}>();
</script>

<template>
  <ul class="project-list">
    <ProjectListItem
      v-for="project in projects"
      :key="project.id"
      :project="project"
      :is-confirming-delete="pendingDeleteId === project.id"
      :is-deleting="deletingId === project.id"
      @request-delete="emit('request-delete', $event)"
      @cancel-delete="emit('cancel-delete')"
      @confirm-delete="emit('confirm-delete')"
    />
  </ul>
</template>

<style scoped>
.project-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
