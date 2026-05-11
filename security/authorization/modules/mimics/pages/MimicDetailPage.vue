<script setup lang="ts">
/**
 * MimicDetailPage
 *
 * Displays the full details of a single mimic.
 * - Accepts `mimicId` as a prop or falls back to the route param
 * - Shows Edit button only when `canEdit` is true (Req 9.13)
 * - Shows Delete button only when `canDelete` is true (Req 9.14)
 * - Checks permission before executing delete
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMimics } from '../composable';
import type { Mimic } from '../types';

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
  /** Explicit mimic id. Falls back to route param when omitted. */
  mimicId?: string;
}>();

const emit = defineEmits<{
  back: [];
  deleted: [id: string];
}>();

// ── Composable ─────────────────────────────────────────────────────────────
const { canEdit, canDelete, loading, error, delete: deleteMimic } = useMimics();

// ── Route param fallback ───────────────────────────────────────────────────
let routeParam: string | undefined;
try {
  const route = useRoute();
  routeParam = route.params['id'] as string | undefined;
} catch {
  // useRoute() may throw outside a router context (e.g. in unit tests)
}

const resolvedId = computed<string | undefined>(() => props.mimicId ?? routeParam);

// ── Local state ────────────────────────────────────────────────────────────
const mimic = ref<Mimic | null>(null);
const fetchError = ref<string | null>(null);
const isEditing = ref(false);
const deleteConfirm = ref(false);
const actionError = ref<string | null>(null);

// ── Data fetching ──────────────────────────────────────────────────────────
async function loadMimic(id: string): Promise<void> {
  fetchError.value = null;
  mimic.value = null;

  const { useMimicsStore } = await import('../store');
  const store = useMimicsStore();
  const result = await store.fetchById(id);
  if (result) {
    mimic.value = result;
  } else {
    fetchError.value = 'Mimic not found.';
  }
}

onMounted(async () => {
  if (resolvedId.value) {
    await loadMimic(resolvedId.value);
  }
});

watch(
  () => resolvedId.value,
  async (id) => {
    if (id) await loadMimic(id);
  },
);

// ── Actions ────────────────────────────────────────────────────────────────
async function handleDelete(): Promise<void> {
  if (!resolvedId.value) return;

  // Permission check before executing (Req 9.14)
  if (!canDelete.value) {
    actionError.value = 'You do not have permission to delete this mimic.';
    deleteConfirm.value = false;
    return;
  }

  actionError.value = null;
  try {
    await deleteMimic(resolvedId.value);
    emit('deleted', resolvedId.value);
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to delete mimic.';
  } finally {
    deleteConfirm.value = false;
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

    <!-- Mimic detail -->
    <div v-else-if="mimic" class="bg-white rounded-lg border border-gray-200 shadow-sm">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-gray-900">{{ mimic.name }}</h1>
          <p class="mt-1 text-sm text-gray-500">{{ mimic.description }}</p>
        </div>

        <!-- Action buttons — shown only when user has permission (Req 9.13, 9.14) -->
        <div class="flex items-center gap-2 shrink-0">
          <!-- Edit button: only shown when canEdit is true (Req 9.13) -->
          <button
            v-if="canEdit"
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="isEditing = true"
          >
            Edit
          </button>
          <!-- Delete button: only shown when canDelete is true (Req 9.14) -->
          <button
            v-if="canDelete"
            class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            @click="deleteConfirm = true"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Metadata -->
      <div class="px-6 py-3 border-t border-gray-100 flex gap-6 text-xs text-gray-400">
        <span>Created: {{ new Date(mimic.created_at).toLocaleString() }}</span>
        <span>Updated: {{ new Date(mimic.updated_at).toLocaleString() }}</span>
      </div>
    </div>

    <!-- No mimic loaded yet (no id provided) -->
    <div v-else class="text-center py-16 text-gray-400 text-sm">
      No mimic selected.
    </div>

    <!-- Action error -->
    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <!-- Delete confirmation dialog -->
    <div
      v-if="deleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-2">Delete Mimic</h2>
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{{ mimic?.name }}</strong>? This action cannot be undone.
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

    <!-- Edit placeholder (Req 9.13 — edit permission check) -->
    <div
      v-if="isEditing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Edit Mimic</h2>
        <p class="text-sm text-gray-500 mb-4">
          Edit functionality can be wired to <code>MimicForm</code> with pre-filled values.
        </p>
        <div class="flex justify-end">
          <button
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="isEditing = false"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
