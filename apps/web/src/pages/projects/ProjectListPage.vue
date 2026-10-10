<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

import type { CardProject } from "../../api/types";
import { ApiError, deleteProject, listProjects } from "../../api/projectsApi";
import AppButton from "../../components/AppButton.vue";

type LoadState = "loading" | "error" | "ready";

interface Feedback {
  tone: "success" | "error";
  text: string;
}

const LOADING_DELAY_MS = 150;

const projects = ref<CardProject[]>([]);
const loadState = ref<LoadState>("loading");
const showLoadingState = ref(false);

const deleteFeedback = ref<Feedback | null>(null);
const pendingDeleteId = ref<string | null>(null);
const deletingId = ref<string | null>(null);

let loadingTimer: ReturnType<typeof setTimeout> | undefined;

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

function requestDelete(project: CardProject): void {
  pendingDeleteId.value = project.id;
  deleteFeedback.value = null;
}

function cancelDelete(): void {
  pendingDeleteId.value = null;
  deleteFeedback.value = null;
}

async function confirmDelete(): Promise<void> {
  const id = pendingDeleteId.value;

  if (id === null || deletingId.value !== null) {
    return;
  }

  deletingId.value = id;
  deleteFeedback.value = null;

  try {
    await deleteProject(id);

    projects.value = projects.value.filter((project) => project.id !== id);

    pendingDeleteId.value = null;
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
  <div class="page-heading-row">
    <h2 class="page-heading">Your projects</h2>

    <RouterLink
      class="action-link action-link--primary"
      :to="{ name: 'project-new' }"
    >
      Create project
    </RouterLink>
  </div>

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
        <div class="project-details">
          <span class="project-name">
            {{ project.name }}
          </span>

          <span class="project-created">
            Created {{ formatDate(project.createdAt) }}
          </span>
        </div>

        <div v-if="pendingDeleteId !== project.id" class="project-actions">
          <RouterLink
            class="action-link action-link--secondary"
            :to="{
              name: 'project-edit',
              params: { id: project.id },
            }"
          >
            Edit
          </RouterLink>

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

.action-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font: inherit;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

.action-link--primary {
  color: var(--accent-contrast);
  background: var(--accent);
}

.action-link--primary:hover {
  background: var(--accent-hover);
}

.action-link--secondary {
  color: var(--text);
  background: transparent;
  border-color: var(--border);
}

.action-link--secondary:hover {
  background: var(--page-bg);
}

.action-link:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.form-feedback {
  margin: var(--space-3) 0 0;
  font-size: var(--text-sm);
}

.form-feedback[data-tone="error"] {
  color: var(--danger);
}

.project-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
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
  padding-bottom: var(--space-1);
  border-bottom: none;
}

.project-list li:first-child {
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

@media (max-width: 560px) {
  .page-heading-row {
    align-items: stretch;
  }

  .page-heading-row .action-link {
    width: 100%;
  }

  .card {
    padding: var(--space-4);
  }

  .project-actions {
    width: 100%;
    margin-left: 0;
  }

  .project-actions .action-link,
  .project-actions :deep(button) {
    flex: 1;
  }
}
</style>
