<script setup lang="ts">
/**
 * DashboardPage
 *
 * Main dashboard page providing an overview of all accessible resources.
 *
 * - Uses `useDashboard()` to fetch counts and recent items with TTL caching
 * - Shows `ResourceSummaryCard` for each resource the user can view
 * - Shows `QuickActionsPanel` for permission-filtered quick actions
 * - Shows `StatisticsPanel` with text-based metrics
 * - Responsive grid layout (1 col mobile → 2 col tablet → 3 col desktop)
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9,
 *               14.10, 14.11, 14.12, 14.13, 14.14, 14.15
 *
 * @module pages/DashboardPage
 */

import { computed } from 'vue';
import { useDashboard } from '../composables/useDashboard';
import { usePermission } from '../composables/usePermission';
import { useAuthorizationStore } from '../stores/authorizationStore';
import ResourceSummaryCard from '../components/ResourceSummaryCard.vue';
import QuickActionsPanel from '../components/QuickActionsPanel.vue';
import StatisticsPanel from '../components/StatisticsPanel.vue';

// ── Dashboard data ─────────────────────────────────────────────────────────

const {
  webCount,
  trendsCount,
  mimicsCount,
  reportsCount,
  xyPlotsCount,
  recentWeb,
  recentTrends,
  recentMimics,
  recentReports,
  recentXYPlots,
  loading,
  error,
  refresh,
} = useDashboard();

// ── Permission checks (Req 14.4 — only show accessible resources) ──────────

const canViewWeb = usePermission('view', 'web');
const canViewTrends = usePermission('view', 'trends');
const canViewMimics = usePermission('view', 'mimics');
const canViewReports = usePermission('view', 'reports');
const canViewXYPlots = usePermission('view', 'xy_plots');

// ── Current user (for StatisticsPanel ownership breakdown) ─────────────────

const authStore = useAuthorizationStore();
const currentUserId = computed(() => authStore.currentUser?.id);
const currentRole = computed(() => authStore.currentUser?.role ?? 'browse');

// ── Visible resource count (for empty state) ───────────────────────────────

const hasAnyAccess = computed(
  () =>
    canViewWeb.value ||
    canViewTrends.value ||
    canViewMimics.value ||
    canViewReports.value ||
    canViewXYPlots.value,
);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Page header -->
    <header class="bg-white border-b border-gray-200 px-4 py-5 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p class="mt-1 text-sm text-gray-500">
            Overview of all accessible resources
            <span
              v-if="currentRole"
              class="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
            >
              {{ currentRole }}
            </span>
          </p>
        </div>

        <!-- Refresh button -->
        <button
          :disabled="loading"
          class="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          type="button"
          aria-label="Refresh dashboard data"
          @click="refresh()"
        >
          <span :class="['text-base', loading ? 'animate-spin' : '']" aria-hidden="true">↻</span>
          Refresh
        </button>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

      <!-- Loading state -->
      <div
        v-if="loading && !hasAnyAccess"
        class="flex items-center justify-center py-16"
        role="status"
        aria-live="polite"
      >
        <div class="text-center">
          <div
            class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"
            aria-hidden="true"
          />
          <p class="mt-3 text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="rounded-lg border border-red-200 bg-red-50 p-4 mb-6"
        role="alert"
      >
        <p class="text-sm font-medium text-red-800">Failed to load dashboard data</p>
        <p class="mt-1 text-sm text-red-600">{{ error }}</p>
        <button
          class="mt-2 text-sm font-medium text-red-700 underline hover:no-underline"
          type="button"
          @click="refresh()"
        >
          Try again
        </button>
      </div>

      <!-- No access state -->
      <div
        v-else-if="!loading && !hasAnyAccess"
        class="rounded-lg border border-gray-200 bg-white p-8 text-center"
        role="status"
      >
        <p class="text-4xl mb-3" aria-hidden="true">🔒</p>
        <p class="text-base font-medium text-gray-700">No resources accessible</p>
        <p class="mt-1 text-sm text-gray-500">
          Your current role does not have view permission for any resources.
        </p>
      </div>

      <!-- Dashboard content -->
      <template v-else>

        <!-- Loading overlay (when refreshing with existing data) -->
        <div
          v-if="loading"
          class="mb-4 flex items-center gap-2 text-sm text-gray-500"
          role="status"
          aria-live="polite"
        >
          <div
            class="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent"
            aria-hidden="true"
          />
          Refreshing…
        </div>

        <!-- Resource Summary Cards (Req 14.2, 14.3, 14.4, 14.5) -->
        <section aria-labelledby="resources-heading" class="mb-8">
          <h2
            id="resources-heading"
            class="text-base font-semibold text-gray-900 mb-3"
          >
            Resources
          </h2>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Web Pages -->
            <ResourceSummaryCard
              v-if="canViewWeb"
              resource-type="web"
              label="Web Pages"
              :count="webCount"
              :recent-items="recentWeb"
            />

            <!-- Trends -->
            <ResourceSummaryCard
              v-if="canViewTrends"
              resource-type="trends"
              label="Trends"
              :count="trendsCount"
              :recent-items="recentTrends"
            />

            <!-- Mimics -->
            <ResourceSummaryCard
              v-if="canViewMimics"
              resource-type="mimics"
              label="Mimics"
              :count="mimicsCount"
              :recent-items="recentMimics"
            />

            <!-- Reports -->
            <ResourceSummaryCard
              v-if="canViewReports"
              resource-type="reports"
              label="Reports"
              :count="reportsCount"
              :recent-items="recentReports"
            />

            <!-- XY Plots -->
            <ResourceSummaryCard
              v-if="canViewXYPlots"
              resource-type="xy_plots"
              label="XY Plots"
              :count="xyPlotsCount"
              :recent-items="recentXYPlots"
            />
          </div>
        </section>

        <!-- Two-column layout for Quick Actions + Statistics -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <!-- Quick Actions Panel (Req 14.6, 14.7) -->
          <QuickActionsPanel />

          <!-- Statistics Panel (Req 14.8, 14.11) -->
          <StatisticsPanel
            :web-count="webCount"
            :trends-count="trendsCount"
            :mimics-count="mimicsCount"
            :reports-count="reportsCount"
            :xy-plots-count="xyPlotsCount"
            :recent-trends="recentTrends"
            :recent-x-y-plots="recentXYPlots"
            :current-user-id="currentUserId"
          />
        </div>

      </template>
    </main>
  </div>
</template>
