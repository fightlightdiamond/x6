<script setup lang="ts">
import { reactive } from 'vue';
import type { Report } from '../types';

type FormData = Omit<Report, 'id' | 'created_at' | 'updated_at'>;

const emit = defineEmits<{
  submit: [data: FormData];
  cancel: [];
}>();

const form = reactive<{
  title: string;
  description: string;
  content: string;
  format: Report['format'];
}>({
  title: '',
  description: '',
  content: '',
  format: 'pdf',
});

const errors = reactive({
  title: '',
});

function validate(): boolean {
  errors.title = '';

  if (!form.title.trim()) {
    errors.title = 'Title is required.';
    return false;
  }

  return true;
}

function handleSubmit(): void {
  if (!validate()) return;
  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    content: form.content.trim(),
    format: form.format,
  });
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Title (required) -->
    <div>
      <label for="report-title" class="block text-sm font-medium text-gray-700">
        Title <span class="text-red-500">*</span>
      </label>
      <input
        id="report-title"
        v-model="form.title"
        type="text"
        placeholder="Enter report title"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        :class="{ 'border-red-400': errors.title }"
      />
      <p v-if="errors.title" class="mt-1 text-xs text-red-500">{{ errors.title }}</p>
    </div>

    <!-- Description -->
    <div>
      <label for="report-description" class="block text-sm font-medium text-gray-700">
        Description
      </label>
      <textarea
        id="report-description"
        v-model="form.description"
        rows="3"
        placeholder="Describe this report…"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
      />
    </div>

    <!-- Content -->
    <div>
      <label for="report-content" class="block text-sm font-medium text-gray-700">
        Content
      </label>
      <textarea
        id="report-content"
        v-model="form.content"
        rows="5"
        placeholder="Report content or template…"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
      />
    </div>

    <!-- Format -->
    <div>
      <label for="report-format" class="block text-sm font-medium text-gray-700">
        Format
      </label>
      <select
        id="report-format"
        v-model="form.format"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="pdf">PDF</option>
        <option value="excel">Excel</option>
        <option value="csv">CSV</option>
      </select>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 pt-2">
      <button
        type="button"
        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        Create Report
      </button>
    </div>
  </form>
</template>
