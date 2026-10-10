<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string;
    modelValue: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

function onChange(event: Event) {
  emit("update:modelValue", (event.currentTarget as HTMLSelectElement).value);
}
</script>

<template>
  <select
    :id="id"
    class="select"
    :value="modelValue"
    :disabled="disabled"
    @change="onChange"
  >
    <slot />
  </select>
</template>

<style scoped>
.select {
  height: 2.5rem;
  /* Right padding clears the 1rem chevron, the shared --space-3 inset,
     and a --space-2 gap, so the label never runs into the chevron. */
  padding: 0 calc(var(--space-3) + var(--space-2) + 1rem) 0 var(--space-3);
  font: inherit;
  font-size: 0.875rem;
  color: var(--text-primary);
  background-color: var(--surface-subtle);
  /* The native chevron is painted inside the right padding, hiding it.
     This one is inset by --space-3 to mirror the text on the left. SVG
     fills cannot read custom properties, so each theme needs its own
     --text-secondary value baked in. */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='m4 6 4 4 4-4' stroke='%235d5d68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  background-size: 1rem;
  appearance: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

:root[data-theme="dark"] .select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='m4 6 4 4 4-4' stroke='%239d9daa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
}

.select:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>
