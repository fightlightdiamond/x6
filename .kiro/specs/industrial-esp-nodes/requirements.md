# Requirements: Hệ thống Node Thiết bị Công nghiệp ESP (industrial-esp-nodes)

## Tổng quan

Mở rộng hệ thống AntV X6 hiện có (đang có DeviceNode IT và FilterTankNode cơ bản) bằng một bộ Vue Component node chuyên dụng cho hệ thống **Lọc bụi tĩnh điện (Electrostatic Precipitator - ESP)** trong môi trường công nghiệp. Hệ thống cho phép người dùng kéo thả, kết nối và giám sát trực quan các thiết bị trên sơ đồ P&ID dạng SCADA.

---

## Yêu cầu chức năng

### REQ-01: FilterTankNode — Bồn lọc ESP (Electrostatic Precipitator)

**Mô tả:** Node hình trụ màu xanh đại diện cho 4 bồn lọc bụi tĩnh điện (Filtr 1–4).

**Props:**
| Prop | Kiểu | Mặc định | Mô tả |
|------|------|----------|-------|
| `status` | `'chạy' \| 'dừng' \| 'lỗi'` | `'dừng'` | Trạng thái vận hành |
| `voltage` | `number` | `80.2` | Điện áp cao thế (kV) |
| `current` | `number` | `600` | Dòng điện (mA) |
| `label` | `string` | `'Filtr'` | Tên bồn (Filtr 1, 2, 3, 4) |

**Hiệu ứng:**

- Thân trụ màu xanh dương (`#0ea5e9`) khi đang chạy
- Thân trụ màu xám (`#94a3b8`) khi dừng
- Thân trụ màu đỏ + `animate-pulse` khi lỗi
- Viền phát sáng đỏ (drop-shadow glow) khi lỗi
- Badge trạng thái ở dưới bồn

**Kích thước X6:** width: 100, height: 140

---

### REQ-02: MotorBlowerNode — Động cơ quạt hút (Ventilátor)

**Mô tả:** Node biểu tượng động cơ + cánh quạt màu xanh lá, đại diện cho Ventilátor 1 và 2 (quạt lớn) và quạt hút nhỏ.

**Props:**
| Prop | Kiểu | Mặc định | Mô tả |
|------|------|----------|-------|
| `status` | `'running' \| 'stopped' \| 'fault'` | `'stopped'` | Trạng thái vận hành |
| `current` | `number` | `50.5` | Dòng điện (A) |
| `statorTemp` | `number` | `65` | Nhiệt độ cuộn stator (°C) |
| `bearingTemp` | `number` | `45` | Nhiệt độ bạc đạn (°C) |
| `label` | `string` | `'Ventilátor'` | Tên thiết bị |
| `size` | `'small' \| 'large'` | `'large'` | Kích thước quạt |

**Hiệu ứng:**

- CSS `@keyframes spin` cho cánh quạt SVG khi `status === 'running'`
- Màu xanh lá (`#22c55e`) khi running, xám khi stopped, đỏ khi fault
- Hiển thị thông số dòng điện và nhiệt độ trong node

**Kích thước X6:** large: width: 140, height: 140 / small: width: 100, height: 100

---

### REQ-03: ControlValveNode — Van điều khiển

**Mô tả:** Node biểu tượng van công nghiệp chuẩn (hình tròn có gạch chéo), hiển thị % độ mở.

**Props:**
| Prop | Kiểu | Mặc định | Mô tả |
|------|------|----------|-------|
| `mode` | `'AUTO' \| 'MANUAL'` | `'AUTO'` | Chế độ điều khiển |
| `openPercent` | `number` | `0` | Độ mở van (0–100%) |
| `label` | `string` | `'Van'` | Tên van |

**Hiệu ứng:**

- Gạch chéo SVG xoay góc tương ứng với `openPercent` (0% = ngang, 100% = dọc)
- Màu xanh lá khi `openPercent > 0`, xám khi `openPercent === 0`
- Badge hiển thị `AUTO` / `MANUAL` và `%` độ mở
- Transition mượt khi thay đổi góc

**Kích thước X6:** width: 80, height: 80

---

