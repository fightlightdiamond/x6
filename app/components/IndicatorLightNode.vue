<template>
  <div class="flex flex-col items-center justify-center w-[60px] h-[70px]">
    <!-- SVG LED Circle -->
    <svg
      viewBox="0 0 60 60"
      width="60"
      height="60"
      role="img"
      :aria-label="`Đèn báo ${label || 'LED'}: ${state}`"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Ping overlay circle khi fault -->
      <circle
        v-if="state === 'fault'"
        cx="30"
        cy="30"
        r="20"
        :fill="ledColor"
        opacity="0.5"
        class="animate-ping"
      />

      <!-- Main LED circle -->
      <circle
        cx="30"
        cy="30"
        r="20"
        :filter="isOn ? 'url(#glow)' : 'none'"
        :fill="ledColor"
      />
    </svg>

    <!-- Label bên dưới đèn -->
    <span
      v-if="label"
      class="text-[10px] text-center text-gray-300 leading-tight mt-0.5 max-w-[58px] truncate"
    >
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

// Props
const props = defineProps({
  state: {
    type: String as () => 'on' | 'off' | 'fault',
    default: 'off'
  },
  color: {
    type: String as () => 'green' | 'yellow' | 'red',
    default: 'green'
  },
  label: {
    type: String,
    default: ''
  }
});

// Internal reactive state
const state = ref<'on' | 'off' | 'fault'>(props.state);
const color = ref<'green' | 'yellow' | 'red'>(props.color);
const label = ref<string>(props.label);

// Sync props changes (for Storybook)
watch(() => props, (newProps) => {
  state.value = newProps.state;
  color.value = newProps.color;
  label.value = newProps.label;
}, { deep: true, immediate: true });

// Computed: đèn có sáng không (on hoặc fault)
const isOn = computed(() => state.value === 'on' || state.value === 'fault');

// Computed: màu LED
const ledColor = computed(() => {
  if (state.value === 'off') return '#374151'; // xám tối
  return { green: '#22c55e', yellow: '#eab308', red: '#ef4444' }[color.value] ?? '#22c55e';
});

// X6 inject pattern
const getNode = inject<() => any>('getNode', () => null);
let node: any = null;

const syncFromNode = () => {
  const d = node?.getData();
  if (d) {
    if (d.state !== undefined) state.value = d.state;
    if (d.color !== undefined) color.value = d.color;
    if (d.label !== undefined) label.value = d.label;
  }
};

onMounted(() => {
  node = getNode?.();
  if (node) {
    syncFromNode();
    node.on('change:data', syncFromNode);
  }
});

onBeforeUnmount(() => {
  node?.off('change:data', syncFromNode);
});
</script>

<style scoped>
@reference "tailwindcss";
</style>
