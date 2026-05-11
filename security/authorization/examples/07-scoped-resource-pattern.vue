<!--
  Example 07: Scoped Resource Pattern

  Demonstrates the complete pattern for a scoped resource (like Trends or XY Plots)
  where permissions depend on ownership and type (private/shared).
-->

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthorizationStore } from '../stores/authorizationStore';
import { usePermission } from '../composables/usePermission';
import type { SubjectMetadata } from '../types/index';

// Simulated trend data
interface Trend {
  id: string;
  name: string;
  type: 'private' | 'shared';
  user_id: string;
}

const props = defineProps<{
  trend: Trend;
}>();

const authStore = useAuthorizationStore();

// Build subject metadata from the trend
const trendSubject = computed<SubjectMetadata>(() => ({
  type: props.trend.type,
  user_id: props.trend.user_id,
}));

// Reactive permission checks
const canEdit = usePermission('edit', 'trends', trendSubject);
const canDelete = usePermission('delete', 'trends', trendSubject);

// Ownership indicator
const isOwner = computed(() =>
  authStore.currentUser?.id === props.trend.user_id
);

// Type badge
const typeBadgeClass = computed(() =>
  props.trend.type === 'private' ? 'badge-blue' : 'badge-green'
);
</script>

<template>
  <div class="trend-card">
    <!-- Ownership and type badges -->
    <div class="badges">
      <span :class="typeBadgeClass">
        {{ trend.type === 'private' ? 'Private' : 'Shared' }}
      </span>
      <span v-if="isOwner" class="badge-yellow">Owner</span>
      <span v-else class="badge-gray">Other</span>
    </div>

    <h3>{{ trend.name }}</h3>

    <!-- Actions based on scoped permissions -->
    <div class="actions">
      <!-- v-can with subject for scoped check -->
      <button v-can="['edit', 'trends', trendSubject]" class="btn-secondary">
        Edit
      </button>

      <!-- usePermission for more complex logic -->
      <button
        v-if="canDelete"
        class="btn-danger"
        @click="$emit('delete', trend.id)"
      >
        Delete
      </button>
    </div>
  </div>
</template>
