/**
 * Custom error classes for the CASL Authorization System.
 *
 * Three error types cover the main failure modes:
 * - `PermissionDeniedError`: an action was explicitly denied (use in API guards)
 * - `InvalidPolicyError`: the policy definition has an invalid structure
 * - `InvalidUserContextError`: the user context is missing required fields
 *
 * @module core/errors
 */

import type { Action, ResourceType, SubjectMetadata } from "../types/index";

/**
 * Thrown when a user attempts an action they are not permitted to perform.
 *
 * Use this in API route guards or service methods to signal that the
 * current user lacks the required permission.
 *
 * @example
 * ```ts
 * if (store.cannot('delete', 'reports')) {
 *   throw new PermissionDeniedError('delete', 'reports', currentUser.id);
 * }
 * ```
 */
export class PermissionDeniedError extends Error {
  constructor(
    /** The action that was denied. */
    public readonly action: Action,
    /** The resource type the action was attempted on. */
    public readonly resource: ResourceType,
    /** The id of the user who was denied. */
    public readonly userId: string | number,
    /** Optional subject metadata for scoped resources. */
    public readonly subject?: SubjectMetadata,
  ) {
    super(`Permission denied: cannot ${action} ${resource}`);
    this.name = "PermissionDeniedError";
  }
}

/**
 * Thrown when the policy definition has an invalid or unexpected structure.
 *
 * This error is thrown during `buildAbility` validation if the policy
 * contains unknown resource keys, missing role entries, or malformed
 * resource definitions.
 *
 * @example
 * ```ts
 * // Thrown automatically by buildAbility:
 * buildAbility(user, { unknownResource: { any: { admin: [] } } });
 * // → InvalidPolicyError: unknown resource key "unknownResource"
 * ```
 */
export class InvalidPolicyError extends Error {
  constructor(
    message: string,
    /** The dot-path to the invalid field (e.g., `"trends.private.owner.admin"`). */
    public readonly field?: string,
  ) {
    super(`Invalid policy definition: ${message}`);
    this.name = "InvalidPolicyError";
  }
}

/**
 * Thrown when the `UserContext` passed to `buildAbility` is missing required
 * fields or contains invalid values.
 *
 * Common causes:
 * - `id` is `null`, `undefined`, or an empty string
 * - `role` is not one of the known roles (`admin`, `design`, `browse`)
 *
 * @example
 * ```ts
 * // Thrown automatically by buildAbility:
 * buildAbility({ id: '', role: 'admin' }, POLICY);
 * // → InvalidUserContextError: id is required and must not be empty
 * ```
 */
export class InvalidUserContextError extends Error {
  constructor(
    message: string,
    /** The name of the invalid field (e.g., `"id"` or `"role"`). */
    public readonly field?: string,
  ) {
    super(`Invalid user context: ${message}`);
    this.name = "InvalidUserContextError";
  }
}
