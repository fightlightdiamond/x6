/**
 * Standalone Vue Router configuration for the CASL Authorization System demo.
 *
 * Each route carries a `meta.resource` field that the route guard uses to
 * check `view` permission before allowing navigation (Req 13.18, 13.19).
 *
 * Routes:
 *  /                  → DashboardPage   (resource: 'web' — general access)
 *  /web               → WebPagesListPage
 *  /trends            → TrendsListPage
 *  /mimics            → MimicsListPage
 *  /reports           → ReportsListPage
 *  /xy-plots          → XYPlotsListPage
 *  /access-denied     → AccessDeniedPage (no permission check)
 *
 * @module router/index
 */

import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import type { ResourceType } from "../types/index";

// ── Route meta extension ───────────────────────────────────────────────────

declare module "vue-router" {
  interface RouteMeta {
    /** Resource type used by the route guard to check `view` permission. */
    resource?: ResourceType;
  }
}

// ── Route definitions ──────────────────────────────────────────────────────

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "dashboard",
    component: () => import("../pages/DashboardPage.vue"),
    meta: { resource: "web" },
  },
  {
    path: "/web",
    name: "web",
    component: () => import("../modules/web/pages/WebPagesListPage.vue"),
    meta: { resource: "web" },
  },
  {
    path: "/trends",
    name: "trends",
    component: () => import("../modules/trends/pages/TrendsListPage.vue"),
    meta: { resource: "trends" },
  },
  {
    path: "/mimics",
    name: "mimics",
    component: () => import("../modules/mimics/pages/MimicsListPage.vue"),
    meta: { resource: "mimics" },
  },
  {
    path: "/reports",
    name: "reports",
    component: () => import("../modules/reports/pages/ReportsListPage.vue"),
    meta: { resource: "reports" },
  },
  {
    path: "/xy-plots",
    name: "xy-plots",
    component: () => import("../modules/xy-plots/pages/XYPlotsListPage.vue"),
    meta: { resource: "xy_plots" },
  },
  {
    path: "/access-denied",
    name: "access-denied",
    component: () => import("../pages/AccessDeniedPage.vue"),
    // No resource guard — always accessible
  },
  {
    // Catch-all: redirect unknown paths to the dashboard
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

// ── Router instance ────────────────────────────────────────────────────────

/**
 * Creates and returns the Vue Router instance for the authorization module.
 *
 * Uses hash history so the router works without a server-side rewrite rule,
 * making it suitable for standalone / embedded usage.
 */
export function createAuthRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes,
  });
}

export { routes };
