<script setup lang="ts">
import type { Report } from '../types';

const props = defineProps<{
  report: Report;
  canEdit: boolean;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  view: [id: string];
  edit: [id: string];
  delete: [id: string];
}>();

const formatBadgeClass: Record<Report['format'], string> = {
  pdf: 'bg-red-100 text-red-700',
  excel: 'bg-green-100 text-green-700',
  csv: 'bg-blue-100 text-blue-700',
};
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between gap-2">
      <h3 class="text-base font-semibold text-gray-900 truncate">{{ report.title }}</h3>
      <!-- Format badge -->
      <span
        class="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase"
        :class="formatBadgeClass[report.format]"
      >
        {{ report.format }}
      </span>
    </div>
    <p class="mt-2 text-sm text-gray-600 line-clamp-2">{{ report.description }}</p>
    <div class="mt-3 flex items-center justify-between">
      <span class="text-xs text-gray-400">
        Updated {{ new Date(report.updated_at).toLocaleDateString() }}
      </span>
      <div class="flex items-center gap-2">
        <!-- Edit button: only shown when canEdit is true (Req 10.13) -->
        <button
          v-if="canEdit"
          class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          @click="emit('edit', report.id)"
        >
          Edit
        </button>
        <!-- Delete button: only shown when canDelete is true (Req 10.14) -->
        <button
          v-if="canDelete"
          class="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          @click="emit('delete', report.id)"
        >
          Delete
        </button>
        <button
          class="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          @click="emit('view', report.id)"
        >
          View →
        </button>
      </div>
    </div>
  </div>
</template>
