<script setup lang="ts">
import { usePermission } from '../composables/usePermission';
import type { Action, ResourceType, SubjectMetadata } from '../types/index';

const props = defineProps<{
  action: Action;
  resource: ResourceType;
  subject?: SubjectMetadata;
}>();

const isAllowed = usePermission(
  () => props.action,
  () => props.resource,
  () => props.subject ?? null,
);
</script>

<template>
  <slot v-if="isAllowed" name="authorized" />
  <slot v-else name="unauthorized" />
</template>
