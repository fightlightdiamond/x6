/**
 * Composable providing a reactive boolean permission check.
 *
 * Accepts reactive or plain values for `action`, `resource`, and optional
 * `subject`, and returns a `ComputedRef<boolean>` that automatically
 * re-evaluates whenever the ability instance, action, resource, or subject
 * changes.
 *
 * @module composables/usePermission
 */

import { computed, toValue } from "vue";
import type { ComputedRef, MaybeRef } from "vue";
import { useAuthorizationStore } from "../stores/authorizationStore";
import type { Action, ResourceType, SubjectMetadata } from "../types/index";

/**
 * Returns a reactive boolean indicating whether the current user can perform
 * `action` on `resource` (optionally scoped by `subject`).
 *
 * Automatically re-evaluates when the ability, action, resource, or subject
 * changes.
 *
 * @param action   - The action to check. Accepts a plain value or a `Ref`.
 * @param resource - The resource type to check against. Accepts a plain value or a `Ref`.
 * @param subject  - Optional subject metadata for scoped resources. Accepts a plain value, a `Ref`, or `null`.
 * @returns A `ComputedRef<boolean>` that is `true` when the action is permitted.
 *
 * @example
 * ```ts
 * // Plain values
 * const canCreate = usePermission('create', 'web');
 *
 * // Reactive refs
 * const action = ref<Action>('edit');
 * const resource = ref<ResourceType>('trends');
 * const subject = ref<SubjectMetadata | null>({ type: 'private', user_id: '42' });
 * const canEdit = usePermission(action, resource, subject);
 *
 * // Use in template
 * // <button v-if="canEdit">Edit</button>
 * ```
 */
export function usePermission(
  action: MaybeRef<Action>,
  resource: MaybeRef<ResourceType>,
  subject?: MaybeRef<SubjectMetadata | null>,
): ComputedRef<boolean> {
  const store = useAuthorizationStore();

  return computed(() => {
    const resolvedAction = toValue(action);
    const resolvedResource = toValue(resource);
    const resolvedSubject = subject ? toValue(subject) : undefined;

    return store.can(
      resolvedAction,
      resolvedResource,
      resolvedSubject ?? undefined,
    );
  });
}
