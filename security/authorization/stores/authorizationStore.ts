/**
 * Pinia authorization store.
 *
 * Manages the global authorization state: current user, CASL ability instance,
 * and policy definition. Uses `shallowRef` for the ability instance to avoid
 * deep reactivity overhead (requirement 19.1).
 *
 * Performance optimizations (requirements 19.1–19.10):
 * - Ability instances are cached per `userId:role` key — rebuild is skipped
 *   when the UserContext has not actually changed (19.1, 19.2).
 * - Permission checks are memoized per `action:resource:subjectKey` within
 *   the lifetime of the current ability instance (19.4).
 * - Development-mode performance logging via `import.meta.dev` (19.8).
 * - Batch permission checks via `checkPermissions()` (19.7).
 *
 * Extensibility (requirements 20.5–20.9):
 * - `loadPolicy(policyLoader)` supports dynamic policy loading from a backend
 *   and tracks the loaded policy version (20.8, 20.9).
 * - `policyVersion` exposes the current policy version string (20.9).
 *
 * @module stores/authorizationStore
 */

import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { subject as caslSubject } from "@casl/ability";
import type {
  AppAbility,
  Action,
  ResourceType,
  SubjectMetadata,
  UserContext,
  PolicyDefinition,
  VersionedPolicy,
} from "../types/index";
import { buildAbility } from "../core/ability";
import { POLICY } from "../core/policy";

// ── Performance logging helpers ────────────────────────────────────────────────

/**
 * Logs a message to the console only in development mode.
 * Controlled by `import.meta.dev` (Nuxt/Vite convention).
 */
function devLog(message: string): void {
  // import.meta.dev is injected by Nuxt/Vite; fall back to false in test/prod
  const isDev =
    typeof import.meta !== "undefined" &&
    "dev" in import.meta &&
    (import.meta as Record<string, unknown>)["dev"] === true;
  if (isDev) {
    console.debug(`[CASL] ${message}`);
  }
}

/**
 * Measures the execution time of `fn` and logs it in development mode.
 * Returns the result of `fn`.
 */
function measureDev<T>(label: string, fn: () => T): T {
  const isDev =
    typeof import.meta !== "undefined" &&
    "dev" in import.meta &&
    (import.meta as Record<string, unknown>)["dev"] === true;
  if (!isDev) return fn();

  const start = performance.now();
  const result = fn();
  const elapsed = (performance.now() - start).toFixed(3);
  console.debug(`[CASL] ${label} — ${elapsed}ms`);
  return result;
}

// ── Ability cache ──────────────────────────────────────────────────────────────

/**
 * Module-level cache mapping `userId:role` → `AppAbility`.
 *
 * Shared across store instances so that ability instances are reused when the
 * same user context is set again (e.g. after a page reload that restores the
 * same user from localStorage).
 *
 * The cache is intentionally small — in practice there are at most 3 roles and
 * a handful of user IDs active in a session.
 */
const abilityCache = new Map<string, AppAbility>();

/**
 * Returns a cache key for a given user context.
 * The key is `userId:role` — sufficient to uniquely identify an ability.
 */
function cacheKey(user: UserContext): string {
  return `${String(user.id)}:${user.role}`;
}

/**
 * Returns a cached ability for `user`, building and caching it on first call.
 * Logs the cache hit/miss in development mode.
 */
function getCachedAbility(
  user: UserContext,
  policy: PolicyDefinition,
): AppAbility {
  const key = cacheKey(user);
  const cached = abilityCache.get(key);
  if (cached !== undefined) {
    devLog(`Ability cache HIT for user ${key}`);
    return cached;
  }
  devLog(`Ability cache MISS — rebuilding ability for user ${key}`);
  const built = measureDev(`buildAbility(${key})`, () =>
    buildAbility(user, policy),
  );
  abilityCache.set(key, built);
  return built;
}

/** Default guest user used when no authenticated user is set. */
const GUEST_USER: UserContext = { id: "guest", role: "browse" };

// ── Permission-check memoization ───────────────────────────────────────────────

/**
 * Builds a stable string key for a permission check tuple.
 * Subject fields are sorted to ensure key stability regardless of property
 * insertion order.
 */
