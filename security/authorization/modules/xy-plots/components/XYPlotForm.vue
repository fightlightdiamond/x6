<script setup lang="ts">
/**
 * XYPlotForm
 *
 * Form for creating or editing an XY plot.
 * - Fields: name (required), description, type (select: private/shared),
 *   x_axis label/unit, y_axis label/unit
 * - user_id is set from currentUserId prop (hidden field)
 * - Supports pre-filling via initialData prop for edit operations
 */
import { reactive, watch } from 'vue';
import type { XYPlot } from '../types';
import type { ScopeType } from '../../../types/index';

type FormData = Omit<XYPlot, 'id' | 'created_at' | 'updated_at'>;

const props = defineProps<{
  initialData?: Partial<XYPlot>;
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
  x_axis: {
    label: props.initialData?.x_axis?.label ?? '',
    unit: props.initialData?.x_axis?.unit ?? '',
  },
  y_axis: {
    label: props.initialData?.y_axis?.label ?? '',
    unit: props.initialData?.y_axis?.unit ?? '',
  },
  data_points: props.initialData?.data_points ?? [],
  updated_at: props.initialData?.updated_at ?? new Date().toISOString(),
});

// Keep user_id in sync with currentUserId when not editing an existing plot
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
    x_axis: {
      label: form.x_axis.label.trim(),
      unit: form.x_axis.unit.trim(),
    },
    y_axis: {
      label: form.y_axis.label.trim(),
      unit: form.y_axis.unit.trim(),
    },
    data_points: form.data_points,
    updated_at: new Date().toISOString(),
  });
}

const isEditMode = !!props.initialData?.name;
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <!-- Name (required) -->
    <div>
      <label for="xyplot-name" class="block text-sm font-medium text-gray-700">
        Name <span class="text-red-500">*</span>
      </label>
      <input
        id="xyplot-name"
        v-model="form.name"
        type="text"
        placeholder="Enter XY plot name"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        :class="{ 'border-red-400': errors.name }"
      />
      <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
    </div>

    <!-- Description -->
    <div>
      <label for="xyplot-description" class="block text-sm font-medium text-gray-700">
        Description
      </label>
      <textarea
        id="xyplot-description"
        v-model="form.description"
        rows="3"
        placeholder="Describe this XY plot…"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
      />
    </div>

    <!-- Type (private / shared) -->
    <div>
      <label for="xyplot-type" class="block text-sm font-medium text-gray-700">
        Type
      </label>
      <select
        id="xyplot-type"
        v-model="form.type"
        class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="private">Private</option>
        <option value="shared">Shared</option>
      </select>
      <p class="mt-1 text-xs text-gray-400">
        Private plots are only visible to you (and admins). Shared plots are visible to all users.
      </p>
    </div>

    <!-- X Axis -->
    <fieldset class="rounded-md border border-gray-200 p-3">
      <legend class="px-1 text-sm font-medium text-gray-700">X Axis</legend>
      <div class="grid grid-cols-2 gap-3 mt-1">
        <div>
          <label for="xyplot-x-label" class="block text-xs font-medium text-gray-600">Label</label>
          <input
            id="xyplot-x-label"
            v-model="form.x_axis.label"
            type="text"
            placeholder="e.g. Time"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="xyplot-x-unit" class="block text-xs font-medium text-gray-600">Unit</label>
          <input
            id="xyplot-x-unit"
            v-model="form.x_axis.unit"
            type="text"
            placeholder="e.g. s"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </fieldset>

    <!-- Y Axis -->
    <fieldset class="rounded-md border border-gray-200 p-3">
      <legend class="px-1 text-sm font-medium text-gray-700">Y Axis</legend>
      <div class="grid grid-cols-2 gap-3 mt-1">
        <div>
          <label for="xyplot-y-label" class="block text-xs font-medium text-gray-600">Label</label>
          <input
            id="xyplot-y-label"
            v-model="form.y_axis.label"
            type="text"
            placeholder="e.g. Temperature"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="xyplot-y-unit" class="block text-xs font-medium text-gray-600">Unit</label>
          <input
            id="xyplot-y-unit"
            v-model="form.y_axis.unit"
            type="text"
            placeholder="e.g. °C"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </fieldset>

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
        {{ isEditMode ? 'Save Changes' : 'Create XY Plot' }}
      </button>
    </div>
  </form>
</template>
