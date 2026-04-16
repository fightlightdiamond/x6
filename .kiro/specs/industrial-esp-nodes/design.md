# Design: Hệ thống Node Thiết bị Công nghiệp ESP

## Kiến trúc tổng thể

Hệ thống mở rộng theo đúng pattern hiện có của dự án: mỗi thiết bị là một **Vue 3 Component độc lập**, được bọc thành **X6 Vue Shape** thông qua `@antv/x6-vue-shape`. Tất cả component đều hỗ trợ hai chế độ: standalone (Storybook) và embedded (X6 Graph).

```
AppSidebar.vue
    │ mousedown → startDrag()
    ▼
createNodeConfig(type)          ← nodeTemplates.ts
    │ graph.createNode(config)
    ▼
X6 Graph Canvas
    │ register() shape → Vue Component
    ▼
┌─────────────────────────────────────────────────────┐
│  FilterTankNode  │  MotorBlowerNode  │  ControlValve │
│  DataTagNode     │  IndicatorLight   │  StaticEquip  │
└─────────────────────────────────────────────────────┘
    │ inject('getNode') → node.getData() / node.on('change:data')
    ▼
useGraphMonitor.ts  ← simulation data updates
```

---

## Cấu trúc file mới

```
app/
  components/
    MotorBlowerNode.vue        ← REQ-02 (mới)
    ControlValveNode.vue       ← REQ-03 (mới)
    DataTagNode.vue            ← REQ-04 (mới)
    IndicatorLightNode.vue     ← REQ-05 (mới)
    StaticEquipmentNode.vue    ← REQ-06 (mới)
    FilterTankNode.vue         ← REQ-01 (nâng cấp file hiện có)
  utils/x6/
    registerNodes.ts           ← thêm 6 shape mới
    nodeTemplates.ts           ← thêm config + createIndustrialEdge()
    connectionRules.ts         ← thêm luật ESP
  composables/
    useGraphMonitor.ts         ← mở rộng simulation
  components/
    AppSidebar.vue             ← thêm nhóm "Hệ thống ESP"
```

---

## Chi tiết thiết kế từng Component

### 1. FilterTankNode.vue (nâng cấp)

**SVG Structure:**

```
<svg viewBox="0 0 100 140">
  <!-- Thân trụ -->
  <path d="M 5 25 L 5 115 A 45 15 0 0 0 95 115 L 95 25 Z" />
  <!-- Nắp trên (ellipse) -->
  <ellipse cx="50" cy="25" rx="45" ry="15" />
  <!-- Đáy (ellipse mờ) -->
  <ellipse cx="50" cy="115" rx="45" ry="15" opacity="0.6" />
  <!-- Highlight reflection -->
  <path d="M 12 33 L 12 108 ..." fill="rgba(255,255,255,0.15)" />
</svg>
```

**Computed colors:**

```ts
const cylinderFill = computed(
  () =>
    ({
      lỗi: "#ef4444",
      chạy: "#0ea5e9",
      dừng: "#94a3b8",
    })[status.value] ?? "#94a3b8",
);
```

**Thông số hiển thị:** Label tên (Filtr 1..4), U: xx.x kV, I: xxx mA, badge trạng thái

---

### 2. MotorBlowerNode.vue

**Layout:** Hình vuông, nền xanh lá gradient, cánh quạt SVG ở trung tâm, thông số ở dưới.

**SVG Cánh quạt (4 cánh):**

```
<g class="fan-blades" :class="{ 'spinning': isRunning }">
  <ellipse cx="50" cy="30" rx="12" ry="22" />  <!-- cánh 1 -->
  <ellipse cx="70" cy="50" rx="22" ry="12" />  <!-- cánh 2 (xoay 90°) -->
  <ellipse cx="50" cy="70" rx="12" ry="22" />  <!-- cánh 3 (xoay 180°) -->
  <ellipse cx="30" cy="50" rx="22" ry="12" />  <!-- cánh 4 (xoay 270°) -->
  <circle cx="50" cy="50" r="8" />             <!-- trục quạt -->
</g>
```

**CSS Animation:**

```css
@keyframes fan-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.spinning {
  transform-origin: 50px 50px;
  animation: fan-spin 1s linear infinite;
}
```

**Thông số hiển thị:** I: xx.x A, T-stator: xx°C, T-bearing: xx°C

---

### 3. ControlValveNode.vue

**SVG Van công nghiệp chuẩn (IEC/ISA symbol):**

