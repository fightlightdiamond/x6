<script setup lang="ts">
/**
 * PermissionDebugger — Development-only tool for inspecting and testing permissions.
 *
 * Displays a full permissions matrix for the current user/role across all resources
 * and actions, and provides an interactive form to test custom permission checks
 * with optional subject metadata.
 *
 * Only rendered when `import.meta.dev` is true (development mode).
 *
 * @module components/PermissionDebugger
 */

import { ref, computed } from 'vue';
import { useAuthorizationStore } from '../stores/authorizationStore';
import { ACTIONS, RESOURCE_TYPES } from '../types/index';
import type { Action, ResourceType, ScopeType } from '../types/index';

// Only render in development mode (requirement 15.15)
const isDev = import.meta.dev ?? import.meta.env.DEV;

const store = useAuthorizationStore();

// ── Collapsible state ──────────────────────────────────────────────────────

const isExpanded = ref<boolean>(true);

function toggleExpanded(): void {
  isExpanded.value = !isExpanded.value;
}

// ── Custom permission check form (requirement 15.14) ───────────────────────

const testAction = ref<Action>('view');
const testResource = ref<ResourceType>('web');
const testWithSubject = ref<boolean>(false);
const testSubjectType = ref<ScopeType>('private');
const testSubjectUserId = ref<string>('user-1');

const testResult = computed<boolean>(() => {
  if (!testWithSubject.value) {
    return store.can(testAction.value, testResource.value);
  }
  return store.can(testAction.value, testResource.value, {
    type: testSubjectType.value,
    user_id: testSubjectUserId.value,
  });
});

// ── Permissions matrix for current user (requirement 15.13) ───────────────

const permissionsMatrix = computed(() =>
  RESOURCE_TYPES.map(resource => ({
    resource,
    permissions: ACTIONS.map(action => ({
      action,
      allowed: store.can(action, resource),
    })),
  })),
);
</script>

