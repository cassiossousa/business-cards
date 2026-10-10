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
  height: var(--space-10);
  padding: 0 var(--space-4);
  font: inherit;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.btn:focus-visible {
  outline: 2px solid var(--violet-500);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  color: var(--white);
  background: var(--violet-500);
}

.btn-primary:hover:not(:disabled) {
  background: var(--violet-600);
}

.btn-secondary {
  color: var(--gray-900);
  background: transparent;
  border-color: var(--gray-200);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--gray-100);
}

.btn-danger {
  color: var(--red-500);
  background: transparent;
  border-color: var(--gray-200);
}

.btn-danger:hover:not(:disabled) {
  color: var(--red-600);
  border-color: var(--red-500);
}

.btn-danger-solid {
  color: var(--white);
  background: var(--red-500);
}

.btn-danger-solid:hover:not(:disabled) {
  background: var(--red-600);
}
</style>
