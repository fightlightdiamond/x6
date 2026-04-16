<script lang="ts">
export function formatClock(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

defineProps<{ isMonitoring: boolean }>()
defineEmits<{ start: []; stop: [] }>()

const now = ref(new Date())
let clockInterval: ReturnType<typeof setInterval>

onMounted(() => {
  clockInterval = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(clockInterval)
})

const formattedClock = computed(() => formatClock(now.value))

const buttons = [
  { label: 'Uživatel', key: 'user' },
  { label: 'Alarmy', key: 'alarmy' },
  { label: 'Eventy', key: 'eventy' },
  { label: 'Info', key: 'info' },
  { label: 'Stop', key: 'stop' },
  { label: 'AutoPanel', key: 'autopanel' },
  { label: 'Obrazy', key: 'obrazy' },
  { label: 'Další', key: 'dalsi' },
  { label: 'Trendy', key: 'trendy' },
  { label: 'Alarm', key: 'alarm' },
  { label: 'Jazyk', key: 'jazyk' },
]
</script>

<template>
  <div :style="{
    height: '48px',
    background: '#1a1f2e',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '8px',
    flexShrink: '0',
  }">
    <!-- Status Badge (left) -->
    <div :style="{
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '700',
      color: 'white',
      minWidth: '60px',
      textAlign: 'center',
      background: isMonitoring ? '#22c55e' : '#ef4444',
    }">
      {{ isMonitoring ? 'AUTO' : 'STOP' }}
    </div>

    <!-- 11 Buttons (middle) -->
    <div :style="{ display: 'flex', flexDirection: 'row', gap: '4px' }">
      <template v-for="btn in buttons" :key="btn.key">
        <button v-if="btn.key === 'stop'" @click="$emit('stop')" :style="{
          background: '#2d3748',
          color: '#ef4444',
          border: '1px solid #ef4444',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '12px',
          cursor: 'pointer',
        }">
          {{ btn.label }}
        </button>
        <button v-else-if="btn.key === 'autopanel'" @click="$emit('start')" :style="{
          background: '#2d3748',
          color: '#22c55e',
          border: '1px solid #22c55e',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '12px',
          cursor: 'pointer',
        }">
          {{ btn.label }}
        </button>
        <button v-else :style="{
          background: '#2d3748',
          color: '#e2e8f0',
          border: '1px solid #4a5568',
          borderRadius: '4px',
          padding: '4px 10px',
          fontSize: '12px',
          cursor: 'pointer',
        }">
          {{ btn.label }}
        </button>
      </template>
    </div>

    <!-- Realtime Clock (right) -->
    <div :style="{
      color: '#94a3b8',
      fontSize: '13px',
      fontFamily: 'monospace',
      marginLeft: 'auto',
    }">
      {{ formattedClock }}
    </div>
  </div>
</template>
