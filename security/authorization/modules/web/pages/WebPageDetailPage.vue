<script setup lang="ts">
/**
 * WebPageDetailPage
 *
 * Displays the full details of a single web page.
 * - Accepts `pageId` as a prop or falls back to the route param (Req 7.7)
 * - Shows Edit / Delete buttons only when the user has the corresponding permission (Req 7.12)
 * - Checks permission before executing delete (Req 7.12)
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useWeb } from '../composable';
import type { WebPage } from '../types';

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
  /** Explicit page id. Falls back to route param when omitted. */
  pageId?: string;
}>();

const emit = defineEmits<{
  back: [];
  deleted: [id: string];
}>();

// ── Composable ─────────────────────────────────────────────────────────────
const { canEdit, canDelete, loading, error, delete: deletePage } = useWeb();

// ── Route param fallback ───────────────────────────────────────────────────
let routeParam: string | undefined;
try {
  const route = useRoute();
  routeParam = route.params['id'] as string | undefined;
} catch {
  // useRoute() may throw outside a router context (e.g. in unit tests)
}

const resolvedId = computed<string | undefined>(() => props.pageId ?? routeParam);

// ── Local state ────────────────────────────────────────────────────────────
const page = ref<WebPage | null>(null);
const fetchError = ref<string | null>(null);
const isEditing = ref(false);
const deleteConfirm = ref(false);
const actionError = ref<string | null>(null);

// ── Data fetching ──────────────────────────────────────────────────────────
async function loadPage(id: string): Promise<void> {
  fetchError.value = null;
  page.value = null;

  // Import store directly to call fetchById (composable exposes fetchAll only)
  const { useWebStore } = await import('../store');
  const store = useWebStore();
  const result = await store.fetchById(id);
  if (result) {
    page.value = result;
  } else {
    fetchError.value = 'Page not found.';
  }
}

onMounted(async () => {
  if (resolvedId.value) {
    await loadPage(resolvedId.value);
  }
});

watch(
  () => resolvedId.value,
  async (id) => {
    if (id) await loadPage(id);
  },
);

// ── Actions ────────────────────────────────────────────────────────────────
async function handleDelete(): Promise<void> {
  if (!resolvedId.value) return;

  // Permission check before executing (Req 7.12)
  if (!canDelete.value) {
    actionError.value = 'You do not have permission to delete this page.';
    deleteConfirm.value = false;
    return;
  }

  actionError.value = null;
  try {
    await deletePage(resolvedId.value);
    emit('deleted', resolvedId.value);
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to delete page.';
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

    <!-- Page detail -->
    <div v-else-if="page" class="bg-white rounded-lg border border-gray-200 shadow-sm">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-gray-900">{{ page.title }}</h1>
          <a
            :href="page.url"
            class="mt-1 text-sm text-blue-600 hover:underline break-all"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ page.url }}
          </a>
        </div>

        <!-- Action buttons — shown only when user has permission (Req 7.12) -->
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

      <!-- Content -->
      <div class="px-6 py-4">
        <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ page.content }}</p>
      </div>

      <!-- Metadata -->
      <div class="px-6 py-3 border-t border-gray-100 flex gap-6 text-xs text-gray-400">
        <span>Created: {{ new Date(page.created_at).toLocaleString() }}</span>
        <span>Updated: {{ new Date(page.updated_at).toLocaleString() }}</span>
      </div>
    </div>

    <!-- No page loaded yet (no id provided) -->
    <div v-else class="text-center py-16 text-gray-400 text-sm">
      No page selected.
    </div>

    <!-- Action error -->
    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <!-- Delete confirmation dialog -->
    <div
      v-if="deleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-2">Delete Web Page</h2>
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{{ page?.title }}</strong>? This action cannot be undone.
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

    <!-- Edit placeholder (Req 7.12 — edit permission check) -->
    <div
      v-if="isEditing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Edit Web Page</h2>
        <p class="text-sm text-gray-500 mb-4">
          Edit functionality can be wired to <code>WebPageForm</code> with pre-filled values.
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
