/**
 * TypeScript types for the Reports module.
 *
 * @module modules/reports/types
 */

/**
 * Represents a report resource managed by the authorization system.
 *
 * Reports are any-based resources — permissions are not scope-dependent.
 */
export interface Report {
  readonly id: string;
  title: string;
  description: string;
  content: string;
  format: "pdf" | "excel" | "csv";
  readonly created_at: string;
  updated_at: string;
}