### REQ-04: DataTagNode — Block hiển thị thông số (SCADA Tag)

**Mô tả:** Ô hình chữ nhật nền đen chữ trắng kiểu SCADA, là node độc lập có thể kéo thả tự do trên canvas để hiển thị bất kỳ thông số nào.

**Props:**
| Prop | Kiểu | Mặc định | Mô tả |
|------|------|----------|-------|
| `label` | `string` | `'TAG'` | Tên tag/thông số |
| `value` | `number \| string` | `0` | Giá trị hiển thị |
| `unit` | `string` | `''` | Đơn vị (°C, kPa, A, kV...) |
| `status` | `'normal' \| 'high' \| 'low' \| 'alarm'` | `'normal'` | Trạng thái ngưỡng |

**Hiệu ứng:**

- Nền đen (`#0f172a`) chữ trắng khi `normal`
- Nền vàng (`#ca8a04`) khi `high` hoặc `low`
- Nền đỏ nhấp nháy (`animate-pulse`) khi `alarm`
- Font monospace cho giá trị số

**Kích thước X6:** width: 120, height: 60

---

### REQ-05: IndicatorLightNode — Đèn báo trạng thái (LED Indicator)

**Mô tả:** Cụm đèn LED tròn hiển thị trạng thái on/off/fault, tương tự đèn báo trên tủ điện.

**Props:**
| Prop | Kiểu | Mặc định | Mô tả |
|------|------|----------|-------|
| `state` | `'on' \| 'off' \| 'fault'` | `'off'` | Trạng thái đèn |
| `color` | `'green' \| 'yellow' \| 'red'` | `'green'` | Màu đèn |
| `label` | `string` | `''` | Nhãn bên dưới đèn |

**Hiệu ứng:**

- Đèn sáng + glow effect khi `state === 'on'`
- `animate-ping` (nhấp nháy) khi `state === 'fault'`
- Đèn tối/xám khi `state === 'off'`

**Kích thước X6:** width: 60, height: 70

---

### REQ-06: StaticEquipmentNode — Thiết bị tĩnh (Cyclone, Chimney, Hopper)

**Mô tả:** Node chứa SVG tĩnh cho các thiết bị không có dữ liệu động: Phễu thu bụi (Cyclone/Hopper) và Ống khói (Chimney).

**Props:**
| Prop | Kiểu | Mặc định | Mô tả |
|------|------|----------|-------|
| `equipmentType` | `'cyclone' \| 'chimney' \| 'hopper'` | `'cyclone'` | Loại thiết bị |
| `label` | `string` | `''` | Nhãn hiển thị |

**Thiết kế SVG:**

- `cyclone`: Hình nón ngược màu xám/xanh lam (phễu thu bụi)
- `chimney`: Hình trụ gạch đỏ (ống khói)
- `hopper`: Hình phễu hình thang ngược màu xám

**Kích thước X6:** cyclone/hopper: width: 80, height: 120 / chimney: width: 60, height: 160

---

### REQ-07: Hệ thống đường ống (Industrial Edges)

**Mô tả:** Cấu hình Edge của AntV X6 để mô phỏng đường ống công nghiệp.

**Yêu cầu:**

- Router `orthogonal` hoặc `manhattan` để tự động bẻ góc vuông
- CSS `stroke-dasharray` + `animation` tạo hiệu ứng dòng chảy (flow animation) khi hệ thống hoạt động
- Màu sắc phân loại:
  - Xám đậm (`#64748b`, stroke-width: 4): Ống khí chính
  - Xanh dương (`#0ea5e9`, stroke-width: 3): Ống khí sạch
  - Vàng (`#f59e0b`, stroke-width: 2): Đường tín hiệu điều khiển
- Không có mũi tên (hoặc mũi tên nhỏ) cho đường ống
- Hàm `createIndustrialEdge(type: 'gas' | 'clean-air' | 'signal')` trong `nodeTemplates.ts`

---

### REQ-08: Tích hợp vào hệ thống hiện có

**REQ-08.1 — registerNodes.ts:**

- Đăng ký 6 node mới với `@antv/x6-vue-shape`
- Tên shape: `esp-filter-tank`, `motor-blower`, `control-valve`, `data-tag`, `indicator-light`, `static-equipment`

