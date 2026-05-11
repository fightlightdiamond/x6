/**
 * TypeScript types for the Web Pages module.
 *
 * @module modules/web/types
 */

/**
 * Represents a web page resource managed by the authorization system.
 */
export interface WebPage {
  readonly id: string;
  title: string;
  content: string;
  url: string;
  readonly created_at: string;
  updated_at: string;
}
