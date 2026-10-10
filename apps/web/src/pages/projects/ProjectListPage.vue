<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

import type { CardProject } from "../../api/types";
import {
  ApiError,
  createProject,
  deleteProject,
  listProjects,
} from "../../api/projectsApi";
import AppButton from "../../components/AppButton.vue";
import AppInput from "../../components/AppInput.vue";

type LoadState = "loading" | "error" | "ready";

interface FormFeedback {
  tone: "success" | "error";
  text: string;
}

const LOADING_DELAY_MS = 150;

const projects = ref<CardProject[]>([]);
const loadState = ref<LoadState>("loading");
const showLoadingState = ref(false);

let loadingTimer: ReturnType<typeof setTimeout> | undefined;

const newName = ref("");
const isSubmitting = ref(false);
const formFeedback = ref<FormFeedback | null>(null);

const pendingDeleteId = ref<string | null>(null);
const deletingId = ref<string | null>(null);
const deleteFeedback = ref<FormFeedback | null>(null);

function clearLoadingTimer(): void {
  if (loadingTimer !== undefined) {
    clearTimeout(loadingTimer);
    loadingTimer = undefined;
  }
}

async function loadProjects(): Promise<void> {
  clearLoadingTimer();

  showLoadingState.value = false;
  loadState.value = "loading";

  loadingTimer = setTimeout(() => {
    loadingTimer = undefined;

    if (loadState.value === "loading") {
      showLoadingState.value = true;
    }
  }, LOADING_DELAY_MS);

  try {
    const response = await listProjects();

    projects.value = response.projects;
    loadState.value = "ready";
  } catch {
    loadState.value = "error";
  } finally {
    clearLoadingTimer();
    showLoadingState.value = false;
  }
}

async function submitCreate(): Promise<void> {
  const name = newName.value.trim();

  if (!name) {
    formFeedback.value = {
      tone: "error",
      text: "Enter a project name.",
    };
    return;
  }

  if (isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;
  formFeedback.value = null;

  try {
    const project = await createProject(name);

    projects.value = [project, ...projects.value];
    newName.value = "";

    formFeedback.value = {
      tone: "success",
      text: `Created “${project.name}”.`,
    };
  } catch (error) {
    formFeedback.value = {
      tone: "error",
      text:
        error instanceof ApiError
          ? error.message
          : "Could not create the project. Try again.",
    };
  } finally {
    isSubmitting.value = false;
  }
}

function requestDelete(project: CardProject): void {
  pendingDeleteId.value = project.id;
  deleteFeedback.value = null;
}

function cancelDelete(): void {
  pendingDeleteId.value = null;
  deletingId.value = null;
}

async function confirmDelete(): Promise<void> {
  const id = pendingDeleteId.value;

  if (id === null || deletingId.value !== null) {
    return;
  }

  deletingId.value = id;

  try {
    await deleteProject(id);

    projects.value = projects.value.filter((project) => project.id !== id);

    pendingDeleteId.value = null;
    deleteFeedback.value = null;
  } catch (error) {
    deleteFeedback.value = {
      tone: "error",
      text:
        error instanceof ApiError
          ? error.message
          : "Could not delete the project. Try again.",
    };
  } finally {
    deletingId.value = null;
  }
}

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

onMounted(() => {
  void loadProjects();
});

onUnmounted(() => {
  clearLoadingTimer();
});
</script>

<template>
  <h2 class="page-heading">Your projects</h2>

  <section class="card" aria-labelledby="create-project-title">
    <h3 id="create-project-title" class="card-title">Start a new project</h3>

    <form class="create-form" @submit.prevent="submitCreate">
      <div class="field">
        <label for="project-name">Project name</label>

        <AppInput
          id="project-name"
          v-model="newName"
          name="project-name"
          placeholder="e.g. Studio cards"
          :disabled="isSubmitting"
          autocomplete="off"
        />
      </div>

      <AppButton variant="primary" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? "Creating…" : "Create project" }}
      </AppButton>
    </form>

    <p
      v-if="formFeedback"
      class="form-feedback"
      role="status"
      :data-tone="formFeedback.tone"
    >
      {{ formFeedback.text }}
    </p>
  </section>

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

    <div v-if="loadState === 'loading'" aria-busy="true">
      <template v-if="showLoadingState">
        <ul class="skeleton-list" aria-hidden="true">
          <li v-for="index in 3" :key="index"></li>
        </ul>

        <p class="state-panel" role="status">Loading projects…</p>
      </template>
    </div>

    <div v-else-if="loadState === 'error'" class="state-panel">
      <p>Could not load your projects.</p>

      <AppButton variant="secondary" type="button" @click="loadProjects">
        Try again
      </AppButton>
    </div>

    <p v-else-if="projects.length === 0" class="state-panel">
      No projects yet. Create your first card project above.
    </p>

    <ul v-else class="project-list">
      <li v-for="project in projects" :key="project.id">
        <div>
          <span class="project-name">
            {{ project.name }}
          </span>

          <span class="project-created">
            Created {{ formatDate(project.createdAt) }}
          </span>
        </div>

        <div v-if="pendingDeleteId !== project.id" class="project-actions">
          <AppButton
            variant="danger"
            type="button"
            @click="requestDelete(project)"
          >
            Delete
          </AppButton>
        </div>

        <div v-else class="project-actions">
          <AppButton
            variant="danger-solid"
            type="button"
            :disabled="deletingId === project.id"
            @click="confirmDelete"
          >
            {{ deletingId === project.id ? "Deleting…" : "Confirm delete" }}
          </AppButton>

          <AppButton
            variant="secondary"
            type="button"
            :disabled="deletingId === project.id"
            @click="cancelDelete"
          >
            Cancel
          </AppButton>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.page-heading {
  margin: 0 0 var(--space-6);
  font: var(--font-h2);
  letter-spacing: var(--tracking-tight);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}

.card + .card {
  margin-top: var(--space-6);
}

.card-title {
  margin: 0 0 var(--space-4);
  font: var(--font-h3);
}

.create-form {
  display: flex;
  gap: var(--space-3);
  align-items: flex-end;
  flex-wrap: wrap;
}

.create-form .field {
  flex: 1 1 15rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.create-form label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.form-feedback {
  margin: var(--space-3) 0 0;
  font-size: var(--text-sm);
  min-height: 0;
}

.form-feedback:empty {
  display: none;
}

.form-feedback[data-tone="error"] {
  color: var(--danger);
}

.form-feedback[data-tone="success"] {
  color: var(--text-secondary);
}

.project-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.project-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.project-list li:last-child {
  border-bottom: none;
  padding-bottom: var(--space-1);
}

.project-list li:first-child {
  padding-top: var(--space-1);
}

.project-name {
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
  gap: var(--space-2);
  margin-left: auto;
}

.state-panel {
  padding: var(--space-10) var(--space-6);
  text-align: center;
  color: var(--text-secondary);
}

.skeleton-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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

@media (max-width: 560px) {
  .card {
    padding: var(--space-4);
  }

  .create-form .field {
    flex-basis: 100%;
  }

  .create-form :deep(button) {
    flex: 1;
  }

  .project-actions {
    width: 100%;
    margin-left: 0;
  }

  .project-actions :deep(button) {
    flex: 1;
  }
}
</style>
