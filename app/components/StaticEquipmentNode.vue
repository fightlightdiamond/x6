<template>
  <div class="flex flex-col items-center">
    <!-- SVG Cyclone -->
    <svg v-if="equipmentType === 'cyclone'" viewBox="0 0 80 130" :width="80" :height="130" role="img"
      :aria-label="`Cyclone: ${label || 'Phễu thu bụi'}`">
      <!-- Ống vào khí (ngang, bên phải) -->
      <rect x="52" y="14" width="24" height="12" fill="#94a3b8" />
      <!-- Thân trụ tròn phía trên -->
      <rect x="15" y="8" width="40" height="55" rx="20" ry="20" fill="#64748b" />
      <!-- Đường xoáy cyclone -->
      <path d="M 35 18 Q 48 28 35 38 Q 22 48 35 58" fill="none" stroke="#94a3b8" stroke-width="2.5"
        stroke-linecap="round" />
      <!-- Nón nhọn phía dưới -->
      <polygon points="15,63 55,63 35,120" fill="#475569" />
      <!-- Ống xả bụi dưới cùng -->
      <rect x="30" y="118" width="10" height="10" fill="#334155" />
    </svg>

    <!-- SVG Chimney -->
    <svg v-else-if="equipmentType === 'chimney'" viewBox="0 0 60 160" :width="60" :height="160" role="img"
      :aria-label="`Chimney: ${label || 'Ống khói'}`">
      <!-- Khói bay ra (3 làn sóng) -->
      <path d="M 18 22 Q 12 14 18 8 Q 24 2 18 -4" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"
        opacity="0.7" />
      <path d="M 30 18 Q 24 10 30 4 Q 36 -2 30 -8" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"
        opacity="0.5" />
      <path d="M 42 22 Q 48 14 42 8 Q 36 2 42 -4" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"
        opacity="0.7" />
      <!-- Thân ống khói thẳng đứng (hình chữ nhật, hơi loe đáy) -->
      <polygon points="18,150 42,150 40,25 20,25" fill="#b45309" />
      <!-- Gạch texture (lines ngang) -->
      <line x1="19" y1="45" x2="41" y2="44" stroke="#92400e" stroke-width="1.5" />
      <line x1="19" y1="65" x2="41" y2="64" stroke="#92400e" stroke-width="1.5" />
      <line x1="19" y1="85" x2="41" y2="84" stroke="#92400e" stroke-width="1.5" />
      <line x1="19" y1="105" x2="41" y2="104" stroke="#92400e" stroke-width="1.5" />
      <line x1="19" y1="125" x2="41" y2="124" stroke="#92400e" stroke-width="1.5" />
      <!-- Miệng ống (viền dày) -->
      <rect x="16" y="20" width="28" height="8" rx="1" fill="#92400e" />
      <!-- Chân đế -->
      <rect x="14" y="148" width="32" height="6" rx="1" fill="#78350f" />
    </svg>

    <!-- SVG Hopper / Water Tank -->
    <svg v-else viewBox="0 0 80 120" :width="80" :height="120" role="img"
      :aria-label="`Water tank: ${label || 'Bồn nước'}`">
      <!-- Thân bồn hình trụ -->
      <rect x="10" y="10" width="60" height="75" rx="6" ry="6" fill="#475569" stroke="#334155" stroke-width="1.5" />
      <!-- Nắp trên (ellipse) -->
      <ellipse cx="40" cy="10" rx="30" ry="8" fill="#64748b" stroke="#334155" stroke-width="1.5" />
      <!-- Nước bên trong (xanh dương, mức ~60%) -->
      <clipPath id="tank-clip">
        <rect x="11" y="11" width="58" height="73" rx="5" />
      </clipPath>
      <rect x="11" y="40" width="58" height="44" fill="#0ea5e9" opacity="0.75" clip-path="url(#tank-clip)" />
      <!-- Sóng nước -->
      <path d="M 11 40 Q 25 35 40 40 Q 55 45 69 40" fill="none" stroke="#38bdf8" stroke-width="1.5"
        clip-path="url(#tank-clip)" />
      <!-- Highlight thân bồn -->
      <rect x="14" y="14" width="10" height="60" rx="4" fill="rgba(255,255,255,0.12)" />
      <!-- Đáy bồn -->
      <ellipse cx="40" cy="85" rx="30" ry="8" fill="#3f5068" stroke="#334155" stroke-width="1" />
      <!-- Ống xả dưới -->
      <rect x="33" y="90" width="14" height="20" fill="#334155" stroke="#1e293b" stroke-width="1" />
      <!-- Van xả nhỏ -->
      <rect x="30" y="105" width="20" height="6" rx="2" fill="#1e293b" />
    </svg>

    <!-- Label bên dưới SVG -->
    <span v-if="label" class="mt-1 text-xs font-medium text-center leading-tight max-w-[80px] break-words"
      style="color: #cbd5e1;">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, onBeforeUnmount } from 'vue';

// Inject getNode từ X6 (cùng pattern với DeviceNode.vue)
const getNode = inject<() => any>('getNode', () => null);
let node: any = null;

const equipmentType = ref<'cyclone' | 'chimney' | 'hopper'>('cyclone');
const label = ref('');

const syncFromNode = () => {
  const data = node?.getData();
  if (!data) return;
  if (data.equipmentType) equipmentType.value = data.equipmentType;
  if (data.label !== undefined) label.value = data.label;
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
