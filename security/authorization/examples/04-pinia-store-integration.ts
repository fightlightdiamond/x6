/**
 * Example 04: Pinia Store Integration
 *
 * Demonstrates how to integrate the authorizationStore with other Pinia stores
 * and how to manage user authentication state.
 */

import { defineStore } from "pinia";
import { computed } from "vue";
import { useAuthorizationStore } from "../stores/authorizationStore";
import type { UserContext } from "../types/index";

// ─── Example: Authentication store that drives authorization ─────────────────

export const useAuthStore = defineStore("auth", () => {
  const authorizationStore = useAuthorizationStore();

  /**
   * Called after successful login. Sets the user in the authorization store
   * so permissions are immediately available.
   */
  async function login(credentials: { username: string; password: string }) {
    // Simulate API call
    const user: UserContext = await fetchUserFromApi(credentials);

    // Update authorization store — ability is rebuilt automatically
    authorizationStore.setUser(user);

    return user;
  }

  /**
   * Called on logout. Resets to guest user with minimal permissions.
   */
  function logout() {
    authorizationStore.initializeWithGuestUser();
  }

  /**
   * Reactive computed: current user's role.
   */
  const currentRole = computed(
    () => authorizationStore.currentUser?.role ?? "browse",
  );

  return { login, logout, currentRole };
});

// ─── Example: Resource store that checks permissions before mutations ─────────

export const useReportsStore = defineStore("reports", () => {
  const authorizationStore = useAuthorizationStore();

  async function deleteReport(reportId: string) {
    // Check permission before making the API call
    if (authorizationStore.cannot("delete", "reports")) {
      throw new Error("Permission denied: cannot delete reports");
    }

    // Proceed with deletion
    await deleteReportFromApi(reportId);
  }

  async function createReport(data: { title: string; content: string }) {
    if (authorizationStore.cannot("create", "reports")) {
      throw new Error("Permission denied: cannot create reports");
    }

    return await createReportInApi(data);
  }

  return { deleteReport, createReport };
});

// ─── Example: Watching for role changes ──────────────────────────────────────

import { watch } from "vue";

function setupRoleChangeWatcher() {
  const authorizationStore = useAuthorizationStore();

  // React to role changes (e.g., refresh data when role changes)
  watch(
    () => authorizationStore.currentUser?.role,
    (newRole, oldRole) => {
      if (newRole !== oldRole) {
        console.log(`Role changed from ${oldRole} to ${newRole}`);
        // Refresh data that depends on permissions
      }
    },
  );
}

// ─── Placeholder API functions ────────────────────────────────────────────────

async function fetchUserFromApi(_credentials: unknown): Promise<UserContext> {
  return { id: "user-123", role: "admin" };
}

async function deleteReportFromApi(_id: string): Promise<void> {}
async function createReportInApi(_data: unknown): Promise<unknown> {
  return {};
}
