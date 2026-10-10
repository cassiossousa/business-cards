import { onMounted, onUnmounted, ref } from "vue";

import type { CardProject } from "../../../api/types";
import {
  ApiError,
  deleteProject,
  listProjects,
} from "../../../api/projectsApi";

export type ProjectLoadState = "loading" | "error" | "ready";

export interface ProjectFeedback {
  tone: "success" | "error";
  text: string;
}

const LOADING_DELAY_MS = 150;

export function useProjectList() {
  const projects = ref<CardProject[]>([]);
  const loadState = ref<ProjectLoadState>("loading");
  const showLoadingState = ref(false);
  const deleteFeedback = ref<ProjectFeedback | null>(null);
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

  onMounted(() => {
    void loadProjects();
  });

  onUnmounted(clearLoadingTimer);

  return {
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
  };
}
