# Implementation Plan: Màn hình SCADA ESP Hoàn chỉnh (esp-scada-screen)

## Overview

Triển khai màn hình SCADA công nghiệp hoàn chỉnh theo thiết kế P&ID hai tầng (Odprášení). Các task được sắp xếp theo thứ tự phụ thuộc: types/interfaces → layout composable → simulation composable → UI components → SCADA page → tests.

## Tasks

- [x] 1. Định nghĩa types và interfaces dùng chung
  - Tạo file `app/types/scada.ts` chứa các interface: `ScadaNodeDef`, `ScadaEdgeDef`, `DeviceStatus`, `FilterTankData`, `MotorBlowerData`, `ControlValveData`, `DataTagData`, `StaticEquipmentData`
  - Export tất cả types để dùng trong composables và components
  - _Requirements: 3.1, 4.1, 5.1, 7.2, 8.2_

- [x] 2. Implement `useScadaLayout.ts` — bố cục P&ID cố định
  - [x] 2.1 Tạo file `app/composables/useScadaLayout.ts` với hàm `loadDemoLayout(graph)`
    - Import `createNodeConfig`, `createIndustrialEdge` từ `app/utils/x6/nodeTemplates.ts`
    - Gọi `graph.clearCells()` trước khi thêm node/edge mới (idempotence)
    - _Requirements: 3.1, 3.6_

  - [x] 2.2 Thêm 13 node với tọa độ P&ID cố định
    - Stage II (y ≈ 80): `filtr-1` (300,80), `filtr-2` (450,80), `filtr-3` (600,80), `filtr-4` (750,80), `hopper-1` (920,80)
    - Stage I (y ≈ 360–390): `cyclone-1` (80,380), `vent-1` (280,360), `vent-2` (500,360), `valve-1` (200,390), `valve-2` (420,390), `tag-temp` (680,370), `tag-pres` (680,450)
    - Chimney: `chimney-1` (1100,200)
    - Dùng `graph.addNode({ id, ...createNodeConfig(type, label), x, y, data: {...} })` cho từng node
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 2.3 Thêm các edge `clean-air` kết nối thiết bị theo luồng khí ESP
    - Kết nối Filtr 1–4 ngang hàng (port_right → port_left)
    - Kết nối Filtr 4 → Hopper (port_right → port_left)
    - Kết nối Cyclone → Valve-1 → Vent-1 → Vent-2 → Valve-2 → Chimney
    - Kết nối Stage I → Stage II (vent-2 port_top → filtr-1 port_bottom)
    - Dùng `createIndustrialEdge('clean-air')` cho tất cả edge
    - _Requirements: 3.5, 6.1, 6.4, 6.5_

  - [x] 2.4 Thêm stage label nodes (rect shape, no ports, no drag)
    - Label "Odprášení II.stupeň" tại (300, 30) — phía trên Stage II
    - Label "Odprášení I.stupeň" tại (80, 330) — phía trên Stage I
    - _Requirements: 4.5, 5.6_

  - [ ]\* 2.5 Viết property test cho layout idempotence (Property 3)
    - **Property 3: Demo layout is idempotent**
    - **Validates: Requirements 3.6, PROP-03**
    - Dùng `fc.integer({ min: 1, max: 5 })` để generate số lần gọi N
    - Tạo mock graph với `getNodes()` / `getEdges()` / `clearCells()` / `addNode()` / `addEdge()`
    - Assert `nodeCount === 13` và `edgeCount === EXPECTED_EDGE_COUNT` sau mỗi lần gọi
    - Tag: `// Feature: esp-scada-screen, Property 3: Demo layout is idempotent`

