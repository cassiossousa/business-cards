<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  ApiError,
  createProject,
  getProject,
  updateProject,
} from "../../api/projectsApi";
import AppButton from "../../components/AppButton.vue";
import AppInput from "../../components/AppInput.vue";

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

      if (active) {
        name.value = project.name;
      }
    } catch (error) {
      if (active) {
        loadError.value =
          error instanceof ApiError
            ? error.message
            : "Could not load this project. Try again.";
      }
    } finally {
      if (active) {
        isLoading.value = false;
      }
    }
  },
  { immediate: true },
);

async function saveProject(): Promise<void> {
  if (isSubmitting.value) {
    return;
  }

  const trimmedName = name.value.trim();

  if (!trimmedName) {
    formError.value = "Enter a project name.";
    return;
  }

  if (trimmedName.length > 80) {
    formError.value = "CardProject names must be 80 characters or fewer.";
    return;
  }

  isSubmitting.value = true;
  formError.value = null;

  try {
    if (projectId.value !== null) {
      await updateProject(projectId.value, trimmedName);
    } else {
      await createProject(trimmedName);
    }

    await router.push({ name: "projects" });
  } catch (error) {
    formError.value =
      error instanceof ApiError
        ? error.message
        : `Could not ${
            isEditing.value ? "save" : "create"
          } the project. Try again.`;
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

    <section class="card" aria-labelledby="project-form-title">
      <p v-if="isLoading" class="state-panel" role="status" aria-busy="true">
        Loading project…
      </p>

      <template v-else-if="loadError">
        <p class="form-feedback" role="alert">
          {{ loadError }}
        </p>

        <RouterLink class="text-link" :to="{ name: 'projects' }">
          Back to projects
        </RouterLink>
      </template>

      <form v-else @submit.prevent="saveProject">
        <h3 id="project-form-title" class="card-title">Project details</h3>

        <div class="field">
          <label for="project-name">Project name</label>

          <AppInput
            id="project-name"
            v-model="name"
            name="project-name"
            type="text"
            placeholder="e.g. Studio cards"
            autocomplete="off"
            maxlength="80"
            required
            :disabled="isSubmitting"
            :aria-invalid="Boolean(formError)"
            :aria-describedby="formError ? 'project-name-error' : undefined"
            @update:model-value="formError = null"
          />

          <p class="field-hint">
            Use a name that helps you recognize this project.
          </p>

          <p
            v-if="formError"
            id="project-name-error"
            class="form-feedback"
            role="alert"
          >
            {{ formError }}
          </p>
        </div>

        <div class="form-actions">
          <AppButton
            variant="secondary"
            type="button"
            :disabled="isSubmitting"
            @click="cancel"
          >
            Cancel
          </AppButton>

          <AppButton variant="primary" type="submit" :disabled="isSubmitting">
            {{
              isSubmitting
                ? isEditing
                  ? "Saving…"
                  : "Creating…"
                : isEditing
                  ? "Save changes"
                  : "Create project"
            }}
          </AppButton>
        </div>
      </form>
    </section>
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

.card {
  padding: var(--space-6);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.card-title {
  margin: 0 0 var(--space-5);
  font: var(--font-h3);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field label {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: 500;
}

.field-hint {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.form-feedback {
  margin: var(--space-2) 0 0;
  color: var(--danger);
  font-size: var(--text-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.state-panel {
  padding: var(--space-6) 0;
  color: var(--text-secondary);
}

.text-link {
  display: inline-block;
  margin-top: var(--space-3);
  color: var(--primary);
  text-underline-offset: 0.2em;
}

.text-link:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: var(--space-1);
}

@media (max-width: 560px) {
  .card {
    padding: var(--space-4);
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions :deep(button) {
    width: 100%;
  }
}
</style>
