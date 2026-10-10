<script setup lang="ts">
import AppButton from "../../../../components/AppButton.vue";
import AppInput from "../../../../components/AppInput.vue";

defineProps<{
  name: string;
  isEditing: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  loadError: string | null;
  formError: string | null;
}>();

const emit = defineEmits<{
  "update:name": [value: string];
  "clear-error": [];
  submit: [];
  cancel: [];
}>();

function onNameUpdate(value: string): void {
  emit("update:name", value);
  emit("clear-error");
}
</script>

<template>
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

    <form v-else @submit.prevent="emit('submit')">
      <h3 id="project-form-title" class="card-title">Project details</h3>

      <div class="field">
        <label for="project-name">Project name</label>
        <AppInput
          id="project-name"
          :model-value="name"
          name="project-name"
          type="text"
          placeholder="e.g. Studio cards"
          autocomplete="off"
          maxlength="80"
          required
          :disabled="isSubmitting"
          :aria-invalid="Boolean(formError)"
          :aria-describedby="formError ? 'project-name-error' : undefined"
          @update:model-value="onNameUpdate"
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
          @click="emit('cancel')"
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
