<script setup lang="ts">
import type { WebPage } from '../types';

const props = defineProps<{ page: WebPage }>();
const emit = defineEmits<{ view: [id: string] }>();
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between gap-2">
      <h3 class="text-base font-semibold text-gray-900 truncate">{{ page.title }}</h3>
    </div>
    <p class="mt-1 text-xs text-blue-600 truncate">{{ page.url }}</p>
    <p class="mt-2 text-sm text-gray-600 line-clamp-2">{{ page.content }}</p>
    <div class="mt-3 flex items-center justify-between">
      <span class="text-xs text-gray-400">
        Updated {{ new Date(page.updated_at).toLocaleDateString() }}
      </span>
      <button
        class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        @click="emit('view', page.id)"
      >
        View →
      </button>
    </div>
  </div>
</template>
