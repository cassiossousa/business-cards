<script setup lang="ts">
import { CARD_TEMPLATES } from "../../../../core/cards/templates";
import type { CardTemplateId } from "../../../../core/cards/cardTypes";

defineProps<{
  modelValue: CardTemplateId;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: CardTemplateId];
}>();

function selectTemplate(templateId: CardTemplateId): void {
  emit("update:modelValue", templateId);
}
</script>

<template>
  <fieldset class="template-picker" :disabled="disabled">
    <legend class="section-title">Choose a card template</legend>
    <p class="section-description">
      The template determines the card layout and which fields are editable.
    </p>

    <div class="template-options">
      <label
        v-for="template in CARD_TEMPLATES"
        :key="template.id"
        class="template-option"
        :class="{ selected: modelValue === template.id }"
        :for="`template-${template.id}`"
      >
        <input
          :id="`template-${template.id}`"
          type="radio"
          name="card-template"
          :value="template.id"
          :checked="modelValue === template.id"
          :disabled="disabled"
          @change="selectTemplate(template.id)"
        />

        <span class="option-content">
          <span class="option-title">{{ template.name }}</span>
          <span class="option-description">{{ template.description }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.template-picker {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.section-title {
  padding: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: 600;
}

.section-description {
  margin: var(--space-2) 0 var(--space-3);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.template-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.template-option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color 140ms ease,
    background-color 140ms ease;
}

.template-option.selected {
  border-color: var(--primary);
  background: var(--surface);
}

.template-option:focus-within {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.template-option input {
  flex: 0 0 auto;
  margin: 0.25rem 0 0;
  accent-color: var(--primary);
}

.option-content {
  display: grid;
  gap: var(--space-1);
}

.option-title {
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: 600;
}

.option-description {
  color: var(--text-secondary);
  font-size: var(--text-xs);
  line-height: 1.5;
}

@media (max-width: 560px) {
  .template-options {
    grid-template-columns: 1fr;
  }
}
</style>
