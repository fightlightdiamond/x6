<script setup lang="ts">
import type { Mimic } from '../types';

const props = defineProps<{
  mimic: Mimic;
  canEdit: boolean;
  canDelete: boolean;
}>();

const emit = defineEmits<{
  view: [id: string];
  edit: [id: string];
  delete: [id: string];
}>();
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between gap-2">
      <h3 class="text-base font-semibold text-gray-900 truncate">{{ mimic.name }}</h3>
    </div>
    <p class="mt-2 text-sm text-gray-600 line-clamp-2">{{ mimic.description }}</p>
    <div class="mt-3 flex items-center justify-between">
      <span class="text-xs text-gray-400">
        Updated {{ new Date(mimic.updated_at).toLocaleDateString() }}
      </span>
      <div class="flex items-center gap-2">
        <!-- Edit button: only shown when canEdit is true (Req 9.13) -->
        <button
          v-if="canEdit"
          class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          @click="emit('edit', mimic.id)"
        >
          Edit
        </button>
        <!-- Delete button: only shown when canDelete is true (Req 9.14) -->
        <button
          v-if="canDelete"
          class="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          @click="emit('delete', mimic.id)"
        >
          Delete
        </button>
        <button
          class="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          @click="emit('view', mimic.id)"
        >
          View →
        </button>
      </div>
    </div>
  </div>
</template>