**REQ-08.2 — nodeTemplates.ts:**

- Thêm `createNodeConfig()` cho từng loại node mới với data mặc định thực tế
- Thêm hàm `createIndustrialEdge()`

**REQ-08.3 — connectionRules.ts:**

- Mở rộng `validateConnection` để hỗ trợ luật kết nối ESP:
  - Bồn lọc → Van, Quạt, DataTag
  - Quạt → Ống khói, Van
  - Van → Bồn lọc, Cyclone
  - DataTag có thể kết nối với bất kỳ thiết bị nào (chỉ hiển thị)
  - IndicatorLight không có đầu ra

**REQ-08.4 — AppSidebar.vue:**

- Thêm nhóm mới **"Hệ thống ESP"** với các mục kéo thả:
  - Bồn lọc ESP (Filtr)
  - Động cơ quạt lớn (Ventilátor)
  - Van điều khiển
  - Tag thông số
  - Đèn báo
  - Phễu thu bụi (Cyclone)
  - Ống khói (Chimney)

**REQ-08.5 — useGraphMonitor.ts:**

- Mở rộng simulation để cập nhật data ngẫu nhiên cho các node ESP khi bật giám sát:
  - FilterTank: voltage ±2 kV, current ±50 mA
  - MotorBlower: current ±5 A, statorTemp ±3°C
  - ControlValve: openPercent thay đổi theo chu kỳ
  - DataTag: value thay đổi theo unit

---

## Yêu cầu phi chức năng

### PERF-01: Hiệu năng render

- Mỗi node Vue component phải render dưới 16ms (60fps)
- Không dùng `reactive()` sâu cho SVG animation — dùng CSS `@keyframes` thuần

### PERF-02: Tái sử dụng

- Mỗi component độc lập, có thể dùng trong Storybook mà không cần X6
- Props đủ để render đúng khi dùng standalone (không inject getNode)

### MAINT-01: Nhất quán code

- Tất cả component dùng Vue 3 Composition API + `<script setup lang="ts">`
- TailwindCSS v4 với `@reference "tailwindcss"` trong `<style scoped>`
- Pattern inject `getNode` từ X6 giống DeviceNode.vue hiện có

### A11Y-01: Accessibility

- Mỗi SVG có `role="img"` và `aria-label` mô tả thiết bị
- Màu sắc không phải là phương tiện duy nhất truyền đạt trạng thái (có text label kèm theo)

---

## Correctness Properties (Property-Based Testing)

### PROP-01: FilterTankNode — Màu sắc nhất quán với trạng thái

- **Bất biến:** Với mọi `status ∈ {'chạy', 'dừng', 'lỗi'}`, màu `cylinderFill` phải khác nhau và không bao giờ là `undefined`
- **Test:** Với 100 giá trị status ngẫu nhiên (bao gồm giá trị không hợp lệ), component không được crash và luôn render màu fallback

### PROP-02: ControlValveNode — Góc xoay hợp lệ

- **Bất biến:** `openPercent ∈ [0, 100]` → góc xoay SVG `∈ [0°, 90°]`
- **Test:** Với mọi `openPercent` ngoài khoảng [0, 100], component phải clamp về giá trị hợp lệ, không render góc âm hoặc > 90°

### PROP-03: DataTagNode — Hiển thị đúng đơn vị

- **Bất biến:** `value` + `unit` luôn hiển thị cùng nhau, không bao giờ hiển thị `undefined` hoặc `NaN`
- **Test:** Với mọi tổ hợp (value: number | string, unit: string), output text phải là chuỗi hợp lệ

### PROP-04: Edge Flow Animation — Chỉ chạy khi hệ thống active

- **Bất biến:** CSS class `flow-active` chỉ được thêm vào edge khi `isMonitoring === true`
- **Test:** Toggle monitoring on/off 50 lần, kiểm tra class được thêm/xóa đúng

---

## Phạm vi ngoài yêu cầu (Out of Scope)

- Kết nối backend/API thực tế (chỉ simulation)
- Lưu trữ lịch sử dữ liệu
- Xuất báo cáo PDF
- Xác thực người dùng
