<script setup lang="ts">
import { reactive, computed } from 'vue';
import type { Mimic } from '../types';

type FormData = Omit<Mimic, 'id' | 'created_at' | 'updated_at'>;

const emit = defineEmits<{
  submit: [data: FormData];
  cancel: [];
}>();

const form = reactive<{ name: string; description: string }>({
  name: '',
  description: '',
});

const errors = reactive({
  name: '',
  description: '',
});

function validate(): boolean {
  let valid = true;

  errors.name = '';
  errors.description = '';

  if (!form.name.trim()) {
    errors.name = 'Name is required.';
    valid = false;
  }

  return valid;
}

function handleSubmit(): void {
  if (!validate()) return;
  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim(),
    config: {},
    layout: {},
  });
}

const isFormDirty = computed(
  () => form.name.trim() !== '' || form.description.trim() !== '',
);
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Name -->
    <div>
      <label for="mimic-name" class="block text-sm font-medium text-gray-700">
        Name <span class="text-red-500">*</span>
      </label>
      <input
        id="mimic-name"
        v-model="form.name"
        type="text"
        placeholder="Enter mimic name"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        :class="{ 'border-red-400': errors.name }"
      />
      <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
    </div>

    <!-- Description -->
    <div>
      <label for="mimic-description" class="block text-sm font-medium text-gray-700">
        Description
      </label>
      <textarea
        id="mimic-description"
        v-model="form.description"
        rows="4"
        placeholder="Describe this mimic display…"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        :class="{ 'border-red-400': errors.description }"
      />
      <p v-if="errors.description" class="mt-1 text-xs text-red-500">{{ errors.description }}</p>
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
        Create Mimic
      </button>
    </div>
  </form>
</template>
