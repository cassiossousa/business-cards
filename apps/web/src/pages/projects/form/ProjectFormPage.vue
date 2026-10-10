<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  ApiError,
  createProject,
  getProject,
  updateProject,
} from "../../../api/projectsApi.ts";
import ProjectFormPanel from "./components/ProjectFormPanel.vue";

const route = useRoute();
const router = useRouter();

const projectId = computed(() => {
  const id = route.params.id;
  return typeof id === "string" ? id : null;
});

const isEditing = computed(() => projectId.value !== null);

const name = ref("");
const isLoading = ref(false);
const isSubmitting = ref(false);
const loadError = ref<string | null>(null);
const formError = ref<string | null>(null);

watch(
  projectId,
  async (id, _previousId, onCleanup) => {
    let active = true;
    onCleanup(() => {
      active = false;
    });

    name.value = "";
    loadError.value = null;
    formError.value = null;

    if (id === null) {
      isLoading.value = false;
      return;
    }

    isLoading.value = true;

    try {
      const project = await getProject(id);
      if (active) name.value = project.name;
    } catch (error) {
      if (active) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Could not load this project. Try again.";
      }
    } finally {
      if (active) isLoading.value = false;
    }
  },
  { immediate: true },
);

async function saveProject(): Promise<void> {
  if (isSubmitting.value) return;

  const trimmedName = name.value.trim();

  if (!trimmedName) {
    formError.value = "Enter a project name.";
    return;
  }

  if (trimmedName.length > 80) {
    formError.value = "CardProject names must be 80 characters or fewer.";
    return;
  }

  const id = projectId.value;
  isSubmitting.value = true;
  formError.value = null;

  try {
    if (id !== null) {
      await updateProject(id, trimmedName);
    } else {
      await createProject(trimmedName);
    }

    await router.push({ name: "projects" });
  } catch (error) {
    formError.value =
      error instanceof ApiError
        ? error.message
        : `Could not ${id !== null ? "save" : "create"} the project. Try again.`;
  } finally {
    isSubmitting.value = false;
  }
}

function cancel(): void {
  void router.push({ name: "projects" });
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <p class="eyebrow">PROJECTS</p>
      <h2 class="page-heading">
        {{ isEditing ? "Edit project" : "New project" }}
      </h2>
      <p class="page-description">
        {{
          isEditing
            ? "Update your project details."
            : "Give your card project a name. You can change it later."
        }}
      </p>
    </header>

    <ProjectFormPanel
      :name="name"
      :is-editing="isEditing"
      :is-loading="isLoading"
      :is-submitting="isSubmitting"
      :load-error="loadError"
      :form-error="formError"
      @update:name="name = $event"
      @clear-error="formError = null"
      @submit="saveProject"
      @cancel="cancel"
    />
  </div>
</template>

<style scoped>
.page {
  max-width: 44rem;
  margin-inline: auto;
}

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
