<script setup lang="ts">
import CardFieldsEditor from "./components/CardFieldsEditor.vue";
import CardTemplatePicker from "./components/CardTemplatePicker.vue";
import ProjectFormPanel from "./components/ProjectFormPanel.vue";
import ProjectFormHeader from "./components/ProjectFormHeader.vue";
import ProjectTemplateSummary from "./components/ProjectTemplateSummary.vue";
import { useProjectForm } from "./useProjectForm";

const {
  name,
  templateId,
  fields,
  isEditing,
  selectedTemplateName,
  isLoading,
  isSubmitting,
  loadError,
  formError,
  selectTemplate,
  changeFields,
  saveProject,
  cancel,
} = useProjectForm();
</script>

<template>
  <div class="page">
    <ProjectFormHeader :is-editing="isEditing" />

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
    >
      <div v-if="!isEditing" class="template-section">
        <CardTemplatePicker
          :model-value="templateId"
          :disabled="isSubmitting"
          @update:model-value="selectTemplate"
        />
      </div>

      <ProjectTemplateSummary v-else :template-name="selectedTemplateName" />

      <CardFieldsEditor
        :template-id="templateId"
        :model-value="fields"
        :disabled="isSubmitting"
        @update:model-value="changeFields"
      />
    </ProjectFormPanel>
  </div>
</template>

<style scoped>
.page {
  max-width: 44rem;
  margin-inline: auto;
}

.template-section {
  padding-block: var(--space-1);
}
</style>