<template>
  <!-- Only render in development mode (requirement 15.15) -->
  <div
    v-if="isDev"
    class="fixed bottom-4 left-4 z-50 font-mono text-xs select-none max-w-[520px]"
    data-testid="permission-debugger"
  >
    <div class="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
      <!-- Header / toggle -->
      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
        :aria-expanded="isExpanded"
        aria-controls="permission-debugger-body"
        @click="toggleExpanded"
      >
        <span class="font-semibold text-gray-600">🔍 Permission Debugger</span>
        <span class="text-gray-400 text-[10px]">{{ isExpanded ? '▲' : '▼' }}</span>
      </button>

      <div
        v-if="isExpanded"
        id="permission-debugger-body"
        class="p-3 space-y-3 max-h-[80vh] overflow-y-auto"
      >
        <!-- Current user info (requirement 15.13) -->
        <div class="bg-blue-50 border border-blue-200 rounded p-2 space-y-0.5">
          <p class="text-[10px] font-medium text-blue-500 uppercase tracking-wide">Current User</p>
          <p class="text-gray-700">
            <span class="text-gray-500">ID:</span>
            <span class="ml-1 font-semibold text-blue-700" data-testid="current-user-id">
              {{ store.currentUser?.id ?? 'guest' }}
            </span>
          </p>
          <p class="text-gray-700">
            <span class="text-gray-500">Role:</span>
            <span class="ml-1 font-semibold text-blue-700" data-testid="current-user-role">
              {{ store.currentUser?.role ?? 'browse' }}
            </span>
          </p>
        </div>

        <!-- Permissions matrix table (requirement 15.13) -->
        <div>
          <p class="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
            Permissions Matrix
          </p>
          <div class="overflow-x-auto">
            <table
              class="w-full border-collapse text-[10px]"
              data-testid="permissions-matrix"
            >
              <thead>
                <tr>
                  <th class="text-left px-1 py-0.5 text-gray-500 font-medium border-b border-gray-200">
                    Resource
                  </th>
                  <th
                    v-for="action in ACTIONS"
                    :key="action"
                    class="px-1 py-0.5 text-gray-500 font-medium border-b border-gray-200 text-center"
                  >
                    {{ action }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in permissionsMatrix"
                  :key="row.resource"
                  class="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                >
                  <td class="px-1 py-0.5 text-gray-700 font-medium whitespace-nowrap">
                    {{ row.resource }}
                  </td>
                  <td
                    v-for="perm in row.permissions"
                    :key="perm.action"
                    class="px-1 py-0.5 text-center"
                    :data-testid="`matrix-${row.resource}-${perm.action}`"
                  >
                    <span
                      :class="perm.allowed ? 'text-green-600' : 'text-red-400'"
                      :title="`${perm.action} ${row.resource}: ${perm.allowed ? 'allowed' : 'denied'}`"
                    >
                      {{ perm.allowed ? '✓' : '✗' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Custom permission test form (requirement 15.14) -->
        <div class="border-t border-gray-200 pt-3 space-y-2">
          <p class="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
            Test Permission Check
          </p>

          <!-- Action selector -->
          <div class="flex items-center gap-2">
            <label
              for="debugger-action"
              class="text-[10px] text-gray-500 w-16 shrink-0"
            >
              Action
            </label>
            <select
              id="debugger-action"
              v-model="testAction"
              class="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
              data-testid="test-action-select"
            >
              <option v-for="action in ACTIONS" :key="action" :value="action">
                {{ action }}
              </option>
            </select>
          </div>

          <!-- Resource selector -->
          <div class="flex items-center gap-2">
            <label
              for="debugger-resource"
              class="text-[10px] text-gray-500 w-16 shrink-0"
            >
              Resource
            </label>
            <select
              id="debugger-resource"
              v-model="testResource"
              class="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
              data-testid="test-resource-select"
            >
              <option v-for="resource in RESOURCE_TYPES" :key="resource" :value="resource">
                {{ resource }}
              </option>
            </select>
          </div>

          <!-- Subject toggle -->
          <div class="flex items-center gap-2">
            <label
              for="debugger-with-subject"
              class="text-[10px] text-gray-500 w-16 shrink-0"
            >
              Subject
            </label>
            <input
              id="debugger-with-subject"
              v-model="testWithSubject"
              type="checkbox"
              class="cursor-pointer"
              data-testid="test-with-subject-checkbox"
            />
            <span class="text-[10px] text-gray-400">Include subject metadata</span>
          </div>

          <!-- Subject fields (shown when testWithSubject is true) -->
          <template v-if="testWithSubject">
            <div class="flex items-center gap-2 pl-2 border-l-2 border-blue-200">
              <label
                for="debugger-subject-type"
                class="text-[10px] text-gray-500 w-14 shrink-0"
              >
                Type
              </label>
              <select
                id="debugger-subject-type"
                v-model="testSubjectType"
                class="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                data-testid="test-subject-type-select"
              >
                <option value="private">private</option>
                <option value="shared">shared</option>
              </select>
            </div>

            <div class="flex items-center gap-2 pl-2 border-l-2 border-blue-200">
              <label
                for="debugger-subject-user-id"
                class="text-[10px] text-gray-500 w-14 shrink-0"
              >
                User ID
              </label>
              <input
                id="debugger-subject-user-id"
                v-model="testSubjectUserId"
                type="text"
                placeholder="e.g. user-1"
                class="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                data-testid="test-subject-user-id-input"
              />
            </div>
          </template>

          <!-- Result display -->
          <div
            class="flex items-center gap-2 pt-1"
            data-testid="test-result"
          >
            <span class="text-[10px] text-gray-500">Result:</span>
            <span
              :class="testResult ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'"
              class="px-2 py-0.5 rounded border font-semibold text-[10px]"
            >
              {{ testResult ? '✓ ALLOWED' : '✗ DENIED' }}
            </span>
            <span class="text-[10px] text-gray-400">
              can('{{ testAction }}', '{{ testResource }}'<template v-if="testWithSubject">, { type: '{{ testSubjectType }}', user_id: '{{ testSubjectUserId }}' }</template>)
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
