/**
 * TypeScript types for the Mimics module.
 *
 * @module modules/mimics/types
 */

/**
 * Represents a mimic (SCADA graphical display) resource managed by the authorization system.
 *
 * Mimics are any-based resources — permissions are not scope-dependent.
 */
export interface Mimic {
  readonly id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  layout: Record<string, unknown>;
  readonly created_at: string;
  updated_at: string;
}
