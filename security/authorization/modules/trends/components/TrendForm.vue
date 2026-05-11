<script setup lang="ts">
/**
 * TrendForm
 *
 * Form for creating or editing a trend (Req 8.6).
 * - Fields: name (required), description, type (select: private/shared)
 * - user_id is set from currentUserId prop (hidden field)
 * - Supports pre-filling via initialData prop for edit operations
 */
import { reactive, watch } from 'vue';
import type { Trend } from '../types';
import type { ScopeType } from '../../../types/index';

type FormData = Omit<Trend, 'id' | 'created_at' | 'updated_at'>;

const props = defineProps<{
  initialData?: Partial<Trend>;
  currentUserId: string;
}>();

const emit = defineEmits<{
  submit: [data: FormData];
  cancel: [];
}>();

const form = reactive<FormData>({
  name: props.initialData?.name ?? '',
  description: props.initialData?.description ?? '',
  type: (props.initialData?.type ?? 'private') as ScopeType,
  user_id: props.initialData?.user_id ?? props.currentUserId,
  data: props.initialData?.data ?? [],
  updated_at: props.initialData?.updated_at ?? new Date().toISOString(),
});

// Keep user_id in sync with currentUserId when not editing an existing trend
watch(
  () => props.currentUserId,
  (id) => {
    if (!props.initialData?.user_id) {
      form.user_id = id;
    }
  },
);

const errors = reactive({
  name: '',
});

function validate(): boolean {
  errors.name = '';

  if (!form.name.trim()) {
    errors.name = 'Name is required.';
    return false;
  }

  return true;
}

function handleSubmit(): void {
  if (!validate()) return;
  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim(),
    type: form.type,
    user_id: form.user_id,
    data: form.data,
    updated_at: new Date().toISOString(),
  });
}

const isEditMode = !!props.initialData?.name;
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Name (required) -->
    <div>
      <label for="trend-name" class="block text-sm font-medium text-gray-700">
        Name <span class="text-red-500">*</span>
      </label>
      <input
        id="trend-name"
        v-model="form.name"
        type="text"
        placeholder="Enter trend name"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        :class="{ 'border-red-400': errors.name }"
      />
      <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
    </div>

    <!-- Description -->
    <div>
      <label for="trend-description" class="block text-sm font-medium text-gray-700">
        Description
      </label>
      <textarea
        id="trend-description"
        v-model="form.description"
        rows="3"
        placeholder="Describe this trend…"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
      />
    </div>

    <!-- Type (private / shared) -->
    <div>
      <label for="trend-type" class="block text-sm font-medium text-gray-700">
        Type
      </label>
      <select
        id="trend-type"
        v-model="form.type"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="private">Private</option>
        <option value="shared">Shared</option>
      </select>
      <p class="mt-1 text-xs text-gray-400">
        Private trends are only visible to you (and admins). Shared trends are visible to all users.
      </p>
    </div>

    <!-- Hidden: user_id is set from currentUserId -->
    <input type="hidden" :value="form.user_id" />

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
        class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        {{ isEditMode ? 'Save Changes' : 'Create Trend' }}
      </button>
    </div>
  </form>
</template>
