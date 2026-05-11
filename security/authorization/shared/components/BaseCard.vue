<script setup lang="ts">
/**
 * Generic card component with optional title, description, action buttons,
 * and slots for custom content and footer.
 *
 * @module shared/components/BaseCard
 */

export interface CardAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
}

const props = defineProps<{
  /** Card heading. */
  title?: string;
  /** Short descriptive text shown below the title. */
  description?: string;
  /** Action buttons rendered in the card header area. */
  actions?: CardAction[];
}>();

// ── Variant → Tailwind class mapping ─────────────────────────────────────────

function actionClass(variant: CardAction['variant']): string {
  switch (variant) {
    case 'primary':
      return 'rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors';
    case 'danger':
      return 'rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors';
    case 'secondary':
    default:
      return 'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors';
  }
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
    <!-- Header: title + action buttons -->
    <div
      v-if="title || (actions && actions.length > 0)"
      class="flex items-start justify-between gap-4 px-4 pt-4"
    >
      <div class="min-w-0 flex-1">
        <h3 v-if="title" class="truncate text-base font-semibold text-gray-900">
          {{ title }}
        </h3>
        <p v-if="description" class="mt-0.5 text-sm text-gray-500 line-clamp-2">
          {{ description }}
        </p>
      </div>

      <!-- Action buttons -->
      <div v-if="actions && actions.length > 0" class="flex shrink-0 gap-2">
        <button
          v-for="(action, i) in actions"
          :key="i"
          :class="actionClass(action.variant)"
          type="button"
          @click="action.onClick()"
        >
          {{ action.label }}
        </button>
      </div>
    </div>

    <!-- Default slot: custom content body -->
    <div class="px-4 py-4">
      <slot />
    </div>

    <!-- Footer slot -->
    <div
      v-if="$slots['footer']"
      class="border-t border-gray-100 px-4 py-3"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
