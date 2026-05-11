<!--
  Example 03: v-can, v-cannot Directives and CanAccess Component

  Demonstrates template-level permission control using directives and the
  CanAccess component.
-->

<script setup lang="ts">
import { ref } from 'vue';
import CanAccess from '../components/CanAccess.vue';
import type { SubjectMetadata } from '../types/index';

const trend = ref<SubjectMetadata>({
  type: 'shared',
  user_id: 'user-456',
});
</script>

<template>
  <div class="space-y-4">

    <!-- ─── v-can: hide element when no permission ──────────────────────── -->

    <!-- Any-based resource -->
    <button v-can="['create', 'web']" class="btn-primary">
      Create Web Page
    </button>

    <!-- Scoped resource with subject -->
    <button v-can="['edit', 'trends', trend]" class="btn-secondary">
      Edit Trend
    </button>

    <!-- ─── v-cannot: show element when no permission ──────────────────── -->

    <!-- Show a read-only badge when user cannot edit -->
    <span v-cannot="['edit', 'reports']" class="badge badge-gray">
      Read-only
    </span>

    <!-- Show access denied message when user cannot view mimics -->
    <div v-cannot="['view', 'mimics']" class="alert alert-warning">
      You don't have access to Mimics.
    </div>

    <!-- ─── CanAccess: slot-based conditional rendering ─────────────────── -->

    <!-- Simple any-based check -->
    <CanAccess action="create" resource="mimics">
      <template #authorized>
        <button class="btn-primary">Create Mimic</button>
      </template>
      <template #unauthorized>
        <span class="text-gray-400">No permission to create mimics</span>
      </template>
    </CanAccess>

    <!-- Scoped check with subject -->
    <CanAccess action="delete" resource="trends" :subject="trend">
      <template #authorized>
        <button class="btn-danger">Delete Trend</button>
      </template>
      <template #unauthorized>
        <!-- Render nothing when unauthorized (omit #unauthorized slot) -->
      </template>
    </CanAccess>

    <!-- Export permission check -->
    <CanAccess action="export" resource="trends_export">
      <template #authorized>
        <button class="btn-secondary">Export Trends</button>
      </template>
    </CanAccess>

  </div>
</template>
