<script setup lang="ts">
/**
 * XYPlotCard
 *
 * Displays an XY plot summary with ownership and type badges.
 * - Ownership badge: "Owner" (green) if currentUserId === plot.user_id, "Other" (gray) otherwise (Req 11.16)
 * - Type badge: "Private" (yellow) or "Shared" (blue) (Req 11.17)
 * - Edit button shown only when canEdit prop is true (Req 11.14)
 * - Delete button shown only when canDelete prop is true (Req 11.15)
 * - Shows x_axis and y_axis labels
 */
import type { XYPlot } from '../types';

const props = defineProps<{
  plot: XYPlot;
  currentUserId: string;
  canEdit: boolean;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  view: [id: string];
  edit: [id: string];
  delete: [id: string];
}>();

const isOwner = $computed(() => props.currentUserId === props.plot.user_id);
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
    <!-- Header: name + badges -->
    <div class="flex items-start justify-between gap-2">
      <h3 class="text-base font-semibold text-gray-900 truncate">{{ plot.name }}</h3>
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Ownership badge (Req 11.16) -->
        <span
          v-if="isOwner"
          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700"
        >
          Owner
        </span>
        <span
          v-else
          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600"
        >
          Other
        </span>

        <!-- Type badge (Req 11.17) -->
        <span
          v-if="plot.type === 'private'"
          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700"
        >
          Private
        </span>
        <span
          v-else
          class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700"
        >
          Shared
        </span>
      </div>
    </div>

    <!-- Description -->
    <p class="mt-2 text-sm text-gray-600 line-clamp-2">{{ plot.description }}</p>

    <!-- Axis labels -->
    <div class="mt-2 flex gap-4 text-xs text-gray-500">
      <span>
        X: <span class="font-medium text-gray-700">{{ plot.x_axis.label }}</span>
        <span v-if="plot.x_axis.unit" class="ml-0.5 text-gray-400">({{ plot.x_axis.unit }})</span>
      </span>
      <span>
        Y: <span class="font-medium text-gray-700">{{ plot.y_axis.label }}</span>
        <span v-if="plot.y_axis.unit" class="ml-0.5 text-gray-400">({{ plot.y_axis.unit }})</span>
      </span>
    </div>

    <!-- Footer: metadata + actions -->
    <div class="mt-3 flex items-center justify-between gap-2">
      <span class="text-xs text-gray-400">
        Updated {{ new Date(plot.updated_at).toLocaleDateString() }}
      </span>

      <div class="flex items-center gap-2">
        <!-- Edit button (Req 11.14) -->
        <button
          v-if="canEdit"
          class="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          @click="emit('edit', plot.id)"
        >
          Edit
        </button>

        <!-- Delete button (Req 11.15) -->
        <button
          v-if="canDelete"
          class="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
          @click="emit('delete', plot.id)"
        >
          Delete
        </button>

        <!-- View button -->
        <button
          class="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          @click="emit('view', plot.id)"
        >
          View →
        </button>
      </div>
    </div>
  </div>
</template>
