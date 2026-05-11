<script setup lang="ts">
/**
 * QuickActionsPanel
 *
 * Displays "Create" and "View All" quick-action buttons for each resource type.
 * Actions are filtered by the current user's permissions — a button is only
 * rendered when the user has the corresponding permission.
 *
 * Uses `usePermission` for reactive, per-action permission checks.
 *
 * @module components/QuickActionsPanel
 */

import { usePermission } from '../composables/usePermission';
import { useRouter } from 'vue-router';

// ── Router ─────────────────────────────────────────────────────────────────

const router = useRouter();

// ── Permission checks ──────────────────────────────────────────────────────

const canViewWeb = usePermission('view', 'web');
const canCreateWeb = usePermission('create', 'web');

const canViewTrends = usePermission('view', 'trends');
const canCreateTrends = usePermission('create', 'trends');

const canViewMimics = usePermission('view', 'mimics');
const canCreateMimics = usePermission('create', 'mimics');

const canViewReports = usePermission('view', 'reports');
const canCreateReports = usePermission('create', 'reports');

const canViewXYPlots = usePermission('view', 'xy_plots');
const canCreateXYPlots = usePermission('create', 'xy_plots');

// ── Resource definitions ───────────────────────────────────────────────────

interface ResourceAction {
  label: string;
  viewPath: string;
  canView: ReturnType<typeof usePermission>;
  canCreate: ReturnType<typeof usePermission>;
}

const resources: ResourceAction[] = [
  {
    label: 'Web Pages',
    viewPath: '/web',
    canView: canViewWeb,
    canCreate: canCreateWeb,
  },
  {
    label: 'Trends',
    viewPath: '/trends',
    canView: canViewTrends,
    canCreate: canCreateTrends,
  },
  {
    label: 'Mimics',
    viewPath: '/mimics',
    canView: canViewMimics,
    canCreate: canCreateMimics,
  },
  {
    label: 'Reports',
    viewPath: '/reports',
    canView: canViewReports,
    canCreate: canCreateReports,
  },
  {
    label: 'XY Plots',
    viewPath: '/xy-plots',
    canView: canViewXYPlots,
    canCreate: canCreateXYPlots,
  },
];

// ── Navigation ─────────────────────────────────────────────────────────────

function navigateTo(path: string): void {
  router.push(path);
}
</script>

<template>
  <section aria-labelledby="quick-actions-heading">
    <h2
      id="quick-actions-heading"
      class="text-base font-semibold text-gray-900 mb-3"
    >
      Quick Actions
    </h2>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <template v-for="resource in resources" :key="resource.label">
        <!-- Only render the card if the user can view OR create this resource -->
        <div
          v-if="resource.canView.value || resource.canCreate.value"
          class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
        >
          <p class="text-sm font-medium text-gray-700 mb-2">{{ resource.label }}</p>

          <div class="flex gap-2">
            <!-- View All button -->
            <button
              v-if="resource.canView.value"
              class="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              type="button"
              @click="navigateTo(resource.viewPath)"
            >
              View All
            </button>

            <!-- Create button -->
            <button
              v-if="resource.canCreate.value"
              class="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              type="button"
              @click="navigateTo(`${resource.viewPath}?action=create`)"
            >
              + Create
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Empty state when user has no permissions at all -->
    <p
      v-if="resources.every((r) => !r.canView.value && !r.canCreate.value)"
      class="text-sm text-gray-400 italic"
    >
      No actions available for your current role.
    </p>
  </section>
</template>
