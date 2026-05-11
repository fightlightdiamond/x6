<script setup lang="ts">
/**
 * TrendCard
 *
 * Displays a trend summary with ownership and type badges.
 * - Ownership badge: "Owner" (green) if currentUserId === trend.user_id, "Other" (gray) otherwise (Req 8.16)
 * - Type badge: "Private" (yellow) or "Shared" (blue) (Req 8.17)
 * - Edit/Delete buttons shown only when canEdit/canDelete props are true (Req 8.14, 8.15)
 */
import type { Trend } from '../types';

const props = defineProps<{
  trend: Trend;
  currentUserId: string;
  canEdit: boolean;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  view: [id: string];
  edit: [id: string];
  delete: [id: string];
}>();

const isOwner = $computed(() => props.currentUserId === props.trend.user_id);
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
    <!-- Header: name + badges -->
    <div class="flex items-start justify-between gap-2">
      <h3 class="text-base font-semibold text-gray-900 truncate">{{ trend.name }}</h3>
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Ownership badge (Req 8.16) -->
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

        <!-- Type badge (Req 8.17) -->
        <span
          v-if="trend.type === 'private'"
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
    <p class="mt-2 text-sm text-gray-600 line-clamp-2">{{ trend.description }}</p>

    <!-- Footer: metadata + actions -->
    <div class="mt-3 flex items-center justify-between gap-2">
      <span class="text-xs text-gray-400">
        Updated {{ new Date(trend.updated_at).toLocaleDateString() }}
      </span>

      <div class="flex items-center gap-2">
        <!-- Edit button (Req 8.14) -->
        <button
          v-if="canEdit"
          class="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          @click="emit('edit', trend.id)"
        >
          Edit
        </button>

        <!-- Delete button (Req 8.15) -->
        <button
          v-if="canDelete"
          class="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
          @click="emit('delete', trend.id)"
        >
          Delete
        </button>

        <!-- View button -->
        <button
          class="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          @click="emit('view', trend.id)"
        >
          View →
        </button>
      </div>
    </div>
  </div>
</template>
