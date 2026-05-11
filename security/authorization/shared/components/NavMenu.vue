<script setup lang="ts">
/**
 * NavMenu
 *
 * Navigation menu with links to all modules.
 * - Hides menu items when the current user does not have `view` permission for
 *   the corresponding resource (Req 13.16).
 * - Highlights the active route (Req 13.15).
 *
 * Because this component lives inside a standalone authorization module (not
 * the main Nuxt app), it uses Vue Router's `useRoute` / `useRouter` directly.
 * If the router is not installed, the component degrades gracefully.
 *
 * @module shared/components/NavMenu
 */

import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePermission } from '../../composables/usePermission';
import type { ResourceType } from '../../types/index';

// ── Route / Router ─────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Nav item definitions ───────────────────────────────────────────────────

interface NavItem {
  label: string;
  path: string;
  resource: ResourceType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', resource: 'web' },
  { label: 'Web Pages', path: '/web', resource: 'web' },
  { label: 'Trends', path: '/trends', resource: 'trends' },
  { label: 'Mimics', path: '/mimics', resource: 'mimics' },
  { label: 'Reports', path: '/reports', resource: 'reports' },
  { label: 'XY Plots', path: '/xy-plots', resource: 'xy_plots' },
];

// ── Per-item permission checks ─────────────────────────────────────────────

const canViewWeb = usePermission('view', 'web');
const canViewTrends = usePermission('view', 'trends');
const canViewMimics = usePermission('view', 'mimics');
const canViewReports = usePermission('view', 'reports');
const canViewXYPlots = usePermission('view', 'xy_plots');

/** Map resource → reactive permission ref */
const permissionMap = computed<Record<ResourceType, boolean>>(() => ({
  web: canViewWeb.value,
  trends: canViewTrends.value,
  mimics: canViewMimics.value,
  reports: canViewReports.value,
  xy_plots: canViewXYPlots.value,
  trends_export: true,
  xy_plots_export: true,
}));

/** Only show items the user has `view` permission for (Req 13.16). */
const visibleItems = computed<NavItem[]>(() =>
  NAV_ITEMS.filter((item) => permissionMap.value[item.resource]),
);

// ── Active route detection ─────────────────────────────────────────────────

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
}

// ── Navigation ─────────────────────────────────────────────────────────────

function navigate(path: string): void {
  router.push(path);
}
</script>

<template>
  <nav
    class="flex items-center gap-1 bg-white border-b border-gray-200 px-4 py-2"
    aria-label="Main navigation"
  >
    <template v-for="item in visibleItems" :key="item.path">
      <button
        :aria-current="isActive(item.path) ? 'page' : undefined"
        :class="[
          'rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          isActive(item.path)
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        ]"
        @click="navigate(item.path)"
      >
        {{ item.label }}
      </button>
    </template>

    <!-- Empty state when no items are visible -->
    <span
      v-if="visibleItems.length === 0"
      class="text-sm text-gray-400 px-3 py-2"
    >
      No accessible modules
    </span>
  </nav>
</template>
