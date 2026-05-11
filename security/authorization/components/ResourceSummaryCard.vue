<script setup lang="ts">
/**
 * ResourceSummaryCard
 *
 * Displays a summary card for a single resource type, showing:
 * - The resource label and total item count
 * - A list of recent items (up to the provided array length)
 *
 * @module components/ResourceSummaryCard
 */

import type { ResourceType } from '../types/index';

const props = defineProps<{
  /** The resource type identifier (e.g. 'web', 'trends'). */
  resourceType: ResourceType;
  /** Total number of items for this resource. */
  count: number;
  /** Recent items to display (already sliced to desired limit by caller). */
  recentItems: unknown[];
  /** Human-readable label for the resource (e.g. 'Web Pages'). */
  label: string;
}>();

// ── Icon mapping ───────────────────────────────────────────────────────────

/** Returns a simple emoji icon for each resource type. */
function resourceIcon(type: ResourceType): string {
  const icons: Record<ResourceType, string> = {
    web: '🌐',
    trends: '📈',
    mimics: '🖥️',
    reports: '📄',
    xy_plots: '📊',
    trends_export: '⬇️',
    xy_plots_export: '⬇️',
  };
  return icons[type] ?? '📦';
}

/** Returns a Tailwind accent color class for each resource type. */
function accentClass(type: ResourceType): string {
  const colors: Record<ResourceType, string> = {
    web: 'bg-blue-50 border-blue-200',
    trends: 'bg-green-50 border-green-200',
    mimics: 'bg-purple-50 border-purple-200',
    reports: 'bg-orange-50 border-orange-200',
    xy_plots: 'bg-teal-50 border-teal-200',
    trends_export: 'bg-gray-50 border-gray-200',
    xy_plots_export: 'bg-gray-50 border-gray-200',
  };
  return colors[type] ?? 'bg-gray-50 border-gray-200';
}

function countTextClass(type: ResourceType): string {
  const colors: Record<ResourceType, string> = {
    web: 'text-blue-700',
    trends: 'text-green-700',
    mimics: 'text-purple-700',
    reports: 'text-orange-700',
    xy_plots: 'text-teal-700',
    trends_export: 'text-gray-700',
    xy_plots_export: 'text-gray-700',
  };
  return colors[type] ?? 'text-gray-700';
}

/** Extracts a display name from an unknown recent item. */
function itemName(item: unknown): string {
  if (item !== null && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    const name = obj['name'] ?? obj['title'] ?? obj['id'];
    return typeof name === 'string' ? name : String(name ?? '—');
  }
  return '—';
}

/** Extracts the updated_at date from an unknown recent item. */
function itemDate(item: unknown): string {
  if (item !== null && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    const raw = obj['updated_at'];
    if (typeof raw === 'string') {
      return new Date(raw).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    }
  }
  return '';
}
</script>

<template>
  <div
    :class="['rounded-lg border p-4 shadow-sm', accentClass(resourceType)]"
    role="region"
    :aria-label="`${label} summary`"
  >
    <!-- Header: icon + label + count -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-2xl" aria-hidden="true">{{ resourceIcon(resourceType) }}</span>
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {{ label }}
        </h3>
      </div>
      <span
        :class="['text-3xl font-bold tabular-nums', countTextClass(resourceType)]"
        :aria-label="`${count} ${label}`"
      >
        {{ count }}
      </span>
    </div>

    <!-- Recent items list -->
    <div class="mt-3">
      <p class="text-xs font-medium text-gray-500 mb-1">Recent</p>

      <ul
        v-if="recentItems.length > 0"
        class="space-y-1"
        :aria-label="`Recent ${label}`"
      >
        <li
          v-for="(item, index) in recentItems"
          :key="index"
          class="flex items-center justify-between text-sm"
        >
          <span class="truncate text-gray-700 max-w-[70%]">{{ itemName(item) }}</span>
          <span class="text-xs text-gray-400 shrink-0 ml-2">{{ itemDate(item) }}</span>
        </li>
      </ul>

      <p v-else class="text-sm text-gray-400 italic">No items yet</p>
    </div>
  </div>
</template>
