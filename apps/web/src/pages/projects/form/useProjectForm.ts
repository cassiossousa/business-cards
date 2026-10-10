import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import {
  ApiError,
  createProject,
  getProject,
  updateProject,
} from "../../../api/projectsApi";
import { createCardDocument } from "../../../core/cards/createCardDocument";
import type { CardFields, CardTemplateId } from "../../../core/cards/cardTypes";
import { updateCardFields } from "../../../core/cards/updateCardFields";
import { getCardTemplate } from "../../../core/cards/templates";

export function useProjectForm() {
  const route = useRoute();
  const router = useRouter();

  const projectId = computed(() => {
    const id = route.params.id;
    return typeof id === "string" ? id : null;
  });

  const isEditing = computed(() => projectId.value !== null);
  const selectedTemplateName = computed(
    () => getCardTemplate(templateId.value).name,
  );

  const name = ref("");
  const templateId = ref<CardTemplateId>("simple");
  const fields = ref<CardFields>(createCardDocument("simple").fields);

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
      templateId.value = "simple";
      fields.value = createCardDocument("simple").fields;
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
          const loadedTemplate = project.templateId ?? "simple";

          name.value = project.name;
          templateId.value = loadedTemplate;
          fields.value = createCardDocument(
            loadedTemplate,
            project.fields ?? {},
          ).fields;
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

  function selectTemplate(nextTemplateId: CardTemplateId): void {
    if (isEditing.value || isSubmitting.value) {
      return;
    }

    templateId.value = nextTemplateId;
    fields.value = createCardDocument(nextTemplateId).fields;
    formError.value = null;
  }

  function changeFields(nextFields: CardFields): void {
    const document = updateCardFields(
      {
        templateId: templateId.value,
        fields: fields.value,
      },
      nextFields,
    );

    fields.value = document.fields;
    formError.value = null;
  }

  function hasValidQrUrl(value: string | undefined): boolean {
    if (!value) {
      return false;
    }

    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

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
      formError.value = "Card project names must be 80 characters or fewer.";
      return;
    }

    if (templateId.value === "qr-code" && !hasValidQrUrl(fields.value.qrUrl)) {
      formError.value = "Enter a valid HTTP or HTTPS QR code destination.";
      return;
    }

    isSubmitting.value = true;
    formError.value = null;

    try {
      if (projectId.value !== null) {
        // Editing does not send a template ID, so it cannot change the template.
        await updateProject(projectId.value, {
          name: trimmedName,
          fields: fields.value,
        });
      } else {
        await createProject({
          name: trimmedName,
          templateId: templateId.value,
          fields: fields.value,
        });
      }

      await router.push({ name: "projects" });
    } catch (error) {
      formError.value =
        error instanceof ApiError
          ? error.message
          : `Could not ${isEditing.value ? "save" : "create"} the project. Try again.`;
    } finally {
      isSubmitting.value = false;
    }
  }

  function cancel(): void {
    void router.push({ name: "projects" });
  }

  return {
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
  };
}