```
<svg viewBox="0 0 80 80">
  <!-- Hai tam giác đối nhau (ký hiệu van) -->
  <polygon points="10,10 40,40 10,70" />   <!-- tam giác trái -->
  <polygon points="70,10 40,40 70,70" />   <!-- tam giác phải -->
  <!-- Vòng tròn ở giữa -->
  <circle cx="40" cy="40" r="12" />
  <!-- Cần van (stem) - xoay theo openPercent -->
  <line x1="40" y1="10" x2="40" y2="28"
        :transform="`rotate(${valveAngle}, 40, 40)`" />
</svg>
```

**Tính toán góc:**

```ts
// openPercent 0% → 0°, 100% → 90°
const valveAngle = computed(
  () => Math.max(0, Math.min(100, openPercent.value)) * 0.9,
);
```

**Màu sắc:**

- `openPercent === 0`: fill xám `#94a3b8`
- `openPercent > 0 && < 100`: fill xanh lá `#22c55e`
- `openPercent === 100`: fill xanh đậm `#0284c7`

---

### 4. DataTagNode.vue

**Layout:** Hình chữ nhật 120×60, 2 dòng.

```
┌─────────────────────┐
│ LABEL               │  ← text-xs uppercase, text-gray-400
│ 123.4  °C           │  ← font-mono text-xl font-bold
└─────────────────────┘
```

**Màu nền theo status:**

```ts
const bgClass = computed(
  () =>
    ({
      normal: "bg-slate-900",
      high: "bg-amber-700",
      low: "bg-amber-700",
      alarm: "bg-red-700 animate-pulse",
    })[status.value],
);
```

**Guard NaN/undefined:**

```ts
const displayValue = computed(() => {
  const v = value.value;
  if (v === null || v === undefined) return "---";
  if (typeof v === "number" && isNaN(v)) return "ERR";
  return String(v);
});
```

---

### 5. IndicatorLightNode.vue

**Layout:** Hình tròn LED + nhãn bên dưới.

```
    ●        ← SVG circle với radial gradient + glow filter
  LABEL      ← text-xs text-center
```

**SVG với glow filter:**

```xml
<defs>
  <filter id="glow">
    <feGaussianBlur stdDeviation="3" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<circle cx="30" cy="30" r="20"
  :filter="isOn ? 'url(#glow)' : 'none'"
  :fill="ledColor" />
```

**Màu LED:**

```ts
const ledColor = computed(() => {
  if (state.value === "off") return "#374151"; // xám tối
  return { green: "#22c55e", yellow: "#eab308", red: "#ef4444" }[color.value];
});
```

---

### 6. StaticEquipmentNode.vue

**SVG theo equipmentType:**

**Cyclone (phễu thu bụi):**

```xml
<svg viewBox="0 0 80 120">
  <!-- Thân hình thang -->
  <polygon points="10,10 70,10 55,80 25,80" fill="#64748b" />
  <!-- Phần nón dưới -->
  <polygon points="25,80 55,80 40,115" fill="#475569" />
  <!-- Ống xả trên -->
  <rect x="30" y="0" width="20" height="15" fill="#94a3b8" />
</svg>
```

**Chimney (ống khói):**

```xml
<svg viewBox="0 0 60 160">
  <!-- Thân ống khói (hình thang hơi loe) -->
  <polygon points="15,150 45,150 40,10 20,10" fill="#b45309" />
  <!-- Gạch texture (lines ngang) -->
  <line x1="15" y1="30" x2="45" y2="29" stroke="#92400e" stroke-width="1"/>
  <!-- ... thêm lines -->
  <!-- Miệng ống -->
  <rect x="12" y="5" width="36" height="8" fill="#92400e" />
</svg>
```

**Hopper (phễu tro):**

```xml
<svg viewBox="0 0 80 120">
  <!-- Thân hình thang ngược -->
  <polygon points="5,5 75,5 60,90 20,90" fill="#94a3b8" />
  <!-- Cổ xả -->
  <rect x="32" y="90" width="16" height="25" fill="#64748b" />
</svg>
```

---

## Thiết kế Industrial Edges

### Hàm createIndustrialEdge()

```ts
export const createIndustrialEdge = (
  type: "gas" | "clean-air" | "signal" = "gas",
) => {
  const styles = {
    gas: { stroke: "#64748b", strokeWidth: 4, dasharray: "8 4" },
    "clean-air": { stroke: "#0ea5e9", strokeWidth: 3, dasharray: "6 3" },
    signal: { stroke: "#f59e0b", strokeWidth: 2, dasharray: "4 4" },
  };
  const s = styles[type];
  return {
    shape: "edge",
    router: { name: "manhattan" },
    connector: { name: "rounded", args: { radius: 8 } },
    attrs: {
      line: {
        stroke: s.stroke,
        strokeWidth: s.strokeWidth,
        strokeDasharray: s.dasharray,
        targetMarker: null, // không mũi tên cho ống
      },
    },
    data: { edgeType: type, flowActive: false },
  };
};
```

