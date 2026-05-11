<script setup lang="ts">
/**
 * XYPlotsListPage
 *
 * Lists all XY plots visible to the current user.
 * - XY plots list is filtered by per-item view permission via the `useXYPlots()` composable (Req 11.13)
 * - "Create XY Plot" button is only shown when `canCreate` is true (Req 11.9, 11.10, 11.11, 11.12)
 * - Shows ownership badge (Owner/Other) and type badge (Private/Shared) on each card (Req 11.16, 11.17)
 * - Shows loading/empty states
 */
import { ref, onMounted } from 'vue';
import { useXYPlots } from '../composable';
import { useAuthorizationStore } from '../../../stores/authorizationStore';
import XYPlotCard from '../components/XYPlotCard.vue';
import XYPlotForm from '../components/XYPlotForm.vue';
import type { XYPlot } from '../types';

const {
  xyPlots,
  loading,
  error,
  canCreate,
  canEditPlot,
  canDeletePlot,
  fetchAll,
  create,
  delete: deletePlot,
} = useXYPlots();

const authStore = useAuthorizationStore();

/** The current user's id, used to determine ownership badges. */
const currentUserId = $computed<string>(() => String(authStore.currentUser?.id ?? 'guest'));

const showCreateForm = ref(false);
const createError = ref<string | null>(null);

const emit = defineEmits<{
  viewPlot: [id: string];
  editPlot: [id: string];
}>();

onMounted(async () => {
  await fetchAll();
});

async function handleCreate(data: Omit<XYPlot, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  createError.value = null;
  try {
    await create(data);
    showCreateForm.value = false;
  } catch (err) {
    createError.value = err instanceof Error ? err.message : 'Failed to create XY plot';
  }
}

async function handleDelete(id: string): Promise<void> {
  const plot = xyPlots.value.find((p) => p.id === id);
  if (!plot) return;
  try {
    await deletePlot(id, plot);
  } catch {
    // Silently ignore — permission errors are already guarded by canDeletePlot
  }
}

function handleView(id: string): void {
  emit('viewPlot', id);
}

function handleEdit(id: string): void {
  emit('editPlot', id);
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">XY Plots</h1>
      <!-- Create button: only shown when user has create permission (Req 11.9–11.12) -->
      <button
        v-if="canCreate"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        @click="showCreateForm = true"
      >
        + Create XY Plot
      </button>
    </div>

    <!-- Create form modal -->
    <div
      v-if="showCreateForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Create XY Plot</h2>
        <p v-if="createError" class="mb-3 text-sm text-red-600">{{ createError }}</p>
        <XYPlotForm
          :current-user-id="currentUserId"
          @submit="handleCreate"
          @cancel="showCreateForm = false"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <!-- Empty state -->
    <div
      v-else-if="xyPlots.length === 0"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <svg
        class="h-12 w-12 text-gray-300 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p class="text-gray-500 text-sm">No XY plots found.</p>
      <p v-if="canCreate" class="mt-1 text-xs text-gray-400">
        Click "Create XY Plot" to add one.
      </p>
    </div>

    <!-- XY Plots grid (Req 11.13 — filtered by view permission via composable) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <XYPlotCard
        v-for="plot in xyPlots"
        :key="plot.id"
        :plot="plot"
        :current-user-id="currentUserId"
        :can-edit="canEditPlot(plot)"
        :can-delete="canDeletePlot(plot)"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>
