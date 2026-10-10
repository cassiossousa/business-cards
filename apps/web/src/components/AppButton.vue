<script setup lang="ts">
type ButtonVariant = "primary" | "secondary" | "danger" | "danger-solid";
type ButtonType = "button" | "submit" | "reset";

withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    type?: ButtonType;
    disabled?: boolean;
  }>(),
  {
    variant: "primary",
    type: "button",
    disabled: false,
  },
);
</script>

<template>
  <button :class="['btn', `btn-${variant}`]" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  height: 2.5rem;
  padding: 0 var(--space-4);
  font: inherit;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  color: var(--text-on-fill);
  background: var(--primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-secondary {
  color: var(--text-primary);
  background: transparent;
  border-color: var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--surface-subtle);
}

.btn-danger {
  color: var(--danger);
  background: transparent;
  border-color: var(--border);
}

.btn-danger:hover:not(:disabled) {
  color: var(--danger-hover);
  border-color: var(--danger);
}

.btn-danger-solid {
  color: var(--text-on-fill);
  background: var(--danger);
}

.btn-danger-solid:hover:not(:disabled) {
  background: var(--danger-hover);
}
</style>
