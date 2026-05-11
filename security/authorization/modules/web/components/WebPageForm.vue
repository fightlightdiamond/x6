<script setup lang="ts">
import { reactive, computed } from 'vue';
import type { WebPage } from '../types';

type FormData = Omit<WebPage, 'id' | 'created_at' | 'updated_at'>;

const emit = defineEmits<{
  submit: [data: FormData];
  cancel: [];
}>();

const form = reactive<FormData>({
  title: '',
  content: '',
  url: '',
});

const errors = reactive({
  title: '',
  content: '',
  url: '',
});

function validate(): boolean {
  let valid = true;

  errors.title = '';
  errors.content = '';
  errors.url = '';

  if (!form.title.trim()) {
    errors.title = 'Title is required.';
    valid = false;
  }

  if (!form.content.trim()) {
    errors.content = 'Content is required.';
    valid = false;
  }

  if (!form.url.trim()) {
    errors.url = 'URL is required.';
    valid = false;
  }

  return valid;
}

function handleSubmit(): void {
  if (!validate()) return;
  emit('submit', { title: form.title.trim(), content: form.content.trim(), url: form.url.trim() });
}

const isFormDirty = computed(
  () => form.title.trim() !== '' || form.content.trim() !== '' || form.url.trim() !== '',
);
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Title -->
    <div>
      <label for="wp-title" class="block text-sm font-medium text-gray-700">
        Title <span class="text-red-500">*</span>
      </label>
      <input
        id="wp-title"
        v-model="form.title"
        type="text"
        placeholder="Enter page title"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        :class="{ 'border-red-400': errors.title }"
      />
      <p v-if="errors.title" class="mt-1 text-xs text-red-500">{{ errors.title }}</p>
    </div>

    <!-- URL -->
    <div>
      <label for="wp-url" class="block text-sm font-medium text-gray-700">
        URL <span class="text-red-500">*</span>
      </label>
      <input
        id="wp-url"
        v-model="form.url"
        type="text"
        placeholder="/path/to/page"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        :class="{ 'border-red-400': errors.url }"
      />
      <p v-if="errors.url" class="mt-1 text-xs text-red-500">{{ errors.url }}</p>
    </div>

    <!-- Content -->
    <div>
      <label for="wp-content" class="block text-sm font-medium text-gray-700">
        Content <span class="text-red-500">*</span>
      </label>
      <textarea
        id="wp-content"
        v-model="form.content"
        rows="4"
        placeholder="Describe this web page…"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        :class="{ 'border-red-400': errors.content }"
      />
      <p v-if="errors.content" class="mt-1 text-xs text-red-500">{{ errors.content }}</p>
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
        Create Page
      </button>
    </div>
  </form>
</template>
