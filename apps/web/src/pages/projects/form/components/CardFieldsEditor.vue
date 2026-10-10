<script setup lang="ts">
import { getCardTemplate } from "../../../../core/cards/templates";
import type {
  CardFieldKey,
  CardFields,
  CardTemplateId,
} from "../../../../core/cards/cardTypes";

const props = defineProps<{
  templateId: CardTemplateId;
  modelValue: CardFields;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: CardFields];
}>();

function updateField(key: CardFieldKey, event: Event): void {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  emit("update:modelValue", {
    ...props.modelValue,
    [key]: target.value,
  });
}
</script>

<template>
  <section class="fields-editor" aria-labelledby="card-fields-title">
    <div class="section-heading">
      <h3 id="card-fields-title">Card details</h3>
      <p>Update the information shown on your card.</p>
    </div>

    <div class="field-list">
      <div
        v-for="field in getCardTemplate(templateId).fields"
        :key="field.key"
        class="field"
      >
        <label :for="`card-field-${field.key}`">
          {{ field.label }}
        </label>

        <input
          :id="`card-field-${field.key}`"
          :name="`card-field-${field.key}`"
          :type="field.inputType"
          :value="modelValue[field.key] ?? ''"
          :placeholder="field.placeholder"
          :autocomplete="field.autocomplete ?? 'off'"
          :required="field.required ?? false"
          :disabled="disabled"
          maxlength="200"
          @input="updateField(field.key, $event)"
        />
      </div>
    </div>

    <p v-if="templateId === 'qr-code'" class="field-hint">
      The QR code points to the destination URL. Updating the URL changes its
      content without changing the card template.
    </p>
  </section>
</template>

<style scoped>
.fields-editor {
  min-width: 0;
}

.section-heading {
  margin-bottom: var(--space-4);
}

.section-heading h3 {
  margin: 0;
  color: var(--text-primary);
  font: var(--font-h3);
}

.section-heading p {
  margin: var(--space-2) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.field-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2);
}

.field label {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: 500;
}

.field input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: var(--space-3);
  color: var(--text-primary);
  font: inherit;
  font-size: var(--text-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.field input:focus-visible {
  border-color: var(--primary);
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.field input:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.field-hint {
  margin: var(--space-3) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  line-height: 1.5;
}

@media (max-width: 560px) {
  .field-list {
    grid-template-columns: 1fr;
  }
}
</style>
