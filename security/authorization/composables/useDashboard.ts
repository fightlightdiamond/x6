/**
 * Composable for the Dashboard page.
 *
 * Fetches counts and recent items from all API services, caches the result
 * with a configurable TTL, and auto-refreshes whenever the current user
 * (role or id) changes.
 *
 * Only resources the current user has `view` permission for are fetched.
 *
 * @module composables/useDashboard
 */

import { ref, computed, watch } from "vue";
import type { ComputedRef, Ref } from "vue";
import { useAuthorizationStore } from "../stores/authorizationStore";
import { webApiService } from "../modules/web/api";
import { trendsApiService } from "../modules/trends/api";
import { mimicsApiService } from "../modules/mimics/api";
import { reportsApiService } from "../modules/reports/api";
import { xyPlotsApiService } from "../modules/xy-plots/api";
import type { WebPage } from "../modules/web/types";
import type { Trend } from "../modules/trends/types";
import type { Mimic } from "../modules/mimics/types";
import type { Report } from "../modules/reports/types";
import type { XYPlot } from "../modules/xy-plots/types";

/** Number of recent items to show per resource type. */
const RECENT_ITEMS_LIMIT = 5;

/** Cache TTL in milliseconds (30 seconds). */
const CACHE_TTL_MS = 30_000;

export interface DashboardData {
  /** Total count of web pages the user can view. */
  webCount: number;
  /** Total count of trends the user can view. */
  trendsCount: number;
  /** Total count of mimics the user can view. */
  mimicsCount: number;
  /** Total count of reports the user can view. */
  reportsCount: number;
  /** Total count of XY plots the user can view. */
  xyPlotsCount: number;
  /** Most recent web pages (up to RECENT_ITEMS_LIMIT). */
  recentWeb: WebPage[];
  /** Most recent trends (up to RECENT_ITEMS_LIMIT). */
  recentTrends: Trend[];
  /** Most recent mimics (up to RECENT_ITEMS_LIMIT). */
  recentMimics: Mimic[];
  /** Most recent reports (up to RECENT_ITEMS_LIMIT). */
  recentReports: Report[];
  /** Most recent XY plots (up to RECENT_ITEMS_LIMIT). */
  recentXYPlots: XYPlot[];
}

export interface UseDashboardReturn {
  /** Total count of web pages. */
  webCount: ComputedRef<number>;
  /** Total count of trends. */
  trendsCount: ComputedRef<number>;
  /** Total count of mimics. */
  mimicsCount: ComputedRef<number>;
  /** Total count of reports. */
  reportsCount: ComputedRef<number>;
  /** Total count of XY plots. */
  xyPlotsCount: ComputedRef<number>;
  /** Recent web pages. */
  recentWeb: ComputedRef<WebPage[]>;
  /** Recent trends. */
  recentTrends: ComputedRef<Trend[]>;
  /** Recent mimics. */
  recentMimics: ComputedRef<Mimic[]>;
  /** Recent reports. */
  recentReports: ComputedRef<Report[]>;
  /** Recent XY plots. */
  recentXYPlots: ComputedRef<XYPlot[]>;
  /** Whether a fetch is in progress. */
  loading: Ref<boolean>;
  /** Error message from the last failed fetch, or `null`. */
  error: Ref<string | null>;
  /** Manually trigger a data refresh (bypasses cache). */
  refresh: () => Promise<void>;
}

/**
 * Provides reactive dashboard data with TTL-based caching and auto-refresh
 * when the current user changes.
 *
 * @param ttlMs - Cache TTL in milliseconds. Defaults to 30 seconds.
 *
 * @example
 * ```ts
 * const { webCount, recentWeb, loading, refresh } = useDashboard();
 * ```
 */
