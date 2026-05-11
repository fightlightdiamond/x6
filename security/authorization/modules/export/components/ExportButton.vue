<script setup lang="ts">
/**
 * ExportButton component.
 *
 * Renders an export control (format selector + button) only when the current
 * user has the `export` permission for the given resource type (Req 12.3).
 * Delegates the actual export operation to the appropriate composable based on
 * `resourceType` (Req 12.2, 12.4, 12.5).
 *
 * @module modules/export/components/ExportButton
 */

import { computed, ref } from 'vue';
import { useAuthorizationStore } from '../../../stores/authorizationStore';
import { useTrendsExport } from '../composables/useTrendsExport';
import { useXYPlotsExport } from '../composables/useXYPlotsExport';
import type { ExportFormat } from '../composables/useTrendsExport';

const props = defineProps<{
  /** The resource type to export. Determines which composable is used. */
  resourceType: 'trends_export' | 'xy_plots_export';
  /** The id of the specific resource instance to export. */
  resourceId: string;
}>();

const authStore = useAuthorizationStore();

/**
 * Whether the current user has the `export` permission for this resource type.
 * The button is hidden entirely when this is `false` (Req 12.3).
 */
const canExport = computed(() => authStore.can('export', props.resourceType));

const trendsExport = useTrendsExport();
const xyPlotsExport = useXYPlotsExport();

/** Unified loading state from the active composable. */
const loading = computed(() =>
  props.resourceType === 'trends_export'
    ? trendsExport.loading.value
    : xyPlotsExport.loading.value,
);

/** Unified success message from the active composable. */
const success = computed(() =>
  props.resourceType === 'trends_export'
    ? trendsExport.success.value
    : xyPlotsExport.success.value,
);

/** Unified error message from the active composable. */
const error = computed(() =>
  props.resourceType === 'trends_export'
    ? trendsExport.error.value
    : xyPlotsExport.error.value,
);

/** Currently selected export format. */
const selectedFormat = ref<ExportFormat>('csv');

/**
 * Triggers the export operation for the current resource.
 * Permission is re-checked inside the composable (Req 12.4).
 */
async function handleExport(): Promise<void> {
  if (props.resourceType === 'trends_export') {
    await trendsExport.exportTrend(props.resourceId, selectedFormat.value);
  } else {
    await xyPlotsExport.exportXYPlot(props.resourceId, selectedFormat.value);
  }
}
</script>

<template>
  <!-- Hidden when user doesn't have export permission (Req 12.3) -->
  <div v-if="canExport" class="flex items-center gap-2">
    <!-- Format selector (Req 12.5) -->
    <select
      v-model="selectedFormat"
      class="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Export format"
    >
      <option value="csv">CSV</option>
      <option value="json">JSON</option>
      <option value="excel">Excel</option>
    </select>

    <!-- Export trigger button -->
    <button
      type="button"
      :disabled="loading"
      class="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      @click="handleExport"
    >
      {{ loading ? 'Exporting...' : 'Export' }}
    </button>

    <!-- Success feedback (Req 12.11) -->
    <span v-if="success" class="text-sm text-green-600">{{ success }}</span>

    <!-- Error feedback (Req 12.12) -->
    <span v-if="error" class="text-sm text-red-600">{{ error }}</span>
  </div>
</template>
