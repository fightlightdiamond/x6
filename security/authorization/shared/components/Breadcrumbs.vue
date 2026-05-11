<script setup lang="ts">
/**
 * Breadcrumbs
 *
 * Renders a breadcrumb trail from an array of items.
 * Items with a `path` are rendered as clickable links; items without are
 * rendered as plain text (typically the current page).
 *
 * @example
 * ```vue
 * <Breadcrumbs
 *   :items="[
 *     { label: 'Dashboard', path: '/' },
 *     { label: 'Trends', path: '/trends' },
 *     { label: 'My Trend' },
 *   ]"
 * />
 * ```
 *
 * @module shared/components/Breadcrumbs
 */

import { useRouter } from 'vue-router';

// ── Props ──────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  /** Display label for this breadcrumb segment. */
  label: string;
  /** Optional path to navigate to when clicked. */
  path?: string;
}

const props = defineProps<{
  /** Ordered list of breadcrumb segments, from root to current page. */
  items: BreadcrumbItem[];
}>();

// ── Navigation ─────────────────────────────────────────────────────────────

const router = useRouter();

function navigate(path: string): void {
  router.push(path);
}
</script>

<template>
  <nav
    class="flex items-center gap-1 text-sm text-gray-500"
    aria-label="Breadcrumb"
  >
    <ol class="flex items-center gap-1 flex-wrap">
      <li
        v-for="(item, index) in props.items"
        :key="index"
        class="flex items-center gap-1"
      >
        <!-- Separator (not shown before the first item) -->
        <span
          v-if="index > 0"
          class="text-gray-300 select-none"
          aria-hidden="true"
        >
          /
        </span>

        <!-- Clickable link when path is provided and not the last item -->
        <button
          v-if="item.path && index < props.items.length - 1"
          class="hover:text-blue-600 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          @click="navigate(item.path)"
        >
          {{ item.label }}
        </button>

        <!-- Current page (last item or no path) -->
        <span
          v-else
          :aria-current="index === props.items.length - 1 ? 'page' : undefined"
          :class="[
            index === props.items.length - 1
              ? 'font-medium text-gray-900'
              : 'text-gray-500',
          ]"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