function permissionKey(
  action: Action,
  resource: ResourceType,
  subject: SubjectMetadata | undefined,
): string {
  if (subject === undefined) return `${action}:${resource}`;
  // Sort keys for a stable representation
  const subjectStr = JSON.stringify(subject, Object.keys(subject).sort());
  return `${action}:${resource}:${subjectStr}`;
}

export const useAuthorizationStore = defineStore("authorization", () => {
  // ── State ──────────────────────────────────────────────────────────────────

  /** The currently authenticated user, or `null` when unauthenticated. */
  const currentUser = ref<UserContext | null>(null);

  /**
   * The CASL ability instance derived from `currentUser` and `policyDefinition`.
   * Uses `shallowRef` to avoid deep reactivity overhead (requirement 19.1).
   * Initialized from the ability cache (or built fresh for the guest user).
   */
  const ability = shallowRef<AppAbility>(getCachedAbility(GUEST_USER, POLICY));

  /** The active policy definition used to build the ability. */
  const policyDefinition = ref<PolicyDefinition>(POLICY);

  /**
   * The current policy version string (requirement 20.9).
   * Set to `'default'` initially; updated when `loadPolicy` is called.
   */
  const policyVersion = ref<string>("default");

  /**
   * Memoization cache for permission checks within the current ability instance.
   * Cleared whenever the ability is rebuilt so stale results are never returned.
   * Key: `action:resource[:subjectJson]`  Value: boolean result
   */
  const permissionMemo = new Map<string, boolean>();

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Sets the current user and rebuilds the ability instance only when the
   * UserContext has actually changed (different id or role).
   *
   * @param user - The authenticated user context.
   */
  function setUser(user: UserContext): void {
    const prevUser = currentUser.value;
    currentUser.value = user;

    // Skip rebuild if the effective user context hasn't changed (19.2)
    if (
      prevUser !== null &&
      prevUser.id === user.id &&
      prevUser.role === user.role
    ) {
      devLog(
        `setUser: UserContext unchanged (${cacheKey(user)}) — skipping rebuild`,
      );
      return;
    }

    updateAbility();
  }

  /**
   * Rebuilds the ability instance from the current user and policy definition.
   * Falls back to the guest user when `currentUser` is `null`.
   * Uses the ability cache to avoid redundant rebuilds.
   */
  function updateAbility(): void {
    const user = currentUser.value ?? GUEST_USER;
    const newAbility = getCachedAbility(user, policyDefinition.value);
    ability.value = newAbility;
    // Clear the per-instance permission memo since the ability changed
    permissionMemo.clear();
    devLog(`updateAbility: ability updated for user ${cacheKey(user)}`);
  }

  /**
   * Resets the store to the guest user state.
   * Call this on logout or when no authenticated user is available.
   */
  function initializeWithGuestUser(): void {
    currentUser.value = null;
    ability.value = getCachedAbility(GUEST_USER, policyDefinition.value);
    permissionMemo.clear();
    devLog("initializeWithGuestUser: reset to guest user");
  }

  /**
   * Dynamically loads a policy from a backend or any async source, then
   * rebuilds the ability with the new policy (requirements 20.8, 20.9).
   *
   * The `policyLoader` is an async function that resolves to a
   * `VersionedPolicy` (containing both the policy definition and a version
   * string). After loading:
   * - `policyDefinition` is updated to the new policy.
   * - `policyVersion` is updated to the version string from the loader.
   * - The ability cache is invalidated (cleared) so the next permission check
   *   uses the new policy.
   * - The ability is rebuilt for the current user.
   *
   * @param policyLoader - Async function that resolves to a `VersionedPolicy`.
   * @returns A promise that resolves when the policy has been loaded and the
   *          ability has been rebuilt.
   *
   * @example
   * ```ts
   * await store.loadPolicy(async () => {
   *   const data = await fetch('/api/policy').then(r => r.json());
   *   return { version: data.version, policy: data.policy, loadedAt: Date.now() };
   * });
   * ```
   */
  async function loadPolicy(
    policyLoader: () => Promise<VersionedPolicy>,
  ): Promise<void> {
    devLog("loadPolicy: loading policy from external source…");
    const startTime = performance.now();

    const versioned = await policyLoader();

    policyDefinition.value = versioned.policy;
    policyVersion.value = versioned.version;

    // Invalidate the ability cache — the policy has changed so cached abilities
    // built with the old policy are no longer valid.
    abilityCache.clear();
    permissionMemo.clear();

    // Rebuild ability with the new policy
    updateAbility();

    const elapsed = (performance.now() - startTime).toFixed(3);
    devLog(
      `loadPolicy: loaded policy version "${versioned.version}" in ${elapsed}ms`,
    );
  }

  // ── Getters (computed functions) ───────────────────────────────────────────

  /**
   * Checks whether the current user is allowed to perform `action` on `resource`.
   * Results are memoized per `(action, resource, subject)` combination for the
   * lifetime of the current ability instance (requirement 19.4).
   *
   * @param action   - The action to check (view, create, edit, delete, export).
   * @param resource - The resource type to check against.
   * @param subject  - Optional subject metadata for scoped resources.
   * @returns `true` if the action is permitted.
   */
  function can(
    action: Action,
    resource: ResourceType,
    subject?: SubjectMetadata,
  ): boolean {
    const key = permissionKey(action, resource, subject);
    const cached = permissionMemo.get(key);
    if (cached !== undefined) {
      devLog(
        `Permission memo HIT: can('${action}', '${resource}') → ${String(cached)}`,
      );
      return cached;
    }

    let result: boolean;
    if (subject !== undefined) {
      // Tag the subject with the resource type so CASL can match conditions correctly.
      // Without this, ability.can(action, rawSubjectObj) fails because CASL cannot
      // determine which rules apply to an untagged plain object.
      result = ability.value.can(action, caslSubject(resource, subject));
    } else {
      result = ability.value.can(action, resource);
    }

    permissionMemo.set(key, result);
    devLog(`can('${action}', '${resource}') → ${String(result)}`);
    return result;
  }

  /**
   * Checks whether the current user is NOT allowed to perform `action` on `resource`.
   * Delegates to `can()` so results are also memoized.
   *
   * @param action   - The action to check.
   * @param resource - The resource type to check against.
   * @param subject  - Optional subject metadata for scoped resources.
   * @returns `true` if the action is forbidden.
   */
  function cannot(
    action: Action,
    resource: ResourceType,
    subject?: SubjectMetadata,
  ): boolean {
    return !can(action, resource, subject);
  }

  /**
   * Performs multiple permission checks in a single call and returns a
   * `Record<string, boolean>` mapping each check key to its result.
   *
   * This is useful when rendering large lists where many permission checks
   * would otherwise be performed individually (requirement 19.7).
   *
   * @param checks - Array of permission check descriptors.
   * @returns An object mapping each check's `key` to the boolean result.
   *
   * @example
   * ```ts
   * const results = store.checkPermissions([
   *   { key: 'canViewWeb',    action: 'view',   resource: 'web' },
   *   { key: 'canCreateWeb',  action: 'create', resource: 'web' },
   *   { key: 'canEditTrend',  action: 'edit',   resource: 'trends', subject: trendSubject },
   * ]);
   * // results.canViewWeb   → true
   * // results.canCreateWeb → true
   * // results.canEditTrend → false
   * ```
   */
  function checkPermissions(
    checks: ReadonlyArray<{
      key: string;
      action: Action;
      resource: ResourceType;
      subject?: SubjectMetadata;
    }>,
  ): Record<string, boolean> {
    const startTime = performance.now();
    const results: Record<string, boolean> = {};

    for (const check of checks) {
      results[check.key] = can(check.action, check.resource, check.subject);
    }

    const elapsed = (performance.now() - startTime).toFixed(3);
    devLog(`checkPermissions: ${checks.length} checks in ${elapsed}ms`);

    return results;
  }

  return {
    // State
    currentUser,
    ability,
    policyDefinition,
    policyVersion,
    // Actions
    setUser,
    updateAbility,
    initializeWithGuestUser,
    loadPolicy,
    // Getters
    can,
    cannot,
    checkPermissions,
  };
});
