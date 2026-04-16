<script setup lang="ts">
import type { DeviceStatus } from '~/types/scada'

defineProps<{ deviceStatuses: DeviceStatus[] }>()

function getIndicatorStyle(status: DeviceStatus['status']) {
  const colors: Record<string, string> = {
    running: '#22c55e',
    chạy: '#22c55e',
    stopped: '#64748b',
    dừng: '#64748b',
    fault: '#ef4444',
    lỗi: '#ef4444',
  }
  return { background: colors[status] ?? '#64748b' }
}

function isFault(status: DeviceStatus['status']) {
  return status === 'fault' || status === 'lỗi'
}
</script>

<template>
  <div style="
      position: fixed;
      bottom: 16px;
      right: 16px;
      background: rgba(10,14,26,0.85);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 12px;
      z-index: 100;
    ">
    <div style="
        color: #94a3b8;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      ">
      Stav zařízení
    </div>
    <div v-for="device in deviceStatuses" :key="device.id"
      style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
      <div :style="{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        flexShrink: 0,
        ...getIndicatorStyle(device.status),
      }" :class="{ 'animate-pulse': isFault(device.status) }" />
      <span style="color: #e2e8f0; font-size: 12px;">{{ device.label }}</span>
    </div>
  </div>
</template>

<style>
@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

.animate-pulse {
  animation: pulse 1s ease-in-out infinite;
}
</style>
