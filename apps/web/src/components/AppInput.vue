<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string;
    modelValue: string;
    type?: string;
    disabled?: boolean;
  }>(),
  {
    type: "text",
    disabled: false,
  },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

function onInput(event: Event) {
  emit("update:modelValue", (event.currentTarget as HTMLInputElement).value);
}
</script>

<template>
  <input
    :id="id"
    class="input"
    :type="type"
    :value="modelValue"
    :disabled="disabled"
    @input="onInput"
  />
</template>

<style scoped>
.input {
  height: 2.5rem;
  padding: 0 var(--space-3);
  font: inherit;
  color: var(--text-primary);
  background: var(--surface-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.input:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
