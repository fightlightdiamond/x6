<script setup lang="ts">
/**
 * TrendsListPage
 *
 * Lists all trends visible to the current user.
 * - Trends list is filtered by per-item view permission via the `useTrends()` composable (Req 8.13)
 * - "Create Trend" button is only shown when `canCreate` is true (Req 8.9, 8.10, 8.11, 8.12)
 * - Shows ownership badge (Owner/Other) and type badge (Private/Shared) on each card (Req 8.16, 8.17)
 * - Shows loading/empty states
 */
import { ref, onMounted } from 'vue';
import { useTrends } from '../composable';
import { useAuthorizationStore } from '../../../stores/authorizationStore';
import TrendCard from '../components/TrendCard.vue';
import TrendForm from '../components/TrendForm.vue';
import type { Trend } from '../types';

const {
  trends,
  loading,
  error,
  canCreate,
  canEditTrend,
  canDeleteTrend,
  fetchAll,
  create,
  delete: deleteTrend,
} = useTrends();

const authStore = useAuthorizationStore();

/** The current user's id, used to determine ownership badges. */
const currentUserId = $computed<string>(() => String(authStore.currentUser?.id ?? 'guest'));

const showCreateForm = ref(false);
const createError = ref<string | null>(null);

const emit = defineEmits<{
  viewTrend: [id: string];
  editTrend: [id: string];
}>();

onMounted(async () => {
  await fetchAll();
});

async function handleCreate(data: Omit<Trend, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  createError.value = null;
  try {
    await create(data);
    showCreateForm.value = false;
  } catch (err) {
    createError.value = err instanceof Error ? err.message : 'Failed to create trend';
  }
}

async function handleDelete(id: string): Promise<void> {
  const trend = trends.value.find((t) => t.id === id);
  if (!trend) return;
  try {
    await deleteTrend(id, trend);
  } catch {
    // Silently ignore — permission errors are already guarded by canDeleteTrend
  }
}

function handleView(id: string): void {
  emit('viewTrend', id);
}

function handleEdit(id: string): void {
  emit('editTrend', id);
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Trends</h1>
      <!-- Create button: only shown when user has create permission (Req 8.9–8.12) -->
      <button
        v-if="canCreate"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        @click="showCreateForm = true"
      >
        + Create Trend
      </button>
    </div>

    <!-- Create form modal -->
    <div
      v-if="showCreateForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Create Trend</h2>
        <p v-if="createError" class="mb-3 text-sm text-red-600">{{ createError }}</p>
        <TrendForm
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
      v-else-if="trends.length === 0"
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
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
        />
      </svg>
      <p class="text-gray-500 text-sm">No trends found.</p>
      <p v-if="canCreate" class="mt-1 text-xs text-gray-400">
        Click "Create Trend" to add one.
      </p>
    </div>

    <!-- Trends grid (Req 8.13 — filtered by view permission via composable) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <TrendCard
        v-for="trend in trends"
        :key="trend.id"
        :trend="trend"
        :current-user-id="currentUserId"
        :can-edit="canEditTrend(trend)"
        :can-delete="canDeleteTrend(trend)"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>
