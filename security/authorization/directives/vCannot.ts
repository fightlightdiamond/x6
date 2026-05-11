/**
 * `v-cannot` Vue directive for template-level permission checks.
 *
 * The inverse of `v-can`: shows the element when the current user does NOT
 * have the requested permission, and hides it (sets `display: none`) when the
 * user DOES have permission. Re-evaluates on every component update so that
 * changes to the authorization store are reflected automatically when the
 * component re-renders.
 *
 * @example
 * ```html
 * <!-- Show a "read-only" badge when the user cannot edit -->
 * <span v-cannot="['edit', 'trends']">Read-only</span>
 *
 * <!-- Scoped resource -->
 * <span v-cannot="['delete', 'reports', reportSubject]">Cannot delete</span>
 * ```
 *
 * @module directives/vCannot
 */

import type { Directive, DirectiveBinding } from "vue";
import { useAuthorizationStore } from "../stores/authorizationStore";
import type { Action, ResourceType, SubjectMetadata } from "../types/index";

/** Tuple value accepted by the `v-cannot` directive. */
export type VCannotValue = [Action, ResourceType, SubjectMetadata?];

/**
 * Applies the inverse permission check and toggles element visibility.
 *
 * The element is shown when the user is denied the action, and hidden when
 * the user is allowed.
 *
 * @param el      - The host DOM element.
 * @param binding - The directive binding containing the `[action, resource, subject?]` value.
 */
function applyPermission(
  el: HTMLElement,
  binding: DirectiveBinding<VCannotValue>,
): void {
  const store = useAuthorizationStore();
  const [action, resource, subject] = binding.value;
  const denied = store.cannot(action, resource, subject);
  el.style.display = denied ? "" : "none";
}

/**
 * `v-cannot` directive definition.
 *
 * - `mounted`: runs the inverse permission check when the element is first inserted.
 * - `updated`: re-runs the check whenever the binding value or the component
 *   re-renders (which happens when reactive store state changes in the template).
 */
export const vCannot: Directive<HTMLElement, VCannotValue> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<VCannotValue>): void {
    applyPermission(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding<VCannotValue>): void {
    applyPermission(el, binding);
  },
};
