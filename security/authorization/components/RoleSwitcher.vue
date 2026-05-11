<script setup lang="ts">
/**
 * RoleSwitcher — Development-only tool for switching roles and user IDs.
 *
 * Allows developers to test authorization scenarios by switching between
 * roles (admin, design, browse) and user IDs (for owner/other scenarios).
 * Persists selections in localStorage and restores them on page reload.
 *
 * Only rendered when `import.meta.dev` is true (development mode).
 *
 * @module components/RoleSwitcher
 */

import { ref, onMounted } from 'vue';
import { useAuthorizationStore } from '../stores/authorizationStore';
import { ROLES } from '../types/index';
import type { Role } from '../types/index';

// Only render in development mode (requirement 15.15)
const isDev = import.meta.dev ?? import.meta.env.DEV;

const store = useAuthorizationStore();

const STORAGE_KEY_ROLE = 'casl-dev-role';
const STORAGE_KEY_USER_ID = 'casl-dev-user-id';

const selectedRole = ref<Role>('browse');
const userId = ref<string>('user-1');
const isExpanded = ref<boolean>(true);

/**
 * Applies the current selectedRole and userId to the authorization store
 * and persists them to localStorage.
 */
function applyChange(): void {
  localStorage.setItem(STORAGE_KEY_ROLE, selectedRole.value);
  localStorage.setItem(STORAGE_KEY_USER_ID, userId.value);
  // Update currentUser in authorizationStore → triggers ability rebuild (requirements 15.4, 15.5, 15.6, 15.8)
  store.setUser({ id: userId.value, role: selectedRole.value });
}

function onRoleChange(): void {
  applyChange();
}

function onUserIdChange(): void {
  applyChange();
}

function toggleExpanded(): void {
  isExpanded.value = !isExpanded.value;
}

// Restore from localStorage on mount (requirements 15.10, 15.11)
onMounted(() => {
  const savedRole = localStorage.getItem(STORAGE_KEY_ROLE) as Role | null;
  const savedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);

  if (savedRole && (ROLES as readonly string[]).includes(savedRole)) {
    selectedRole.value = savedRole;
  }
  if (savedUserId) {
    userId.value = savedUserId;
  }

  // Apply restored (or default) state to the store
  applyChange();
});
</script>

<template>
  <!-- Only render in development mode (requirement 15.15) -->
  <div
    v-if="isDev"
    class="fixed bottom-4 right-4 z-50 font-mono text-xs select-none"
    data-testid="role-switcher"
  >
    <div class="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden min-w-[200px]">
      <!-- Header / toggle -->
      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
        :aria-expanded="isExpanded"
        aria-controls="role-switcher-body"
        @click="toggleExpanded"
      >
        <span class="font-semibold text-gray-600">🔧 Dev Tools</span>
        <span class="text-gray-400 text-[10px]">{{ isExpanded ? '▲' : '▼' }}</span>
      </button>

      <!-- Body -->
      <div
        v-if="isExpanded"
        id="role-switcher-body"
        class="p-3 space-y-2"
      >
        <!-- Role selector (requirements 15.2, 15.3, 15.4) -->
        <div class="flex flex-col gap-1">
          <label
            for="role-switcher-role"
            class="text-[10px] font-medium text-gray-500 uppercase tracking-wide"
          >
            Role
          </label>
          <select
            id="role-switcher-role"
            v-model="selectedRole"
            class="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
            data-testid="role-select"
            @change="onRoleChange"
          >
            <option
              v-for="role in ROLES"
              :key="role"
              :value="role"
            >
              {{ role }}
            </option>
          </select>
        </div>

        <!-- User ID input (requirements 15.7, 15.8) -->
        <div class="flex flex-col gap-1">
          <label
            for="role-switcher-user-id"
            class="text-[10px] font-medium text-gray-500 uppercase tracking-wide"
          >
            User ID
          </label>
          <input
            id="role-switcher-user-id"
            v-model="userId"
            type="text"
            placeholder="e.g. user-1"
            class="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
            data-testid="user-id-input"
            @change="onUserIdChange"
          />
        </div>

        <!-- Current state display -->
        <div class="pt-1 border-t border-gray-100">
          <p class="text-[10px] text-gray-400">
            <span class="font-medium text-gray-500">Current:</span>
            <span class="ml-1 text-blue-600 font-semibold">{{ selectedRole }}</span>
            <span class="mx-1 text-gray-300">/</span>
            <span class="text-gray-600">{{ userId }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
