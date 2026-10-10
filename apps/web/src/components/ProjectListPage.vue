<script setup lang="ts">
import { onMounted, ref } from "vue";

import type { CardProject } from "../api/types";
import {
  ApiError,
  createProject,
  deleteProject,
  listProjects,
} from "../api/projectsApi";

type LoadState = "loading" | "error" | "ready";

interface FormFeedback {
  tone: "success" | "error";
  text: string;
}

const projects = ref<CardProject[]>([]);
const loadState = ref<LoadState>("loading");
const loadFailed = ref(false);

const newName = ref("");
const isSubmitting = ref(false);
const formFeedback = ref<FormFeedback | null>(null);

const pendingDeleteId = ref<string | null>(null);
const deletingId = ref<string | null>(null);
const deleteFeedback = ref<FormFeedback | null>(null);

async function loadProjects(): Promise<void> {
  loadState.value = "loading";
  loadFailed.value = false;

  try {
    const response = await listProjects();
    projects.value = response.projects;
    loadState.value = "ready";
  } catch {
    loadFailed.value = true;
    loadState.value = "error";
  }
}

async function submitCreate(): Promise<void> {
  const name = newName.value.trim();

  if (!name) {
    formFeedback.value = { tone: "error", text: "Enter a project name." };
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
</script>

<template>
  <h2 class="page-heading">Your projects</h2>

  <section class="card" aria-labelledby="create-project-title">
    <h3 id="create-project-title" class="card-title">Start a new project</h3>
    <form class="create-form" @submit.prevent="submitCreate">
      <div class="field">
        <label for="project-name">Project name</label>
        <input
          id="project-name"
          v-model="newName"
          class="input"
          name="project-name"
          type="text"
          placeholder="e.g. Studio cards"
          :disabled="isSubmitting"
          autocomplete="off"
        />
      </div>
      <button class="btn btn-primary" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? "Creating…" : "Create project" }}
      </button>
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
      <ul class="skeleton-list" aria-hidden="true">
        <li v-for="index in 3" :key="index"></li>
      </ul>
      <p class="state-panel" role="status">Loading projects…</p>
    </div>

    <div v-else-if="loadState === 'error'" class="state-panel">
      <p>Could not load your projects.</p>
      <button class="btn btn-secondary" type="button" @click="loadProjects">
        Try again
      </button>
    </div>

    <p v-else-if="projects.length === 0" class="state-panel">
      No projects yet. Create your first card project above.
    </p>

    <ul v-else class="project-list">
      <li v-for="project in projects" :key="project.id">
        <div>
          <span class="project-name">{{ project.name }}</span>
          <span class="project-created"
            >Created {{ formatDate(project.createdAt) }}</span
          >
        </div>
        <div v-if="pendingDeleteId !== project.id" class="project-actions">
          <button
            class="btn btn-danger"
            type="button"
            @click="requestDelete(project)"
          >
            Delete
          </button>
        </div>
        <div v-else class="project-actions">
          <button
            class="btn btn-danger-solid"
            type="button"
            :disabled="deletingId === project.id"
            @click="confirmDelete"
          >
            {{ deletingId === project.id ? "Deleting…" : "Confirm delete" }}
          </button>
          <button
            class="btn btn-secondary"
            type="button"
            :disabled="deletingId === project.id"
            @click="cancelDelete"
          >
            Cancel
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
