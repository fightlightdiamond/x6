<script setup lang="ts">
/**
 * WebPagesListPage
 *
 * Lists all web pages visible to the current user.
 * - "Create Web Page" button is only shown when `canCreate` is true (Req 7.9, 7.10)
 * - Pages list is filtered by view permission via the `useWeb()` composable (Req 7.4, 7.11)
 * - Shows loading state while fetching (Req 7.5)
 * - Shows empty state when no pages are available (Req 7.6)
 */
import { ref, onMounted } from 'vue';
import { useWeb } from '../composable';
import WebPageCard from '../components/WebPageCard.vue';
import WebPageForm from '../components/WebPageForm.vue';
import type { WebPage } from '../types';

const { pages, loading, error, canCreate, fetchAll, create } = useWeb();

const showCreateForm = ref(false);
const createError = ref<string | null>(null);

// Emit for parent navigation (or use router if available)
const emit = defineEmits<{ viewPage: [id: string] }>();

onMounted(async () => {
  await fetchAll();
});

async function handleCreate(data: Omit<WebPage, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  createError.value = null;
  try {
    await create(data);
    showCreateForm.value = false;
  } catch (err) {
    createError.value = err instanceof Error ? err.message : 'Failed to create page';
  }
}

function handleView(id: string): void {
  emit('viewPage', id);
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Web Pages</h1>
      <!-- Create button: only shown when user has create permission (Req 7.9, 7.10) -->
      <button
        v-if="canCreate"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        @click="showCreateForm = true"
      >
        + Create Web Page
      </button>
    </div>

    <!-- Create form modal -->
    <div
      v-if="showCreateForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Create Web Page</h2>
        <p v-if="createError" class="mb-3 text-sm text-red-600">{{ createError }}</p>
        <WebPageForm @submit="handleCreate" @cancel="showCreateForm = false" />
      </div>
    </div>

    <!-- Loading state (Req 7.5) -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Empty state (Req 7.6) -->
    <div
      v-else-if="pages.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <svg class="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-gray-500 text-sm">No web pages found.</p>
      <p v-if="canCreate" class="mt-1 text-xs text-gray-400">
        Click "Create Web Page" to add one.
      </p>
    </div>

    <!-- Pages grid (Req 7.4, 7.11 — filtered by view permission via composable) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <WebPageCard
        v-for="page in pages"
        :key="page.id"
        :page="page"
        @view="handleView"
      />
    </div>
  </div>
</template>
