<script setup lang="ts">
/**
 * Generic form component driven by a `fields` prop.
 * Supports text, textarea, and select field types with built-in validation,
 * error messages, loading state, and disabled state.
 *
 * @module shared/components/BaseForm
 */

import { reactive, computed } from 'vue';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FormField {
  /** Unique key used as the form value key and HTML id. */
  name: string;
  /** Human-readable label shown above the input. */
  label: string;
  /** Input type. */
  type: 'text' | 'textarea' | 'select';
  /** Whether the field is required (validated on submit). */
  required?: boolean;
  /** Options for select fields. */
  options?: Array<{ value: string; label: string }>;
  /** Placeholder text for text / textarea fields. */
  placeholder?: string;
}

// ── Props & emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  /** Field definitions that drive the form layout. */
  fields: FormField[];
  /** Show a loading spinner on the submit button when true. */
  loading?: boolean;
  /** Disable all inputs and buttons when true. */
  disabled?: boolean;
  /** Label for the submit button. Defaults to "Submit". */
  submitLabel?: string;
}>();

const emit = defineEmits<{
  /** Emitted with the current form values when validation passes. */
  submit: [values: Record<string, string>];
  /** Emitted when the user clicks Cancel. */
  cancel: [];
}>();

// ── Reactive state ────────────────────────────────────────────────────────────

/** Form values keyed by field name. */
const values = reactive<Record<string, string>>(
  Object.fromEntries(props.fields.map((f) => [f.name, ''])),
);

/** Validation error messages keyed by field name. */
const errors = reactive<Record<string, string>>(
  Object.fromEntries(props.fields.map((f) => [f.name, ''])),
);

// ── Validation ────────────────────────────────────────────────────────────────

function validate(): boolean {
  let valid = true;

  for (const field of props.fields) {
    errors[field.name] = '';

    if (field.required && !values[field.name]?.trim()) {
      errors[field.name] = `${field.label} is required.`;
      valid = false;
    }
  }

  return valid;
}

// ── Submit ────────────────────────────────────────────────────────────────────

function handleSubmit(): void {
  if (props.disabled || props.loading) return;
  if (!validate()) return;

  // Emit a plain copy of the values (not the reactive proxy)
  emit('submit', { ...values });
}

// ── Computed helpers ──────────────────────────────────────────────────────────

const isInteractive = computed(() => !props.disabled && !props.loading);

const submitButtonLabel = computed(() => props.submitLabel ?? 'Submit');

// ── Input class helper ────────────────────────────────────────────────────────

function inputClass(fieldName: string): string {
  const base =
    'mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 transition-colors';
  const errorStyle = errors[fieldName]
    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  const disabledStyle = !isInteractive.value ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : '';
  return [base, errorStyle, disabledStyle].filter(Boolean).join(' ');
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="handleSubmit">
    <!-- Dynamic fields -->
    <div v-for="field in fields" :key="field.name">
      <label :for="`field-${field.name}`" class="block text-sm font-medium text-gray-700">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500" aria-hidden="true"> *</span>
      </label>

      <!-- Text input -->
      <input
        v-if="field.type === 'text'"
        :id="`field-${field.name}`"
        v-model="values[field.name]"
        type="text"
        :placeholder="field.placeholder ?? ''"
        :disabled="!isInteractive"
        :aria-invalid="!!errors[field.name]"
        :aria-describedby="errors[field.name] ? `error-${field.name}` : undefined"
        :class="inputClass(field.name)"
      />

      <!-- Textarea -->
      <textarea
        v-else-if="field.type === 'textarea'"
        :id="`field-${field.name}`"
        v-model="values[field.name]"
        rows="4"
        :placeholder="field.placeholder ?? ''"
        :disabled="!isInteractive"
        :aria-invalid="!!errors[field.name]"
        :aria-describedby="errors[field.name] ? `error-${field.name}` : undefined"
        :class="[inputClass(field.name), 'resize-none']"
      />

      <!-- Select -->
      <select
        v-else-if="field.type === 'select'"
        :id="`field-${field.name}`"
        v-model="values[field.name]"
        :disabled="!isInteractive"
        :aria-invalid="!!errors[field.name]"
        :aria-describedby="errors[field.name] ? `error-${field.name}` : undefined"
        :class="inputClass(field.name)"
      >
        <option value="" disabled>Select {{ field.label }}…</option>
        <option
          v-for="opt in field.options ?? []"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- Error message -->
      <p
        v-if="errors[field.name]"
        :id="`error-${field.name}`"
        class="mt-1 text-xs text-red-500"
        role="alert"
      >
        {{ errors[field.name] }}
      </p>
    </div>

    <!-- Custom slot for additional fields -->
    <slot />

    <!-- Form actions -->
    <div class="flex justify-end gap-2 pt-2">
      <button
        type="button"
        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!isInteractive"
        @click="emit('cancel')"
      >
        Cancel
      </button>

      <button
        type="submit"
        class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!isInteractive"
      >
        <!-- Loading spinner -->
        <svg
          v-if="loading"
          class="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        {{ submitButtonLabel }}
      </button>
    </div>
  </form>
</template>
