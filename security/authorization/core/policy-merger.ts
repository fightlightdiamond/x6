/**
 * Policy merging utility for the CASL Authorization System.
 *
 * Supports merging multiple `PolicyDefinition` objects into a single unified
 * policy (requirement 20.7). This is used by the plugin system to combine
 * base policies with plugin-contributed policies, and by the store to merge
 * dynamically loaded policies.
 *
 * **Merge semantics:**
 * - For any-based resources: action arrays are unioned (deduplicated).
 * - For scoped resources: action arrays are unioned for each
 *   scope/ownership combination (private.owner, private.other,
 *   shared.owner, shared.other).
 * - Later policies take precedence for structural conflicts (e.g. a resource
 *   that is any-based in one policy and scoped in another — the last definition
 *   wins for the conflicting resource).
 * - Resources present in only one policy are included as-is.
 *
 * @module core/policy-merger
 */

import type {
  Action,
  AnyResourceDef,
  PolicyDefinition,
  ResourceDef,
  ResourceType,
  Role,
  ScopedResourceDef,
  ScopePermissions,
} from "../types/index";
import { ROLES } from "../types/index";

// ─── Type guards ──────────────────────────────────────────────────────────────

function isAnyResourceDef(def: ResourceDef): def is AnyResourceDef {
  return "any" in def;
}

function isScopedResourceDef(def: ResourceDef): def is ScopedResourceDef {
  return "scopedBy" in def;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the union of two action arrays, deduplicated and preserving order
 * (items from `a` first, then new items from `b`).
 */
function unionActions(
  a: readonly Action[],
  b: readonly Action[],
): readonly Action[] {
  const seen = new Set<Action>(a);
  const result: Action[] = [...a];
  for (const action of b) {
    if (!seen.has(action)) {
      seen.add(action);
      result.push(action);
    }
  }
  return result;
}

/**
 * Merges two role-keyed action maps by unioning the action arrays for each role.
 */
function mergeRoleActions(
  a: Readonly<Record<Role, readonly Action[]>>,
  b: Readonly<Record<Role, readonly Action[]>>,
): Readonly<Record<Role, readonly Action[]>> {
  const result = {} as Record<Role, readonly Action[]>;
  for (const role of ROLES) {
    const aActions = a[role] ?? [];
    const bActions = b[role] ?? [];
    result[role] = unionActions(aActions, bActions);
  }
  return result;
}

/**
 * Merges two `ScopePermissions` objects by unioning action arrays for each
 * owner/other × role combination.
 */
function mergeScopePermissions(
  a: ScopePermissions,
  b: ScopePermissions,
): ScopePermissions {
  return {
    owner: mergeRoleActions(a.owner, b.owner),
    other: mergeRoleActions(a.other, b.other),
  };
}

/**
 * Merges two `ResourceDef` objects.
 *
 * - If both are any-based: union action arrays per role.
 * - If both are scoped: union action arrays for each scope/ownership combination.
 * - If they differ in type: `b` wins (last definition takes precedence).
 */
function mergeResourceDefs(a: ResourceDef, b: ResourceDef): ResourceDef {
  if (isAnyResourceDef(a) && isAnyResourceDef(b)) {
    return {
      any: mergeRoleActions(a.any, b.any),
    } satisfies AnyResourceDef;
  }

  if (isScopedResourceDef(a) && isScopedResourceDef(b)) {
    return {
      // scopedBy: last definition wins (b)
      scopedBy: b.scopedBy,
      private: mergeScopePermissions(a.private, b.private),
      shared: mergeScopePermissions(a.shared, b.shared),
    } satisfies ScopedResourceDef;
  }

  // Type conflict — last definition wins
  return b;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Merges two or more `PolicyDefinition` objects into a single unified policy.
 *
 * Policies are merged left-to-right: later policies are merged on top of
 * earlier ones. For any given resource:
 * - If the resource appears in multiple policies with the same type (any/scoped),
 *   action arrays are unioned.
 * - If the resource appears in only one policy, it is included as-is.
 * - If the resource type conflicts (any vs scoped), the last definition wins.
 *
 * @param policies - Two or more `PolicyDefinition` objects to merge.
 * @returns A merged `PolicyDefinition`.
 *
 * @example
 * ```ts
 * const merged = mergePolicies(basePolicy, pluginPolicy, overridePolicy);
 * const ability = buildAbility(user, merged);
 * ```
 */
export function mergePolicies(
  ...policies: readonly PolicyDefinition[]
): PolicyDefinition {
  if (policies.length === 0) {
    return {} as PolicyDefinition;
  }

  if (policies.length === 1) {
    return policies[0]!;
  }

  // Accumulate by folding left
  let result: Partial<Record<ResourceType, ResourceDef>> = {
    ...(policies[0] as Partial<Record<ResourceType, ResourceDef>>),
  };

  for (let i = 1; i < policies.length; i++) {
    const next = policies[i] as Partial<Record<ResourceType, ResourceDef>>;
    const merged: Partial<Record<ResourceType, ResourceDef>> = { ...result };

    for (const key of Object.keys(next) as ResourceType[]) {
      const nextDef = next[key];
      if (nextDef === undefined) continue;

      const existingDef = result[key];
      if (existingDef === undefined) {
        merged[key] = nextDef;
      } else {
        merged[key] = mergeResourceDefs(existingDef, nextDef);
      }
    }

    result = merged;
  }

  return result as PolicyDefinition;
}
