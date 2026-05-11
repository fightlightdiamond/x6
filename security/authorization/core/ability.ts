/**
 * CASL ability builder for the Authorization System.
 *
 * Converts a `UserContext` + `PolicyDefinition` into a typed `AppAbility`
 * instance using `@casl/ability`'s `AbilityBuilder` and `createMongoAbility`.
 *
 * `createMongoAbility` is required to support MongoDB-style conditions such as
 * `{ user_id: { $ne: userId } }` for "other" ownership rules.
 *
 * Performance optimizations (requirements 19.6, 19.8, 19.9):
 * - Rules with empty action arrays are skipped to minimize total rule count.
 * - Development-mode timing is logged via `import.meta.dev`.
 *
 * @module core/ability
 */

import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import type {
  AbilityBuildHook,
  Action,
  AppAbility,
  PolicyDefinition,
  ResourceType,
  UserContext,
} from "../types/index";
import { ROLES, RESOURCE_TYPES } from "../types/index";
import { InvalidPolicyError, InvalidUserContextError } from "./errors";

// ─── Type guards ──────────────────────────────────────────────────────────────

/** Narrows a `ResourceDef` to an any-based definition. */
function isAnyResourceDef(
  def: PolicyDefinition[ResourceType],
): def is Extract<PolicyDefinition[ResourceType], { any: unknown }> {
  return "any" in def;
}

/** Narrows a `ResourceDef` to a scoped definition. */
function isScopedResourceDef(
  def: PolicyDefinition[ResourceType],
): def is Extract<PolicyDefinition[ResourceType], { scopedBy: unknown }> {
  return "scopedBy" in def;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates a `UserContext` object.
 *
 * Throws `InvalidUserContextError` when:
 * - `id` is missing, `null`, `undefined`, or an empty string
 * - `role` is not one of the known `ROLES`
 */
function validateUserContext(
  userContext: unknown,
): asserts userContext is UserContext {
  if (
    userContext === null ||
    userContext === undefined ||
    typeof userContext !== "object"
  ) {
    throw new InvalidUserContextError(
      "userContext must be a non-null object",
      "userContext",
    );
  }

  const ctx = userContext as Record<string, unknown>;

  // Validate id
  const id = ctx["id"];
  if (id === null || id === undefined || id === "") {
    throw new InvalidUserContextError(
      "id is required and must not be null, undefined, or empty string",
      "id",
    );
  }

  // Validate role
  const role = ctx["role"];
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    throw new InvalidUserContextError(
      `role must be one of [${ROLES.join(", ")}], got: ${String(role)}`,
      "role",
    );
  }
}

/**
 * Validates a `PolicyDefinition` object.
 *
 * Throws `InvalidPolicyError` when:
 * - `policy` is not a non-null object
 * - Any resource key is not in `RESOURCE_TYPES`
 * - An any-based resource is missing the `any` property or role entries
 * - A scoped resource is missing `scopedBy`, `private`, or `shared` properties
 */
function validatePolicy(policy: unknown): asserts policy is PolicyDefinition {
  if (policy === null || policy === undefined || typeof policy !== "object") {
    throw new InvalidPolicyError("policy must be a non-null object", "policy");
  }

  const policyObj = policy as Record<string, unknown>;

  for (const resourceKey of Object.keys(policyObj)) {
    if (!RESOURCE_TYPES.includes(resourceKey as ResourceType)) {
      throw new InvalidPolicyError(
        `unknown resource key "${resourceKey}". Must be one of [${RESOURCE_TYPES.join(", ")}]`,
        resourceKey,
      );
    }

    const def = policyObj[resourceKey];
    if (def === null || def === undefined || typeof def !== "object") {
      throw new InvalidPolicyError(
        `resource definition for "${resourceKey}" must be a non-null object`,
        resourceKey,
      );
    }

    const defObj = def as Record<string, unknown>;

    if ("any" in defObj) {
      // Any-based resource: must have `any` with all three roles
      const anyDef = defObj["any"];
      if (
        anyDef === null ||
        anyDef === undefined ||
        typeof anyDef !== "object"
      ) {
        throw new InvalidPolicyError(
          `"${resourceKey}.any" must be a non-null object`,
          `${resourceKey}.any`,
        );
      }
      for (const role of ROLES) {
        const roleDef = (anyDef as Record<string, unknown>)[role];
        if (!Array.isArray(roleDef)) {
          throw new InvalidPolicyError(
            `"${resourceKey}.any.${role}" must be an array of actions`,
            `${resourceKey}.any.${role}`,
          );
        }
      }
    } else if ("scopedBy" in defObj) {
      // Scoped resource: must have `scopedBy`, `private`, `shared`
      for (const requiredKey of ["scopedBy", "private", "shared"] as const) {
        if (!(requiredKey in defObj)) {
          throw new InvalidPolicyError(
            `scoped resource "${resourceKey}" is missing required property "${requiredKey}"`,
            `${resourceKey}.${requiredKey}`,
          );
        }
      }
    } else {
      throw new InvalidPolicyError(
        `resource "${resourceKey}" must have either "any" (any-based) or "scopedBy" (scoped) property`,
        resourceKey,
      );
    }
  }
}