### Flow Animation (CSS toàn cục trong GraphCanvas.vue)

```css
@keyframes flow-dash {
  to {
    stroke-dashoffset: -40;
  }
}
.flow-active line {
  animation: flow-dash 1s linear infinite;
}
```

Khi `isMonitoring === true`, `useGraphMonitor` thêm class `flow-active` vào tất cả industrial edges.

---

## Mở rộng connectionRules.ts

```ts
// Bảng luật kết nối ESP
const ESP_RULES: Record<string, string[]> = {
  "esp-filter-tank": [
    "control-valve",
    "motor-blower",
    "data-tag",
    "static-equipment",
  ],
  "motor-blower": ["static-equipment", "control-valve", "data-tag"],
  "control-valve": ["esp-filter-tank", "static-equipment", "data-tag"],
  "static-equipment": ["data-tag"],
  "data-tag": [
    "esp-filter-tank",
    "motor-blower",
    "control-valve",
    "static-equipment",
    "data-tag",
  ],
  "indicator-light": [], // không có đầu ra
};
```

---

## Mở rộng useGraphMonitor.ts

Thêm handler cho từng shape ESP trong vòng lặp simulation:

```ts
// Trong interval callback
graph.getNodes().forEach((node) => {
  const shape = node.shape;
  const data = node.getData() ?? {};

  if (shape === "esp-filter-tank") {
    node.setData({
      voltage: +(data.voltage + (Math.random() - 0.5) * 4).toFixed(1),
      current: Math.round(data.current + (Math.random() - 0.5) * 100),
    });
  }
  if (shape === "motor-blower") {
    node.setData({
      current: +(data.current + (Math.random() - 0.5) * 10).toFixed(1),
      statorTemp: +(data.statorTemp + (Math.random() - 0.5) * 6).toFixed(1),
      bearingTemp: +(data.bearingTemp + (Math.random() - 0.5) * 4).toFixed(1),
    });
  }
  if (shape === "control-valve") {
    node.setData({
      openPercent: Math.round(
        Math.max(
          0,
          Math.min(100, data.openPercent + (Math.random() - 0.5) * 10),
        ),
      ),
    });
  }
  if (shape === "data-tag") {
    node.setData({
      value: +(+data.value + (Math.random() - 0.5) * 5).toFixed(2),
    });
  }
});
```

---

## Đăng ký X6 Shapes (registerNodes.ts)

```ts
// 6 shape mới thêm vào registerAllVueNodes()
register({
  shape: "esp-filter-tank",
  width: 100,
  height: 140,
  component: FilterTankNode,
  ports: PORT_GROUPS,
});
register({
  shape: "motor-blower",
  width: 140,
  height: 140,
  component: MotorBlowerNode,
  ports: PORT_GROUPS,
});
register({
  shape: "control-valve",
  width: 80,
  height: 80,
  component: ControlValveNode,
  ports: PORT_GROUPS,
});
register({
  shape: "data-tag",
  width: 120,
  height: 60,
  component: DataTagNode,
  ports: PORT_GROUPS,
});
register({
  shape: "indicator-light",
  width: 60,
  height: 70,
  component: IndicatorLightNode,
  ports: PORT_GROUPS,
});
register({
  shape: "static-equipment",
  width: 80,
  height: 120,
  component: StaticEquipmentNode,
  ports: PORT_GROUPS,
});
```

Dùng chung `PORT_GROUPS` constant (top/bottom/left/right) đã định nghĩa sẵn.

---

## Shared Pattern: X6 Data Sync

Tất cả 6 component đều dùng cùng một pattern (giống DeviceNode.vue hiện có):

```ts
// Trong <script setup>
const getNode = inject<() => any>("getNode", () => null);
let node: any = null;

const syncFromNode = () => {
  const d = node?.getData();
  if (d) {
    /* gán vào các ref nội bộ */
  }
};

onMounted(() => {
  node = getNode?.();
  if (node) {
    syncFromNode();
    node.on("change:data", syncFromNode);
  }
});
onBeforeUnmount(() => {
  node?.off("change:data", syncFromNode);
});
```

---

## AppSidebar — Nhóm "Hệ thống ESP"

```html
<h3 class="mt-6 mb-3 font-bold border-t pt-4 text-blue-700">⚡ Hệ thống ESP</h3>
<!-- Bồn lọc ESP -->
<!-- Động cơ quạt (Ventilátor) -->
<!-- Van điều khiển -->
<!-- Tag thông số (SCADA) -->
<!-- Đèn báo LED -->
<!-- Phễu thu bụi (Cyclone) -->
<!-- Ống khói (Chimney) -->
```

Mỗi mục dùng `@mousedown="startDrag($event, type, label)"` giống pattern hiện có.