- [x] 3. Implement `useScadaSimulation.ts` — simulation với threshold detection
  - [x] 3.1 Tạo file `app/composables/useScadaSimulation.ts`
    - Import `DeviceStatus` từ `app/types/scada.ts`
    - Khai báo `isMonitoring = ref(false)` và `deviceStatuses = ref<DeviceStatus[]>([...])` với 6 thiết bị (filtr-1..4, vent-1..2) ở trạng thái `dừng`/`stopped`
    - Export `{ isMonitoring, deviceStatuses, startMonitoring, stopMonitoring }`
    - _Requirements: 8.1, 8.2, 7.2_

  - [x] 3.2 Implement `startMonitoring()` với setInterval 1500ms
    - Đặt `isMonitoring.value = true`
    - Khi start: set tất cả Filtr → `chạy`, tất cả Ventilátor → `running` trước tick đầu tiên
    - Kích hoạt flow animation trên tất cả edge (`edge.addClass('flow-active')`)
    - _Requirements: 8.3, 6.2_

  - [x] 3.3 Implement tick logic cho `esp-filter-tank` với threshold detection
    - `newVoltage = clamp(data.voltage + (Math.random() - 0.5) * 4, 40, 120)`
    - `newCurrent = clamp(data.current + (Math.random() - 0.5) * 100, 0, 1200)`
    - `newStatus = (newVoltage < 60 || newVoltage > 90) ? 'lỗi' : 'chạy'`
    - Bọc trong `try/catch`, log warning nếu lỗi
    - _Requirements: 4.2, 4.4, 8.5, 8.6_

  - [x] 3.4 Implement tick logic cho `motor-blower` với threshold detection
    - `newStatorTemp = clamp(data.statorTemp + (Math.random() - 0.5) * 6, 0, 200)`
    - `newCurrent = clamp(data.current + (Math.random() - 0.5) * 10, 0, 500)`
    - `newBearingTemp = clamp(data.bearingTemp + (Math.random() - 0.5) * 4, 0, 150)`
    - `newStatus = newStatorTemp > 85 ? 'fault' : 'running'`
    - Bọc trong `try/catch`
    - _Requirements: 5.2, 5.5, 8.5, 8.6_

  - [x] 3.5 Implement tick logic cho `control-valve` và `data-tag`
    - control-valve: `openPercent = clamp(data.openPercent + (Math.random() - 0.5) * 10, 0, 100)`
    - data-tag: `value = +(data.value + (Math.random() - 0.5) * 5).toFixed(2)`
    - _Requirements: 8.2_

  - [x] 3.6 Implement `stopMonitoring()` và cập nhật `deviceStatuses` sau mỗi tick
    - `stopMonitoring`: clearInterval, set `isMonitoring.value = false`, set tất cả Filtr → `dừng`, tất cả Ventilátor → `stopped`, xóa flow animation
    - Sau mỗi tick: đọc lại `node.getData().status` cho 6 thiết bị được theo dõi và cập nhật `deviceStatuses.value`
    - _Requirements: 8.4, 6.3, 7.3_

  - [ ]\* 3.7 Viết property test cho simulation data bounds (Property 4)
    - **Property 4: Simulation data stays within physical bounds**
    - **Validates: Requirements 4.2, 5.2, PROP-02**
    - Chạy tick logic 100 lần với dữ liệu khởi tạo ngẫu nhiên trong khoảng hợp lệ
    - Assert voltage ∈ [40, 120], current ∈ [0, 1200], statorTemp ∈ [0, 200]
    - Tag: `// Feature: esp-scada-screen, Property 4: Simulation data stays within physical bounds`

  - [ ]\* 3.8 Viết property test cho voltage threshold (Property 5)
    - **Property 5: Voltage threshold triggers fault status**
    - **Validates: Requirements 4.4, 8.5**
    - `fc.oneof(fc.float({ min: 40, max: 59.99 }), fc.float({ min: 90.01, max: 120 }))` → assert status === `'lỗi'`
    - `fc.float({ min: 60, max: 90 })` → assert status !== `'lỗi'`
    - Extract `computeFilterStatus(voltage)` thành pure function để test
    - Tag: `// Feature: esp-scada-screen, Property 5: Voltage threshold triggers fault status`

  - [ ]\* 3.9 Viết property test cho temperature threshold (Property 6)
    - **Property 6: Temperature threshold triggers fault status**
    - **Validates: Requirements 5.5, 8.5**
    - `fc.float({ min: 85.01, max: 200 })` → assert status === `'fault'`
    - `fc.float({ min: 0, max: 85 })` → assert status !== `'fault'`
    - Extract `computeBlowerStatus(statorTemp)` thành pure function để test
    - Tag: `// Feature: esp-scada-screen, Property 6: Temperature threshold triggers fault status`

- [x] 4. Checkpoint — Kiểm tra composables
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement `ScadaToolbar.vue`
  - [x] 5.1 Tạo file `app/components/ScadaToolbar.vue` với props và emits
    - `defineProps<{ isMonitoring: boolean }>()`
    - `defineEmits<{ start: []; stop: [] }>()`
    - Container: `height: 48px`, `background: #1a1f2e`, `display: flex`, `align-items: center`, `padding: 0 16px`
    - _Requirements: 2.1_

  - [x] 5.2 Render 11 nút theo thứ tự và wire Stop/AutoPanel emits
    - Thứ tự: Uživatel, Alarmy, Eventy, Info, **Stop**, **AutoPanel**, Obrazy, Další, Trendy, Alarm, Jazyk
    - Nút Stop: `@click="$emit('stop')"` — style nổi bật (border đỏ hoặc background khác)
    - Nút AutoPanel: `@click="$emit('start')"` — style nổi bật (border xanh lá)
    - Các nút còn lại: placeholder, không có handler
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 5.3 Implement Status Badge (trái) và Realtime Clock (phải)
    - Status Badge: `AUTO` với `background: #22c55e` khi `isMonitoring`, `STOP` với `background: #ef4444` khi không
    - Clock: `const now = ref(new Date())`, `setInterval(() => now.value = new Date(), 1000)` trong `onMounted`
    - `clearInterval` trong `onBeforeUnmount`
    - `formattedClock` computed: `DD.MM.YYYY HH:MM:SS` với `padStart(2, '0')`
    - _Requirements: 2.5, 2.6, 2.7, 10.3_

  - [ ]\* 5.4 Viết property test cho clock format (Property 1)
    - **Property 1: Clock format is always valid**
    - **Validates: Requirements 2.5**
    - Extract `formatClock(date: Date): string` thành pure function
    - `fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })` → assert `/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/.test(result)`
    - Tag: `// Feature: esp-scada-screen, Property 1: Clock format is always valid`

  - [ ]\* 5.5 Viết property test cho clock monotonicity (Property 2)
    - **Property 2: Clock values are monotonically non-decreasing**
    - **Validates: Requirements 2.7, PROP-01**
    - Dùng fake timers (vi.useFakeTimers), advance 10 × 1000ms, ghi lại timestamps
    - Assert `t[i+1] >= t[i]` với mọi i
    - Tag: `// Feature: esp-scada-screen, Property 2: Clock values are monotonically non-decreasing`

  - [ ]\* 5.6 Viết property test cho status badge consistency (Property 7)
    - **Property 7: Status badge is always consistent with simulation state**
    - **Validates: Requirements 2.3, 2.4, 2.6, PROP-04**
    - `fc.array(fc.boolean(), { minLength: 1, maxLength: 20 })` — sequence of isMonitoring values
    - Mount `ScadaToolbar` với mỗi giá trị, assert badge text và color khớp với `isMonitoring`
    - Tag: `// Feature: esp-scada-screen, Property 7: Status badge is always consistent with simulation state`

