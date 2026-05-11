<script setup lang="ts">
/**
 * ReportsListPage
 *
 * Lists all reports visible to the current user.
 * - "Create Report" button is only shown when `canCreate` is true (Req 10.11, 10.12)
 * - When `canView` is false (browse role), shows "Access Denied" message instead of
 *   an empty list (Req 10.10)
 * - Shows loading state while fetching
 */
import { ref, onMounted } from 'vue';
import { useReports } from '../composable';
import ReportCard from '../components/ReportCard.vue';
import ReportForm from '../components/ReportForm.vue';
import type { Report } from '../types';

const {
  reports,
  loading,
  error,
  canView,
  canCreate,
  canEdit,
  canDelete,
  fetchAll,
  create,
  delete: deleteReport,
} = useReports();

const showCreateForm = ref(false);
const createError = ref<string | null>(null);
const deleteConfirmId = ref<string | null>(null);
const actionError = ref<string | null>(null);

const emit = defineEmits<{
  viewReport: [id: string];
}>();

onMounted(async () => {
  // Only fetch if user has view permission; browse role has no access (Req 10.10)
  if (canView.value) {
    await fetchAll();
  }
});

async function handleCreate(
  data: Omit<Report, 'id' | 'created_at' | 'updated_at'>,
): Promise<void> {
  createError.value = null;
  try {
    await create(data);
    showCreateForm.value = false;
  } catch (err) {
    createError.value = err instanceof Error ? err.message : 'Failed to create report';
  }
}

function handleView(id: string): void {
  emit('viewReport', id);
}

async function handleDelete(id: string): Promise<void> {
  actionError.value = null;
  try {
    await deleteReport(id);
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Failed to delete report';
  } finally {
    deleteConfirmId.value = null;
  }
}

const reportToDelete = (id: string) => reports.value.find((r) => r.id === id);
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
      <!-- Create button: only shown when user has create permission (Req 10.11, 10.12) -->
      <button
        v-if="canCreate"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        @click="showCreateForm = true"
      >
        + Create Report
      </button>
    </div>

    <!-- Create form modal -->
    <div
      v-if="showCreateForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Create Report</h2>
        <p v-if="createError" class="mb-3 text-sm text-red-600">{{ createError }}</p>
        <ReportForm @submit="handleCreate" @cancel="showCreateForm = false" />
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

    <!-- Access Denied: browse role has no view permission (Req 10.10) -->
    <div
      v-else-if="!canView"
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <svg
        class="h-12 w-12 text-red-300 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
      <p class="text-gray-700 font-medium">Access Denied</p>
      <p class="mt-1 text-sm text-gray-500">You do not have permission to view reports.</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="reports.length === 0"
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p class="text-gray-500 text-sm">No reports found.</p>
      <p v-if="canCreate" class="mt-1 text-xs text-gray-400">
        Click "Create Report" to add one.
      </p>
    </div>

    <!-- Reports grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ReportCard
        v-for="report in reports"
        :key="report.id"
        :report="report"
        :can-edit="canEdit"
        :can-delete="canDelete"
        @view="handleView"
        @edit="handleView"
        @delete="deleteConfirmId = report.id"
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
        <h2 class="text-base font-semibold text-gray-900 mb-2">Delete Report</h2>
        <p class="text-sm text-gray-600 mb-4">
          Are you sure you want to delete
          <strong>{{ reportToDelete(deleteConfirmId)?.title }}</strong>?
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
