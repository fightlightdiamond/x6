/**
 * TypeScript types for the Trends module.
 *
 * @module modules/trends/types
 */

import type { ScopeType } from "../../types/index";

/**
 * Represents a trend resource managed by the authorization system.
 * Trends are scoped resources — permissions depend on `type` (private/shared)
 * and `user_id` (owner).
 */
export interface Trend {
  readonly id: string;
  name: string;
  description: string;
  /** Scope type: 'private' (owner-only by default) or 'shared' (visible to others). */
  type: ScopeType;
  /** The id of the user who owns this trend. */
  readonly user_id: string;
  data: unknown[];
  readonly created_at: string;
  updated_at: string;
}