- [x] 6. Implement `ScadaLegend.vue`
  - [x] 6.1 Tạo file `app/components/ScadaLegend.vue`
    - `defineProps<{ deviceStatuses: DeviceStatus[] }>()`
    - Container: `position: fixed`, `bottom: 16px`, `right: 16px`, `background: rgba(10,14,26,0.85)`, `border: 1px solid rgba(255,255,255,0.1)`, `border-radius: 8px`, `padding: 12px`
    - Tiêu đề: "Stav zařízení"
    - _Requirements: 7.1, 7.5_

  - [x] 6.2 Render 6 device entries với color-coded indicator dots
    - Dùng `v-for` trên `deviceStatuses`
    - Indicator: `width: 10px`, `height: 10px`, `border-radius: 50%`
    - `running` / `chạy` → `background: #22c55e`
    - `stopped` / `dừng` → `background: #64748b`
    - `fault` / `lỗi` → `background: #ef4444` + class `animate-pulse`
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ]\* 6.3 Viết property test cho legend color mapping (Property 8)
    - **Property 8: Device legend colors always match node statuses**
    - **Validates: Requirements 7.3, 7.4, PROP-05**
    - `fc.constantFrom('running', 'stopped', 'fault', 'chạy', 'dừng', 'lỗi')` × 6
    - Mount `ScadaLegend` với array 6 statuses, assert mỗi indicator có đúng màu và class
    - Tag: `// Feature: esp-scada-screen, Property 8: Device legend colors always match node statuses`

- [x] 7. Implement `app/pages/scada.vue` — trang SCADA chính
  - [x] 7.1 Tạo file `app/pages/scada.vue` với `definePageMeta({ layout: false })`
    - Root element: `<div class="scada-root">` với `background: #0a0e1a`, `width: 100vw`, `height: 100vh`, `overflow: hidden`, `display: flex`, `flex-direction: column`
    - Import và render `<ScadaToolbar>`, graph container `<div ref="graphContainerRef" class="flex-1 relative">`, `<ScadaLegend>`
    - Không import `AppSidebar`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 7.2 Implement `initScadaGraph(container)` và lifecycle hooks
    - Tạo X6 `Graph` với: `autoResize: true`, `grid: { visible: false }`, `background: { color: '#0a0e1a' }`, `interacting: false`, `panning: { enabled: false }`, `mousewheel: { enabled: false }`, `connecting: { enabled: false }`, `selecting: { enabled: false }`
    - Gọi `registerAllVueNodes()` trước khi tạo graph
    - `onMounted`: `initScadaGraph(container)` → `loadDemoLayout(graph)` → `startMonitoring()`
    - `onBeforeUnmount`: `stopMonitoring()` → `graph.dispose()`
    - _Requirements: 1.4, 1.5, 9.4, 10.3, 10.4, 10.5_

  - [x] 7.3 Wire `ScadaToolbar` events và pass `deviceStatuses` xuống `ScadaLegend`
    - `<ScadaToolbar :is-monitoring="isMonitoring" @start="startMonitoring" @stop="stopMonitoring" />`
    - `<ScadaLegend :device-statuses="deviceStatuses" />`
    - Thêm nút "← Thiết kế" (link về `/`) ở toolbar hoặc overlay
    - _Requirements: 2.3, 2.4, 7.1, 9.5_

- [x] 8. Checkpoint cuối — Kiểm tra toàn bộ
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks đánh dấu `*` là optional và có thể bỏ qua để ra MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Property tests dùng **fast-check** (đã có trong dự án) với Vitest
- `computeFilterStatus` và `computeBlowerStatus` nên được extract thành pure functions trong `useScadaSimulation.ts` để dễ test
- `formatClock` nên được extract thành pure function trong `ScadaToolbar.vue` hoặc `app/utils/scada.ts`
- Tất cả property tests chạy tối thiểu 100 iterations (`numRuns: 100`)
- `interacting: false` trong X6 v2 disable toàn bộ node dragging và edge creation trong một lần
