/**
 * Composable providing reactive access to the CASL ability instance.
 *
 * Wraps the `authorizationStore` to expose a reactive `ability` computed ref
 * and convenience `can`/`cannot` functions for use in Vue components.
 *
 * @module composables/useAbility
 */

import { computed } from "vue";
import type { ComputedRef } from "vue";
import { useAuthorizationStore } from "../stores/authorizationStore";
import type {
  Action,
  AppAbility,
  ResourceType,
  SubjectMetadata,
} from "../types/index";

/**
 * Returns a reactive ability instance and permission-check helpers.
 *
 * @example
 * ```ts
 * const { ability, can, cannot } = useAbility();
 *
 * // Reactive ability instance
 * console.log(ability.value.rules);
 *
 * // Permission checks
 * if (can('create', 'web')) { ... }
 * if (cannot('delete', 'trends', { type: 'private', user_id: '42' })) { ... }
 * ```
 */
export function useAbility(): {
  ability: ComputedRef<AppAbility>;
  can: (
    action: Action,
    resource: ResourceType,
    subject?: SubjectMetadata,
  ) => boolean;
  cannot: (
    action: Action,
    resource: ResourceType,
    subject?: SubjectMetadata,
  ) => boolean;
} {
  const store = useAuthorizationStore();

  /** Reactive computed ref that tracks the current CASL ability instance. */
  const ability = computed(() => store.ability);

  /**
   * Checks whether the current user can perform `action` on `resource`.
   *
   * @param action   - The action to check.
   * @param resource - The resource type to check against.
   * @param subject  - Optional subject metadata for scoped resources.
   * @returns `true` if the action is permitted.
   */
  function can(
    action: Action,
    resource: ResourceType,
    subject?: SubjectMetadata,
  ): boolean {
    return store.can(action, resource, subject);
  }

  /**
   * Checks whether the current user cannot perform `action` on `resource`.
   *
   * @param action   - The action to check.
   * @param resource - The resource type to check against.
   * @param subject  - Optional subject metadata for scoped resources.
   * @returns `true` if the action is forbidden.
   */
  function cannot(
    action: Action,
    resource: ResourceType,
    subject?: SubjectMetadata,
  ): boolean {
    return store.cannot(action, resource, subject);
  }

  return { ability, can, cannot };
}
