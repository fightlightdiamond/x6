<template>
  <!-- Mini variant: chỉ hiện value + unit, dùng cho sensor tag nhỏ trên đường ống -->
  <div v-if="size === 'mini'"
    class="relative group inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/30 transition-colors duration-300 cursor-default"
    :class="bgClass" :style="{ minWidth: '52px' }" role="img" :aria-label="`${label}: ${displayValue} ${unit}`">
    <span class="font-mono text-[11px] font-bold text-white leading-none">{{ displayValue }}</span>
    <span v-if="unit" class="font-mono text-[9px] text-gray-300 leading-none">{{ unit }}</span>
    <!-- Ports mini -->
    <div port="left"
      class="node-port absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity">
    </div>
    <div port="right"
      class="node-port absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity">
    </div>
    <div port="top"
      class="node-port absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity">
    </div>
    <div port="bottom"
      class="node-port absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity">
    </div>
  </div>

  <!-- Normal variant (default) -->
  <div v-else
    class="relative group w-[90px] h-[44px] rounded border border-white/20 overflow-hidden flex flex-col justify-center px-1.5 py-1 transition-colors duration-300"
    :class="bgClass" role="img" :aria-label="`${label}: ${displayValue} ${unit}`">
    <!-- Dòng 1: Label -->
    <div class="text-[9px] uppercase tracking-wider text-gray-400 leading-none truncate">
      {{ label }}
    </div>

    <!-- Dòng 2: Value + Unit -->
    <div class="flex items-baseline gap-0.5 mt-0.5">
      <span class="font-mono text-sm font-bold text-white leading-none">
        {{ displayValue }}
      </span>
      <span v-if="unit" class="font-mono text-[10px] text-gray-300 leading-none">
        {{ unit }}
      </span>
    </div>

    <!-- Ports -->
    <div port="top"
      class="node-port absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity">
    </div>
    <div port="bottom"
      class="node-port absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity">
    </div>
    <div port="left"
      class="node-port absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity">
    </div>
    <div port="right"
      class="node-port absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity">
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps({
  label: { type: String, default: 'TAG' },
  value: { type: [Number, String] as unknown as () => number | string, default: 0 },
  unit: { type: String, default: '' },
  status: { type: String as () => 'normal' | 'high' | 'low' | 'alarm', default: 'normal' },
  size: { type: String as () => 'normal' | 'mini', default: 'normal' },
});

// ── Internal reactive state (synced from X6 node data or props) ────────────
const label = ref<string>(props.label);
const value = ref<number | string>(props.value);
const unit = ref<string>(props.unit);
const status = ref<'normal' | 'high' | 'low' | 'alarm'>(props.status);
const size = ref<'normal' | 'mini'>(props.size);

// Keep in sync when Storybook / parent changes props directly
watch(
  () => props,
  (p) => {
    label.value = p.label;
    value.value = p.value;
    unit.value = p.unit;
    status.value = p.status;
    size.value = p.size;
  },
  { deep: true },
);

// ── Computed: guard NaN / null / undefined ─────────────────────────────────
const displayValue = computed<string>(() => {
  const v = value.value;
  if (v === null || v === undefined) return '---';
  if (typeof v === 'number' && isNaN(v)) return 'ERR';
  return String(v);
});

// ── Computed: background class by status ──────────────────────────────────
const bgClass = computed<string>(() => {
  const map: Record<string, string> = {
    normal: 'bg-slate-600',
    high: 'bg-amber-600',
    low: 'bg-amber-600',
    alarm: 'bg-red-600 animate-pulse',
  };
  return map[status.value] ?? 'bg-slate-600';
});

// ── X6 inject pattern (same as DeviceNode.vue) ────────────────────────────
const getNode = inject<() => any>('getNode', () => null);
let node: any = null;

const syncFromNode = () => {
  const d = node?.getData();
  if (!d) return;
  if (d.label !== undefined) label.value = d.label;
  if (d.value !== undefined) value.value = d.value;
  if (d.unit !== undefined) unit.value = d.unit;
  if (d.status !== undefined) status.value = d.status;
  if (d.size !== undefined) size.value = d.size;
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

.node-port {
  z-index: 10;
}
</style>
