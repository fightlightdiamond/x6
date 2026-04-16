<template>
  <div class="motor-blower-node relative flex flex-col items-center" :style="containerStyle" role="img"
    :aria-label="`Động cơ quạt ${nodeData.label}, trạng thái: ${nodeData.status}`">
    <!-- SVG: thân motor nằm ngang + bánh đà tròn bên phải (giống P&ID gốc) -->
    <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" class="overflow-visible">
      <!-- ── Thân motor (hình chữ nhật) ── -->
      <rect x="2" :y="H * 0.2" :width="W * 0.58" :height="H * 0.6" rx="4" ry="4" :fill="bodyFill" stroke="#1e293b"
        stroke-width="1.5" />
      <!-- Highlight trên thân -->
      <rect x="5" :y="H * 0.22" :width="W * 0.52" :height="H * 0.12" rx="2" fill="rgba(255,255,255,0.18)" />
      <!-- Đường gân ngang trên thân motor -->
      <line :x1="W * 0.12" :y1="H * 0.38" :x2="W * 0.56" :y2="H * 0.38" stroke="rgba(0,0,0,0.2)" stroke-width="1" />
      <line :x1="W * 0.12" :y1="H * 0.52" :x2="W * 0.56" :y2="H * 0.52" stroke="rgba(0,0,0,0.2)" stroke-width="1" />
      <line :x1="W * 0.12" :y1="H * 0.66" :x2="W * 0.56" :y2="H * 0.66" stroke="rgba(0,0,0,0.2)" stroke-width="1" />

      <!-- ── Trục nối motor → bánh đà ── -->
      <rect :x="W * 0.58" :y="H * 0.46" :width="W * 0.08" :height="H * 0.08" fill="#334155" />

      <!-- ── Vỏ bánh đà (hình tròn) ── -->
      <circle :cx="W * 0.78" :cy="H * 0.5" :r="H * 0.38" :fill="wheelBg" stroke="#1e293b" stroke-width="1.5" />
      <!-- Vòng viền trong bánh đà -->
      <circle :cx="W * 0.78" :cy="H * 0.5" :r="H * 0.30" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" />

      <!-- ── Cánh quạt (4 cánh, quay khi running) ── -->
      <g class="fan-blades" :class="{ spinning: isRunning }" :style="`transform-origin: ${W * 0.78}px ${H * 0.5}px`"
        :fill="bladeFill" stroke="rgba(0,0,0,0.25)" stroke-width="0.8" opacity="0.9">
        <ellipse :cx="W * 0.78" :cy="H * 0.5 - H * 0.18" :rx="H * 0.07" :ry="H * 0.18" />
        <ellipse :cx="W * 0.78 + H * 0.18" :cy="H * 0.5" :rx="H * 0.18" :ry="H * 0.07" />
        <ellipse :cx="W * 0.78" :cy="H * 0.5 + H * 0.18" :rx="H * 0.07" :ry="H * 0.18" />
        <ellipse :cx="W * 0.78 - H * 0.18" :cy="H * 0.5" :rx="H * 0.18" :ry="H * 0.07" />
      </g>

      <!-- Trục giữa bánh đà -->
      <circle :cx="W * 0.78" :cy="H * 0.5" :r="H * 0.07" fill="white" stroke="rgba(0,0,0,0.3)" stroke-width="1" />

      <!-- ── Chân đế ── -->
      <rect :x="W * 0.05" :y="H * 0.8" :width="W * 0.55" :height="H * 0.1" rx="2" fill="#1e293b" opacity="0.6" />

      <!-- ── Status dot góc trên phải ── -->
      <circle :cx="W * 0.94" :cy="H * 0.1" r="5" :fill="statusColor"
        :class="{ 'animate-ping': nodeData.status === 'fault' }" stroke="white" stroke-width="1" />
    </svg>

    <!-- Label + thông số bên dưới -->
    <div class="flex flex-col items-center w-full mt-0.5" style="gap:1px">
      <span class="font-bold text-[10px] text-slate-700 leading-none truncate max-w-full px-1">
        {{ nodeData.label }}
      </span>
      <div class="flex gap-1.5 text-[9px] font-mono text-slate-600 leading-none">
        <span>{{ nodeData.current.toFixed(1) }}A</span>
        <span>{{ nodeData.statorTemp }}°C</span>
      </div>
    </div>

    <!-- Ports X6 -->
    <div class="node-port port-left" data-magnet="true"></div>
    <div class="node-port port-right" data-magnet="true"></div>
    <div class="node-port port-top" data-magnet="true"></div>
    <div class="node-port port-bottom" data-magnet="true"></div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  status: { type: String as () => 'running' | 'stopped' | 'fault', default: 'stopped' },
  current: { type: Number, default: 120.0 },
  statorTemp: { type: Number, default: 65 },
  bearingTemp: { type: Number, default: 45 },
  label: { type: String, default: 'Ventilátor' },
  size: { type: String as () => 'small' | 'large', default: 'large' },
})

const nodeData = ref({ ...props })

watch(() => props, (p) => { nodeData.value = { ...nodeData.value, ...p } }, { deep: true, immediate: true })

// Kích thước: large=110×70, small=80×52
const W = computed(() => nodeData.value.size === 'small' ? 80 : 110)
const H = computed(() => nodeData.value.size === 'small' ? 52 : 70)

const containerStyle = computed(() => ({
  width: `${W.value}px`,
  height: `${H.value + 22}px`,  // +22 cho label bên dưới
}))

const isRunning = computed(() => nodeData.value.status === 'running')

const bodyFill = computed(() => {
  if (nodeData.value.status === 'fault') return '#ef4444'
  if (nodeData.value.status === 'running') return '#22c55e'
  return '#94a3b8'
})

const wheelBg = computed(() => {
  if (nodeData.value.status === 'fault') return '#fca5a5'
  if (nodeData.value.status === 'running') return '#86efac'
  return '#cbd5e1'
})

const bladeFill = computed(() => {
  if (nodeData.value.status === 'running') return 'rgba(255,255,255,0.85)'
  if (nodeData.value.status === 'fault') return 'rgba(255,200,200,0.85)'
  return 'rgba(255,255,255,0.55)'
})

const statusColor = computed(() => {
  if (nodeData.value.status === 'running') return '#22c55e'
  if (nodeData.value.status === 'fault') return '#ef4444'
  return '#94a3b8'
})

// X6 inject
const getNode = inject<() => any>('getNode', () => null)
let node: any = null

const syncFromNode = () => {
  const d = node?.getData()
  if (d) nodeData.value = { ...nodeData.value, ...d }
}

onMounted(() => {
  node = getNode?.()
  if (node) { syncFromNode(); node.on('change:data', syncFromNode) }
})
onBeforeUnmount(() => { node?.off('change:data', syncFromNode) })
</script>

<style scoped>
@reference "tailwindcss";

@keyframes fan-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.spinning {
  animation: fan-spin 0.8s linear infinite;
}

.node-port {
  @apply absolute w-2.5 h-2.5 bg-white rounded-full cursor-crosshair opacity-0 transition-opacity duration-200 z-20;
  border: 2px solid #0ea5e9;
}

div:hover>.node-port {
  @apply opacity-100;
}

.node-port:hover {
  transform: scale(1.8);
  @apply bg-blue-100 border-blue-600;
}

.port-left {
  left: -6px;
  top: 35%;
  transform: translateY(-50%);
}

.port-right {
  right: -6px;
  top: 35%;
  transform: translateY(-50%);
}

.port-top {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.port-bottom {
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
