<script setup lang="ts">
/**
 * MimicsListPage
 *
 * Lists all mimics visible to the current user.
 * - "Create Mimic" button is only shown when `canCreate` is true (Req 9.11, 9.12)
 * - When `canView` is false (browse role), shows "Access Denied" message instead of
 *   an empty list (Req 9.10)
 * - Shows loading state while fetching
 */
import { ref, onMounted } from 'vue';
import { useMimics } from '../composable';
import MimicCard from '../components/MimicCard.vue';
import MimicForm from '../components/MimicForm.vue';
import type { Mimic } from '../types';

const { mimics, loading, error, canView, canCreate, canEdit, canDelete, fetchAll, create, delete: deleteMimic } = useMimics();

const showCreateForm = ref(false);
const createError = ref<string | null>(null);
const deleteConfirmId = ref<string | null>(null);
const actionError = ref<string | null>(null);

const emit = defineEmits<{
  viewMimic: [id: string];
}>();

onMounted(async () => {
  // Only fetch if user has view permission; browse role has no access
  if (canView.value) {
    await fetchAll();
  }
});

async function handleCreate(data: Omit<Mimic, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  createError.value = null;
  try {
    await create(data);
    showCreateForm.value = false;
  } catch (err) {
    createError.value = err instanceof Error ? err.message : 'Failed to create mimic';
  }
}

function handleView(id: string): void {
  emit('viewMimic', id);
}

async function handleDelete(id: string): Promise<void> {
  actionError.value = null;
  try {
    await deleteMimic(id);
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to delete mimic';
  } finally {
    deleteConfirmId.value = null;
  }
}

const mimicToDelete = (id: string) => mimics.value.find((m) => m.id === id);
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Mimics</h1>
      <!-- Create button: only shown when user has create permission (Req 9.11, 9.12) -->
      <button
        v-if="canCreate"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        @click="showCreateForm = true"
      >
        + Create Mimic
      </button>
    </div>

    <!-- Create form modal -->
    <div
      v-if="showCreateForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Create Mimic</h2>
        <p v-if="createError" class="mb-3 text-sm text-red-600">{{ createError }}</p>
        <MimicForm @submit="handleCreate" @cancel="showCreateForm = false" />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <!-- Access Denied: browse role has no view permission (Req 9.10) -->
    <div
      v-else-if="!canView"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <svg class="h-12 w-12 text-red-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <p class="text-gray-700 font-medium">Access Denied</p>
      <p class="mt-1 text-sm text-gray-500">You do not have permission to view mimics.</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="mimics.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <svg class="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
      <p class="text-gray-500 text-sm">No mimics found.</p>
      <p v-if="canCreate" class="mt-1 text-xs text-gray-400">
        Click "Create Mimic" to add one.
      </p>
    </div>

    <!-- Mimics grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <MimicCard
        v-for="mimic in mimics"
        :key="mimic.id"
        :mimic="mimic"
        :can-edit="canEdit"
        :can-delete="canDelete"
        @view="handleView"
        @edit="handleView"
        @delete="deleteConfirmId = mimic.id"
      />
    </div>

    <!-- Action error -->
    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <!-- Delete confirmation dialog -->
    <div
      v-if="deleteConfirmId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-2">Delete Mimic</h2>
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to delete
          <strong>{{ mimicToDelete(deleteConfirmId)?.name }}</strong>?
          This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <button
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="deleteConfirmId = null"
          >
            Cancel
          </button>
          <button
            class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            @click="handleDelete(deleteConfirmId)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
