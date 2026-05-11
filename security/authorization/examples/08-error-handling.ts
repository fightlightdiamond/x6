/**
 * Example 08: Error Handling
 *
 * Demonstrates how to handle authorization errors in API calls,
 * route guards, and Vue components.
 */

import {
  PermissionDeniedError,
  InvalidUserContextError,
  InvalidPolicyError,
} from "../core/errors";
import { buildAbility } from "../core/ability";
import { POLICY } from "../core/policy";
import { useAuthorizationStore } from "../stores/authorizationStore";

// ─── Throwing PermissionDeniedError in API calls ──────────────────────────────

async function deleteReport(reportId: string) {
  const store = useAuthorizationStore();

  if (store.cannot("delete", "reports")) {
    throw new PermissionDeniedError(
      "delete",
      "reports",
      store.currentUser?.id ?? "guest",
    );
  }

  // Proceed with deletion
  await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
}

// ─── Catching PermissionDeniedError in components ────────────────────────────

async function handleDeleteClick(reportId: string) {
  try {
    await deleteReport(reportId);
    console.log("Report deleted successfully");
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      // Show user-friendly message
      console.error(`You cannot ${error.action} ${error.resource}`);
    } else {
      throw error; // Re-throw unexpected errors
    }
  }
}

// ─── Handling InvalidUserContextError ────────────────────────────────────────

function initializeUser(userData: unknown) {
  try {
    const store = useAuthorizationStore();
    store.setUser(
      userData as { id: string; role: "admin" | "design" | "browse" },
    );
  } catch (error) {
    if (error instanceof InvalidUserContextError) {
      console.error(`Invalid user data: ${error.message}`);
      console.error(`Problem field: ${error.field}`);
      // Fall back to guest user
      const store = useAuthorizationStore();
      store.initializeWithGuestUser();
    } else {
      throw error;
    }
  }
}

// ─── Handling InvalidPolicyError ─────────────────────────────────────────────

function loadCustomPolicy(policyData: unknown) {
  try {
    const store = useAuthorizationStore();
    // @ts-expect-error — demonstrating runtime validation
    store.policyDefinition = policyData;
    store.updateAbility();
  } catch (error) {
    if (error instanceof InvalidPolicyError) {
      console.error(`Invalid policy: ${error.message}`);
      console.error(`Problem field: ${error.field}`);
      // Keep using the default policy
    } else {
      throw error;
    }
  }
}

// ─── Route guard with permission check ───────────────────────────────────────

// In router/index.ts or a Nuxt middleware:
//
// router.beforeEach((to, from) => {
//   const store = useAuthorizationStore();
//
//   if (to.meta.requiresPermission) {
//     const { action, resource } = to.meta.requiresPermission;
//     if (store.cannot(action, resource)) {
//       return { name: 'access-denied' };
//     }
//   }
// });
