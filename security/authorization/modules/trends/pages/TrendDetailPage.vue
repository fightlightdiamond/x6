<script setup lang="ts">
/**
 * TrendDetailPage
 *
 * Displays the full details of a single trend.
 * - Accepts `trendId` as a prop or falls back to the route param
 * - Shows Edit button only when `canEditTrend(trend)` is true (Req 8.14)
 * - Shows Delete button only when `canDeleteTrend(trend)` is true (Req 8.15)
 * - Shows ownership badge (Owner/Other) (Req 8.16)
 * - Shows type badge (Private/Shared) (Req 8.17)
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useTrends } from '../composable';
import { useAuthorizationStore } from '../../../stores/authorizationStore';
import TrendForm from '../components/TrendForm.vue';
import type { Trend } from '../types';

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
  /** Explicit trend id. Falls back to route param when omitted. */
  trendId?: string;
}>();

const emit = defineEmits<{
  back: [];
  deleted: [id: string];
}>();

// ── Composable ─────────────────────────────────────────────────────────────
const { canEditTrend, canDeleteTrend, loading, error, update, delete: deleteTrend } = useTrends();
const authStore = useAuthorizationStore();

// ── Route param fallback ───────────────────────────────────────────────────
let routeParam: string | undefined;
try {
  const { useRoute } = await import('vue-router');
  const route = useRoute();
  routeParam = route.params['id'] as string | undefined;
} catch {
  // useRoute() may throw outside a router context (e.g. in unit tests)
}

const resolvedId = computed<string | undefined>(() => props.trendId ?? routeParam);

/** The current user's id, used to determine ownership badges. */
const currentUserId = computed<string>(() => String(authStore.currentUser?.id ?? 'guest'));

// ── Local state ────────────────────────────────────────────────────────────
const trend = ref<Trend | null>(null);
const fetchError = ref<string | null>(null);
const isEditing = ref(false);
const deleteConfirm = ref(false);
const actionError = ref<string | null>(null);

// ── Derived permission flags (reactive on the loaded trend) ────────────────
const canEdit = computed<boolean>(() => (trend.value ? canEditTrend(trend.value) : false));
const canDelete = computed<boolean>(() => (trend.value ? canDeleteTrend(trend.value) : false));

// ── Ownership / type helpers ───────────────────────────────────────────────
const isOwner = computed<boolean>(
  () => !!trend.value && currentUserId.value === trend.value.user_id,
);

// ── Data fetching ──────────────────────────────────────────────────────────
async function loadTrend(id: string): Promise<void> {
  fetchError.value = null;
  trend.value = null;

  const { useTrendsStore } = await import('../store');
  const store = useTrendsStore();
  const result = await store.fetchById(id);
  if (result) {
    trend.value = result;
  } else {
    fetchError.value = 'Trend not found.';
  }
}

onMounted(async () => {
  if (resolvedId.value) {
    await loadTrend(resolvedId.value);
  }
});

watch(
  () => resolvedId.value,
  async (id) => {
    if (id) await loadTrend(id);
  },
);

// ── Actions ────────────────────────────────────────────────────────────────
async function handleDelete(): Promise<void> {
  if (!resolvedId.value || !trend.value) return;

  if (!canDelete.value) {
    actionError.value = 'You do not have permission to delete this trend.';
    deleteConfirm.value = false;
    return;
  }

  actionError.value = null;
  try {
    await deleteTrend(resolvedId.value, trend.value);
    emit('deleted', resolvedId.value);
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to delete trend.';
  } finally {
    deleteConfirm.value = false;
  }
}

async function handleEditSubmit(
  data: Omit<Trend, 'id' | 'created_at' | 'updated_at'>,
): Promise<void> {
  if (!resolvedId.value || !trend.value) return;

  actionError.value = null;
  try {
    const updated = await update(resolvedId.value, data, trend.value);
    if (updated) {
      trend.value = updated;
    }
    isEditing.value = false;
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to update trend.';
  }
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <!-- Back button -->
    <button
      class="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      @click="emit('back')"
    >
      ← Back
    </button>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>

    <!-- Fetch error -->
    <div
      v-else-if="fetchError || error"
      class="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700"
    >
      {{ fetchError ?? error }}
    </div>

    <!-- Trend detail -->
    <div v-else-if="trend" class="bg-white rounded-lg border border-gray-200 shadow-sm">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl font-bold text-gray-900">{{ trend.name }}</h1>

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

        <!-- Action buttons — shown only when user has permission (Req 8.14, 8.15) -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            v-if="canEdit"
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="isEditing = true"
          >
            Edit
          </button>
          <button
            v-if="canDelete"
            class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            @click="deleteConfirm = true"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Description -->
      <div class="px-6 py-4">
        <p class="text-sm text-gray-700 whitespace-pre-wrap">
          {{ trend.description || 'No description provided.' }}
        </p>
      </div>

      <!-- Metadata -->
      <div class="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-6 text-xs text-gray-400">
        <span>Owner ID: {{ trend.user_id }}</span>
        <span>Created: {{ new Date(trend.created_at).toLocaleString() }}</span>
        <span>Updated: {{ new Date(trend.updated_at).toLocaleString() }}</span>
      </div>
    </div>

    <!-- No trend loaded yet -->
    <div v-else class="text-center py-16 text-gray-400 text-sm">
      No trend selected.
    </div>

    <!-- Action error -->
    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <!-- Delete confirmation dialog -->
    <div
      v-if="deleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-2">Delete Trend</h2>
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{{ trend?.name }}</strong>? This action cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <button
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="deleteConfirm = false"
          >
            Cancel
          </button>
          <button
            class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            @click="handleDelete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Edit modal (Req 8.14) -->
    <div
      v-if="isEditing && trend"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Edit Trend</h2>
        <p v-if="actionError" class="mb-3 text-sm text-red-600">{{ actionError }}</p>
        <TrendForm
          :initial-data="trend"
          :current-user-id="currentUserId"
          @submit="handleEditSubmit"
          @cancel="isEditing = false"
        />
      </div>
    </div>
  </div>
</template>