export function useDashboard(ttlMs: number = CACHE_TTL_MS): UseDashboardReturn {
  const authStore = useAuthorizationStore();

  // ── State ──────────────────────────────────────────────────────────────────

  const data = ref<DashboardData>({
    webCount: 0,
    trendsCount: 0,
    mimicsCount: 0,
    reportsCount: 0,
    xyPlotsCount: 0,
    recentWeb: [],
    recentTrends: [],
    recentMimics: [],
    recentReports: [],
    recentXYPlots: [],
  });

  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  /** Timestamp of the last successful fetch (ms since epoch), or 0 if never fetched. */
  let lastFetchedAt = 0;

  // ── Fetch logic ────────────────────────────────────────────────────────────

  /**
   * Fetches all accessible resources and updates `data`.
   * Skips resources the user does not have `view` permission for.
   */
  async function fetchData(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const [webPages, trends, mimics, reports, xyPlots] =
        await Promise.allSettled([
          authStore.can("view", "web")
            ? webApiService.getAll()
            : Promise.resolve([]),
          authStore.can("view", "trends")
            ? trendsApiService.getAll()
            : Promise.resolve([]),
          authStore.can("view", "mimics")
            ? mimicsApiService.getAll()
            : Promise.resolve([]),
          authStore.can("view", "reports")
            ? reportsApiService.getAll()
            : Promise.resolve([]),
          authStore.can("view", "xy_plots")
            ? xyPlotsApiService.getAll()
            : Promise.resolve([]),
        ]);

      const resolvedWeb = webPages.status === "fulfilled" ? webPages.value : [];
      const resolvedTrends = trends.status === "fulfilled" ? trends.value : [];
      const resolvedMimics = mimics.status === "fulfilled" ? mimics.value : [];
      const resolvedReports =
        reports.status === "fulfilled" ? reports.value : [];
      const resolvedXYPlots =
        xyPlots.status === "fulfilled" ? xyPlots.value : [];

      // For scoped resources (trends, xy_plots), filter by per-item view permission
      const visibleTrends = resolvedTrends.filter((t) =>
        authStore.can("view", "trends", { type: t.type, user_id: t.user_id }),
      );
      const visibleXYPlots = resolvedXYPlots.filter((p) =>
        authStore.can("view", "xy_plots", { type: p.type, user_id: p.user_id }),
      );

      // Sort by updated_at descending to get most recent items
      const sortByDate = <T extends { updated_at: string }>(items: T[]): T[] =>
        [...items].sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );

      data.value = {
        webCount: resolvedWeb.length,
        trendsCount: visibleTrends.length,
        mimicsCount: resolvedMimics.length,
        reportsCount: resolvedReports.length,
        xyPlotsCount: visibleXYPlots.length,
        recentWeb: sortByDate(resolvedWeb).slice(0, RECENT_ITEMS_LIMIT),
        recentTrends: sortByDate(visibleTrends).slice(0, RECENT_ITEMS_LIMIT),
        recentMimics: sortByDate(resolvedMimics).slice(0, RECENT_ITEMS_LIMIT),
        recentReports: sortByDate(resolvedReports).slice(0, RECENT_ITEMS_LIMIT),
        recentXYPlots: sortByDate(visibleXYPlots).slice(0, RECENT_ITEMS_LIMIT),
      };

      lastFetchedAt = Date.now();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to load dashboard data";
    } finally {
      loading.value = false;
    }
  }

  /**
   * Public refresh function — always bypasses the cache and re-fetches.
   */
  async function refresh(): Promise<void> {
    lastFetchedAt = 0;
    await fetchData();
  }

  /**
   * Fetches data only if the cache has expired.
   */
  async function fetchIfStale(): Promise<void> {
    if (Date.now() - lastFetchedAt >= ttlMs) {
      await fetchData();
    }
  }

  // ── Auto-refresh when user changes ────────────────────────────────────────

  /**
   * Watch the current user (id + role) and refresh when it changes.
   * This covers role switching and user id changes (owner/other scenarios).
   */
  watch(
    () => authStore.currentUser,
    () => {
      void refresh();
    },
    { immediate: true, deep: false },
  );

  // ── Computed refs ──────────────────────────────────────────────────────────

  return {
    webCount: computed(() => data.value.webCount),
    trendsCount: computed(() => data.value.trendsCount),
    mimicsCount: computed(() => data.value.mimicsCount),
    reportsCount: computed(() => data.value.reportsCount),
    xyPlotsCount: computed(() => data.value.xyPlotsCount),
    recentWeb: computed(() => data.value.recentWeb),
    recentTrends: computed(() => data.value.recentTrends),
    recentMimics: computed(() => data.value.recentMimics),
    recentReports: computed(() => data.value.recentReports),
    recentXYPlots: computed(() => data.value.recentXYPlots),
    loading,
    error,
    refresh,
  };
}
