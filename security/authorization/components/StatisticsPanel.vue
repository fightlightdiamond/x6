<script setup lang="ts">
/**
 * StatisticsPanel
 *
 * Displays text-based statistics for all accessible resource types:
 * - Total item count per resource type
 * - Breakdown by scope type (private / shared) for scoped resources
 * - Breakdown by ownership (owned by me / others) for scoped resources
 *
 * No external chart library is required — statistics are rendered as
 * simple progress bars and text metrics using Tailwind CSS.
 *
 * @module components/StatisticsPanel
 */

import { computed } from 'vue';
import type { Trend } from '../modules/trends/types';
import type { XYPlot } from '../modules/xy-plots/types';

const props = defineProps<{
  /** Total count of web pages. */
  webCount: number;
  /** Total count of trends. */
  trendsCount: number;
  /** Total count of mimics. */
  mimicsCount: number;
  /** Total count of reports. */
  reportsCount: number;
  /** Total count of XY plots. */
  xyPlotsCount: number;
  /** Recent trends (used for type/owner breakdown). */
  recentTrends: Trend[];
  /** Recent XY plots (used for type/owner breakdown). */
  recentXYPlots: XYPlot[];
  /** Current user id (for ownership breakdown). */
  currentUserId?: string | number;
}>();

// ── Total items ────────────────────────────────────────────────────────────

const totalItems = computed(
  () =>
    props.webCount +
    props.trendsCount +
    props.mimicsCount +
    props.reportsCount +
    props.xyPlotsCount,
);

// ── Per-resource stats ─────────────────────────────────────────────────────

interface ResourceStat {
  label: string;
  count: number;
  color: string;
}

const resourceStats = computed<ResourceStat[]>(() => [
  { label: 'Web Pages', count: props.webCount, color: 'bg-blue-500' },
  { label: 'Trends', count: props.trendsCount, color: 'bg-green-500' },
  { label: 'Mimics', count: props.mimicsCount, color: 'bg-purple-500' },
  { label: 'Reports', count: props.reportsCount, color: 'bg-orange-500' },
  { label: 'XY Plots', count: props.xyPlotsCount, color: 'bg-teal-500' },
]);

/** Percentage of total for a given count (0–100). */
function pct(count: number): number {
  if (totalItems.value === 0) return 0;
  return Math.round((count / totalItems.value) * 100);
}

// ── Scoped resource breakdowns ─────────────────────────────────────────────

const trendsPrivate = computed(
  () => props.recentTrends.filter((t) => t.type === 'private').length,
);
const trendsShared = computed(
  () => props.recentTrends.filter((t) => t.type === 'shared').length,
);
const trendsOwned = computed(
  () =>
    props.currentUserId !== undefined
      ? props.recentTrends.filter((t) => String(t.user_id) === String(props.currentUserId)).length
      : 0,
);

const xyPlotsPrivate = computed(
  () => props.recentXYPlots.filter((p) => p.type === 'private').length,
);
const xyPlotsShared = computed(
  () => props.recentXYPlots.filter((p) => p.type === 'shared').length,
);
const xyPlotsOwned = computed(
  () =>
    props.currentUserId !== undefined
      ? props.recentXYPlots.filter((p) => String(p.user_id) === String(props.currentUserId)).length
      : 0,
);
</script>

<template>
  <section aria-labelledby="statistics-heading">
    <h2
      id="statistics-heading"
      class="text-base font-semibold text-gray-900 mb-3"
    >
      Statistics
    </h2>

    <!-- Total items summary -->
    <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm mb-4">
      <p class="text-sm text-gray-500 mb-1">Total Items</p>
      <p class="text-4xl font-bold text-gray-900 tabular-nums">{{ totalItems }}</p>
    </div>

    <!-- Per-resource breakdown with progress bars -->
    <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm mb-4">
      <p class="text-sm font-medium text-gray-700 mb-3">By Resource Type</p>

      <ul class="space-y-3" aria-label="Items by resource type">
        <li
          v-for="stat in resourceStats"
          :key="stat.label"
          class="space-y-1"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">{{ stat.label }}</span>
            <span class="font-medium text-gray-900 tabular-nums">
              {{ stat.count }}
              <span class="text-gray-400 font-normal">({{ pct(stat.count) }}%)</span>
            </span>
          </div>
          <!-- Progress bar -->
          <div
            class="h-1.5 w-full rounded-full bg-gray-100"
            role="progressbar"
            :aria-valuenow="pct(stat.count)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${stat.label}: ${pct(stat.count)}%`"
          >
            <div
              :class="['h-1.5 rounded-full transition-all duration-300', stat.color]"
              :style="{ width: `${pct(stat.count)}%` }"
            />
          </div>
        </li>
      </ul>
    </div>

    <!-- Scoped resource breakdowns (Trends) -->
    <div
      v-if="trendsCount > 0"
      class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm mb-4"
    >
      <p class="text-sm font-medium text-gray-700 mb-3">Trends Breakdown (recent)</p>

      <dl class="grid grid-cols-3 gap-3 text-center">
        <div class="rounded-md bg-green-50 p-2">
          <dt class="text-xs text-gray-500">Private</dt>
          <dd class="text-xl font-bold text-green-700 tabular-nums">{{ trendsPrivate }}</dd>
        </div>
        <div class="rounded-md bg-green-50 p-2">
          <dt class="text-xs text-gray-500">Shared</dt>
          <dd class="text-xl font-bold text-green-700 tabular-nums">{{ trendsShared }}</dd>
        </div>
        <div
          v-if="currentUserId !== undefined"
          class="rounded-md bg-green-50 p-2"
        >
          <dt class="text-xs text-gray-500">Owned by me</dt>
          <dd class="text-xl font-bold text-green-700 tabular-nums">{{ trendsOwned }}</dd>
        </div>
      </dl>
    </div>

    <!-- Scoped resource breakdowns (XY Plots) -->
    <div
      v-if="xyPlotsCount > 0"
      class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <p class="text-sm font-medium text-gray-700 mb-3">XY Plots Breakdown (recent)</p>

      <dl class="grid grid-cols-3 gap-3 text-center">
        <div class="rounded-md bg-teal-50 p-2">
          <dt class="text-xs text-gray-500">Private</dt>
          <dd class="text-xl font-bold text-teal-700 tabular-nums">{{ xyPlotsPrivate }}</dd>
        </div>
        <div class="rounded-md bg-teal-50 p-2">
          <dt class="text-xs text-gray-500">Shared</dt>
          <dd class="text-xl font-bold text-teal-700 tabular-nums">{{ xyPlotsShared }}</dd>
        </div>
        <div
          v-if="currentUserId !== undefined"
          class="rounded-md bg-teal-50 p-2"
        >
          <dt class="text-xs text-gray-500">Owned by me</dt>
          <dd class="text-xl font-bold text-teal-700 tabular-nums">{{ xyPlotsOwned }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
