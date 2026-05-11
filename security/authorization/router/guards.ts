/**
 * Route guards for the CASL Authorization System.
 *
 * `registerGuards` attaches a `beforeEach` guard to the given router instance.
 * The guard reads `route.meta.resource` and checks whether the current user
 * has `view` permission for that resource.  If not, navigation is redirected
 * to `/access-denied` (Req 13.19, 13.20).
 *
 * @module router/guards
 */

import type { Router } from "vue-router";
import { useAuthorizationStore } from "../stores/authorizationStore";

/**
 * Attaches the permission-checking `beforeEach` guard to `router`.
 *
 * Call this once after creating the router and before mounting the app:
 *
 * ```ts
 * const router = createAuthRouter();
 * registerGuards(router);
 * app.use(router);
 * ```
 *
 * @param router - The Vue Router instance to protect.
 */
export function registerGuards(router: Router): void {
  router.beforeEach((to, _from) => {
    // Routes without a resource meta field are always accessible
    const resource = to.meta.resource;
    if (!resource) {
      return true;
    }

    // Never redirect the access-denied page itself (prevents infinite loop)
    if (to.name === "access-denied") {
      return true;
    }

    // Check `view` permission for the target resource
    const store = useAuthorizationStore();
    const allowed = store.can("view", resource);

    if (!allowed) {
      // Redirect to the access-denied page (Req 13.20)
      return { name: "access-denied" };
    }

    return true;
  });
}
