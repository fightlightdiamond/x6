<!--
  Example 02: Using Composables in Vue Components

  Demonstrates useAbility() and usePermission() for reactive permission checks.
-->

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAbility } from '../composables/useAbility';
import { usePermission } from '../composables/usePermission';
import type { SubjectMetadata } from '../types/index';

// ─── useAbility: access the full ability instance ────────────────────────────

const { ability, can, cannot } = useAbility();

// Direct permission checks (not reactive — use usePermission for reactive checks)
const canCreateWeb = can('create', 'web');
const cannotDeleteMimics = cannot('delete', 'mimics');

// ─── usePermission: reactive boolean ─────────────────────────────────────────

// Simple any-based check
const canViewReports = usePermission('view', 'reports');

// Reactive scoped check — updates when trend changes
const currentTrend = ref<SubjectMetadata | null>(null);
const canEditTrend = usePermission('edit', 'trends', currentTrend);

// Load a trend and the permission check updates automatically
function loadTrend(id: string) {
  // Simulate fetching a trend
  currentTrend.value = {
    type: 'private',
    user_id: 'user-123',
  };
  // canEditTrend.value is now re-evaluated
}

// ─── Combining permissions ────────────────────────────────────────────────────

const canManageTrend = computed(() =>
  canEditTrend.value && usePermission('delete', 'trends', currentTrend).value
);
</script>

<template>
  <div>
    <!-- Conditional rendering based on reactive permission -->
    <button v-if="canViewReports">View Reports</button>

    <!-- Show/hide based on scoped permission -->
    <div v-if="currentTrend">
      <button v-if="canEditTrend">Edit Trend</button>
      <span v-else class="text-gray-400">Read-only</span>
    </div>

    <!-- Using can/cannot directly in template -->
    <button v-if="can('create', 'mimics')">Create Mimic</button>
    <span v-if="cannot('delete', 'reports')">Cannot delete reports</span>
  </div>
</template>