// ─── Development-mode performance logging ─────────────────────────────────────

/**
 * Returns `true` when running in Nuxt/Vite development mode.
 * Uses `import.meta.dev` which is injected by Nuxt; falls back to `false` in
 * test and production environments where the flag is absent.
 */
function isDevMode(): boolean {
  return (
    typeof import.meta !== "undefined" &&
    "dev" in import.meta &&
    (import.meta as Record<string, unknown>)["dev"] === true
  );
}

// ─── Ability builder ──────────────────────────────────────────────────────────

/**
 * Builds a typed `AppAbility` instance from a `UserContext` and a
 * `PolicyDefinition`.
 *
 * **Validation:**
 * - Throws `InvalidUserContextError` if `userContext.id` is missing/empty or
 *   `userContext.role` is not a known role.
 * - Throws `InvalidPolicyError` if the policy structure is invalid.
 *
 * **Rule generation (optimized — requirement 19.6):**
 * - Rules with empty action arrays are skipped entirely to minimize rule count.
 * - Any-based resources → `can(actions, resource)` with no conditions.
 * - Scoped resources → up to four rule sets per resource (only non-empty ones):
 *   - private/owner:  `can(actions, resource, { type: 'private', user_id: userId })`
 *   - private/other:  `can(actions, resource, { type: 'private', user_id: { $ne: userId } })`
 *   - shared/owner:   `can(actions, resource, { type: 'shared',  user_id: userId })`
 *   - shared/other:   `can(actions, resource, { type: 'shared',  user_id: { $ne: userId } })`
 *
 * **Extension hooks (requirement 20.5):**
 * - Optional `hooks` array is called after standard rules are built, allowing
 *   custom rules or conditions to be injected without modifying the core logic.
 *
 * **Performance logging (requirement 19.8):**
 * - In development mode (`import.meta.dev === true`), logs the build duration
 *   and total rule count to the console.
 *
 * @param userContext - The current user's id and role.
 * @param policy     - The application's policy definition.
 * @param hooks      - Optional array of hook functions called after standard rules are built.
 * @returns A fully configured `AppAbility` instance.
 */
export function buildAbility(
  userContext: UserContext,
  policy: PolicyDefinition,
  hooks?: readonly AbilityBuildHook[],
): AppAbility {
  const devMode = isDevMode();
  const startTime = devMode ? performance.now() : 0;

  // 1. Validate inputs
  validateUserContext(userContext);
  validatePolicy(policy);

  const { id: userId, role } = userContext;

  // 2. Build CASL rules — skip empty action arrays to minimize rule count (19.6)
  const builder = new AbilityBuilder<AppAbility>(createMongoAbility);
  const { can, build } = builder;

  for (const resourceKey of Object.keys(policy) as ResourceType[]) {
    const def = policy[resourceKey];

    if (isAnyResourceDef(def)) {
      // ── Any-based resource ──────────────────────────────────────────────
      const actions = def.any[role] as readonly Action[];
      if (actions.length > 0) {
        can(actions as Action[], resourceKey);
      }
    } else if (isScopedResourceDef(def)) {
      // ── Scoped resource ─────────────────────────────────────────────────

      // private / owner
      const privateOwnerActions = def.private.owner[role] as readonly Action[];
      if (privateOwnerActions.length > 0) {
        can(privateOwnerActions as Action[], resourceKey, {
          type: "private",
          user_id: userId,
        });
      }

      // private / other  (user_id ≠ current user)
      const privateOtherActions = def.private.other[role] as readonly Action[];
      if (privateOtherActions.length > 0) {
        can(privateOtherActions as Action[], resourceKey, {
          type: "private",
          user_id: { $ne: userId },
        });
      }

      // shared / owner
      const sharedOwnerActions = def.shared.owner[role] as readonly Action[];
      if (sharedOwnerActions.length > 0) {
        can(sharedOwnerActions as Action[], resourceKey, {
          type: "shared",
          user_id: userId,
        });
      }

      // shared / other  (user_id ≠ current user)
      const sharedOtherActions = def.shared.other[role] as readonly Action[];
      if (sharedOtherActions.length > 0) {
        can(sharedOtherActions as Action[], resourceKey, {
          type: "shared",
          user_id: { $ne: userId },
        });
      }
    }
  }

  // 3. Apply extension hooks after standard rules (requirement 20.5)
  if (hooks !== undefined && hooks.length > 0) {
    for (const hook of hooks) {
      hook(builder, userContext);
    }
    if (devMode) {
      console.debug(`[CASL] Applied ${hooks.length} extension hook(s)`);
    }
  }

  // 4. Return the built ability
  const builtAbility = build();

  // 5. Development-mode performance logging (requirement 19.8)
  if (devMode) {
    const elapsed = (performance.now() - startTime).toFixed(3);
    const ruleCount = builtAbility.rules.length;
    console.debug(
      `[CASL] buildAbility(user=${String(userId)}, role=${role}) — ${ruleCount} rules — ${elapsed}ms`,
    );
  }

  return builtAbility;
}
