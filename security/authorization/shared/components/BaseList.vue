<script setup lang="ts" generic="T">
/**
 * Generic list component with pagination, filtering, sorting, and slot-based item rendering.
 *
 * @module shared/components/BaseList
 */

const props = defineProps<{
  /** Array of items to display. */
  items: T[];
  /** Show loading skeleton when true. */
  loading?: boolean;
  /** Message shown when items array is empty. */
  emptyMessage?: string;
  /** Current page (1-based). */
  page?: number;
  /** Number of items per page. */
  pageSize?: number;
  /** Total number of items across all pages (for pagination controls). */
  totalItems?: number;
}>();

const emit = defineEmits<{
  /** Emitted when the user navigates to a different page. */
  pageChange: [page: number];
  /** Emitted when the user requests a sort change. */
  sort: [field: string, direction: 'asc' | 'desc'];
  /** Emitted when the user types in the filter input. */
  filter: [query: string];
}>();

// ── Derived pagination state ──────────────────────────────────────────────────

const currentPage = $computed(() => props.page ?? 1);
const pageSize = $computed(() => props.pageSize ?? 10);
const totalItems = $computed(() => props.totalItems ?? props.items.length);
const totalPages = $computed(() => Math.max(1, Math.ceil(totalItems / pageSize)));

function goToPage(p: number): void {
  if (p < 1 || p > totalPages) return;
  emit('pageChange', p);
}

// ── Filter ────────────────────────────────────────────────────────────────────

function onFilterInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('filter', target.value);
}

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortDirection = 'asc' | 'desc';

function onSort(field: string, direction: SortDirection): void {
  emit('sort', field, direction);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Filter bar -->
    <div class="flex items-center gap-2">
      <input
        type="text"
        placeholder="Filter…"
        class="block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        @input="onFilterInput"
      />
      <!-- Slot for additional toolbar actions (e.g. sort buttons) -->
      <slot name="toolbar" :on-sort="onSort" />
    </div>

    <!-- Loading state -->
    <template v-if="loading">
      <slot name="loading">
        <div class="space-y-3">
          <div
            v-for="n in (pageSize ?? 5)"
            :key="n"
            class="h-16 animate-pulse rounded-lg bg-gray-100"
          />
        </div>
      </slot>
    </template>

    <!-- Empty state -->
    <template v-else-if="items.length === 0">
      <slot name="empty">
        <div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p class="text-sm text-gray-500">{{ emptyMessage ?? 'No items found.' }}</p>
        </div>
      </slot>
    </template>

    <!-- Item list -->
    <template v-else>
      <ul class="space-y-3" role="list">
        <li v-for="(item, index) in items" :key="index">
          <!-- Default slot receives the item and its index -->
          <slot :item="item" :index="index" />
        </li>
      </ul>
    </template>

    <!-- Pagination controls -->
    <div
      v-if="!loading && totalPages > 1"
      class="flex items-center justify-between border-t border-gray-200 pt-4"
    >
      <p class="text-sm text-gray-500">
        Page {{ currentPage }} of {{ totalPages }}
        <span v-if="totalItems">({{ totalItems }} items)</span>
      </p>
      <div class="flex gap-1">
        <button
          class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          ← Prev
        </button>
        <button
          class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Next →
        </button>
      </div>
    </div>
  </div>
</template>
