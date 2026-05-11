/**
 * Shared base components for the CASL Authorization System.
 *
 * - BaseList       — generic list with pagination, filtering, sorting, and slots
 * - BaseCard       — generic card with title, description, actions, and slots
 * - BaseForm       — generic form driven by a `fields` prop with validation
 * - PermissionGuard — renders children based on the current user's permission
 * - NavMenu        — navigation menu with permission-filtered links and active route highlight
 * - Breadcrumbs    — breadcrumb trail component
 */

export { default as BaseList } from "./BaseList.vue";
export { default as BaseCard } from "./BaseCard.vue";
export { default as BaseForm } from "./BaseForm.vue";
export { default as PermissionGuard } from "./PermissionGuard.vue";
export { default as NavMenu } from "./NavMenu.vue";
export { default as Breadcrumbs } from "./Breadcrumbs.vue";

// Re-export helper types so consumers don't need to import from the .vue files directly
export type { CardAction } from "./BaseCard.vue";
export type { FormField } from "./BaseForm.vue";
export type { BreadcrumbItem } from "./Breadcrumbs.vue";
