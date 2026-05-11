<script setup lang="ts">
/**
 * ReportDetailPage
 *
 * Displays the full details of a single report.
 * - Accepts `reportId` as a prop or falls back to the route param
 * - Shows Edit button only when `canEdit` is true (Req 10.13)
 * - Shows Delete button only when `canDelete` is true (Req 10.14)
 * - Checks permission before executing delete
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useReports } from '../composable';
import type { Report } from '../types';

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
  /** Explicit report id. Falls back to route param when omitted. */
  reportId?: string;
}>();

const emit = defineEmits<{
  back: [];
  deleted: [id: string];
}>();

// ── Composable ─────────────────────────────────────────────────────────────
const { canEdit, canDelete, loading, error, delete: deleteReport } = useReports();

// ── Route param fallback ───────────────────────────────────────────────────
let routeParam: string | undefined;
try {
  const route = useRoute();
  routeParam = route.params['id'] as string | undefined;
} catch {
  // useRoute() may throw outside a router context (e.g. in unit tests)
}

const resolvedId = computed<string | undefined>(() => props.reportId ?? routeParam);

// ── Local state ────────────────────────────────────────────────────────────
const report = ref<Report | null>(null);
const fetchError = ref<string | null>(null);
const isEditing = ref(false);
const deleteConfirm = ref(false);
const actionError = ref<string | null>(null);

const formatBadgeClass: Record<Report['format'], string> = {
  pdf: 'bg-red-100 text-red-700',
  excel: 'bg-green-100 text-green-700',
  csv: 'bg-blue-100 text-blue-700',
};

// ── Data fetching ──────────────────────────────────────────────────────────
async function loadReport(id: string): Promise<void> {
  fetchError.value = null;
  report.value = null;

  const { useReportsStore } = await import('../store');
  const store = useReportsStore();
  const result = await store.fetchById(id);
  if (result) {
    report.value = result;
  } else {
    fetchError.value = 'Report not found.';
  }
}

onMounted(async () => {
  if (resolvedId.value) {
    await loadReport(resolvedId.value);
  }
});

watch(
  () => resolvedId.value,
  async (id) => {
    if (id) await loadReport(id);
  },
);

// ── Actions ────────────────────────────────────────────────────────────────
async function handleDelete(): Promise<void> {
  if (!resolvedId.value) return;

  // Permission check before executing (Req 10.14)
  if (!canDelete.value) {
    actionError.value = 'You do not have permission to delete this report.';
    deleteConfirm.value = false;
    return;
  }

  actionError.value = null;
  try {
    await deleteReport(resolvedId.value);
    emit('deleted', resolvedId.value);
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to delete report.';
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

    <!-- Report detail -->
    <div v-else-if="report" class="bg-white rounded-lg border border-gray-200 shadow-sm">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-gray-900 truncate">{{ report.title }}</h1>
            <!-- Format badge -->
            <span
              class="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase"
              :class="formatBadgeClass[report.format]"
            >
              {{ report.format }}
            </span>
          </div>
          <p class="mt-1 text-sm text-gray-500">{{ report.description }}</p>
        </div>

        <!-- Action buttons — shown only when user has permission (Req 10.13, 10.14) -->
        <div class="flex items-center gap-2 shrink-0">
          <!-- Edit button: only shown when canEdit is true (Req 10.13) -->
          <button
            v-if="canEdit"
            class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            @click="isEditing = true"
          >
            Edit
          </button>
          <!-- Delete button: only shown when canDelete is true (Req 10.14) -->
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
      <div v-if="report.content" class="px-6 py-4 border-b border-gray-100">
        <h2 class="text-sm font-medium text-gray-700 mb-2">Content</h2>
        <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ report.content }}</p>
      </div>

      <!-- Metadata -->
      <div class="px-6 py-3 flex gap-6 text-xs text-gray-400">
        <span>Created: {{ new Date(report.created_at).toLocaleString() }}</span>
        <span>Updated: {{ new Date(report.updated_at).toLocaleString() }}</span>
      </div>
    </div>

    <!-- No report loaded yet (no id provided) -->
    <div v-else class="text-center py-16 text-gray-400 text-sm">
      No report selected.
    </div>

    <!-- Action error -->
    <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>

    <!-- Delete confirmation dialog -->
    <div
      v-if="deleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-2">Delete Report</h2>
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{{ report?.title }}</strong>?
          This action cannot be undone.
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

    <!-- Edit placeholder (Req 10.13 — edit permission check) -->
    <div
      v-if="isEditing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Edit Report</h2>
        <p class="text-sm text-gray-500 mb-4">
          Edit functionality can be wired to <code>ReportForm</code> with pre-filled values.
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
