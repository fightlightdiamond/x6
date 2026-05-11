<script setup lang="ts">
/**
 * Renders its default slot when the current user has the specified permission,
 * and the `fallback` slot (or nothing) when they do not.
 *
 * @example
 * ```vue
 * <PermissionGuard action="create" resource="web">
 *   <button>Create Page</button>
 *   <template #fallback>
 *     <span class="text-gray-400">No permission</span>
 *   </template>
 * </PermissionGuard>
 * ```
 *
 * @module shared/components/PermissionGuard
 */

import { usePermission } from '../../composables/usePermission';
import type { Action, ResourceType, SubjectMetadata } from '../../types/index';

const props = defineProps<{
  /** The action to check (e.g. 'create', 'edit'). */
  action: Action;
  /** The resource type to check against (e.g. 'web', 'trends'). */
  resource: ResourceType;
  /** Optional subject metadata for scoped resources. */
  subject?: SubjectMetadata;
}>();

/**
 * Reactive boolean — true when the current user can perform `action` on
 * `resource` (optionally scoped by `subject`).
 */
const isAllowed = usePermission(
  () => props.action,
  () => props.resource,
  () => props.subject ?? null,
);
</script>

<template>
  <!-- Render children when permission is granted -->
  <slot v-if="isAllowed" />
  <!-- Render fallback slot (or nothing) when permission is denied -->
  <slot v-else name="fallback" />
</template>
