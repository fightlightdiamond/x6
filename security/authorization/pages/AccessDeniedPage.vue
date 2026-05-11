<script setup lang="ts">
/**
 * AccessDeniedPage
 *
 * Shown when a user navigates to a route they do not have permission to view
 * (Req 13.20).  Provides a clear message and a link back to the dashboard.
 *
 * @module pages/AccessDeniedPage
 */

import { useRouter } from 'vue-router';

const router = useRouter();

function goHome(): void {
  router.push('/');
}

function goBack(): void {
  router.back();
}
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center"
  >
    <!-- Icon -->
    <div
      class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100"
      aria-hidden="true"
    >
      <svg
        class="h-10 w-10 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    </div>

    <!-- Heading -->
    <h1 class="mb-2 text-3xl font-bold text-gray-900">Access Denied</h1>

    <!-- Description -->
    <p class="mb-8 max-w-md text-base text-gray-500">
      You don't have permission to view this page. Please contact your
      administrator if you believe this is a mistake.
    </p>

    <!-- Actions -->
    <div class="flex flex-col gap-3 sm:flex-row">
      <button
        class="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        @click="goHome"
      >
        Go to Dashboard
      </button>
      <button
        class="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        @click="goBack"
      >
        Go Back
      </button>
    </div>
  </div>
</template>
