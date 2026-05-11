/**
 * `v-can` Vue directive for template-level permission checks.
 *
 * Hides the element (sets `display: none`) when the current user does not have
 * the requested permission. Re-evaluates on every component update so that
 * changes to the authorization store are reflected automatically when the
 * component re-renders.
 *
 * @example
 * ```html
 * <!-- Any-based resource -->
 * <button v-can="['create', 'web']">Create</button>
 *
 * <!-- Scoped resource -->
 * <button v-can="['edit', 'trends', trendSubject]">Edit</button>
 * ```
 *
 * @module directives/vCan
 */

import type { Directive, DirectiveBinding } from "vue";
import { useAuthorizationStore } from "../stores/authorizationStore";
import type { Action, ResourceType, SubjectMetadata } from "../types/index";

/** Tuple value accepted by the `v-can` directive. */
export type VCanValue = [Action, ResourceType, SubjectMetadata?];

/**
 * Applies the permission check and toggles element visibility.
 *
 * @param el      - The host DOM element.
 * @param binding - The directive binding containing the `[action, resource, subject?]` value.
 */
function applyPermission(
  el: HTMLElement,
  binding: DirectiveBinding<VCanValue>,
): void {
  const store = useAuthorizationStore();
  const [action, resource, subject] = binding.value;
  const allowed = store.can(action, resource, subject);
  el.style.display = allowed ? "" : "none";
}

/**
 * `v-can` directive definition.
 *
 * - `mounted`: runs the permission check when the element is first inserted.
 * - `updated`: re-runs the check whenever the binding value or the component
 *   re-renders (which happens when reactive store state changes in the template).
 */
export const vCan: Directive<HTMLElement, VCanValue> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<VCanValue>): void {
    applyPermission(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding<VCanValue>): void {
    applyPermission(el, binding);
  },
};
