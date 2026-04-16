# Tasks: industrial-esp-nodes

## Task List

- [x] 1. Nâng cấp FilterTankNode.vue cho ESP cao áp
  - [x] 1.1 Thêm prop `label` (string, default 'Filtr') và cập nhật prop `voltage` default thành 80.2, `current` default thành 600
  - [x] 1.2 Cập nhật SVG thân trụ: thêm ellipse đáy mờ, tăng chiều cao viewBox lên 140
  - [x] 1.3 Hiển thị `label` (tên bồn) ở đầu node thay vì text cứng "Bồn Lọc"
  - [x] 1.4 Đảm bảo computed `cylinderFill` có fallback cho status không hợp lệ (không crash)

- [x] 2. Tạo MotorBlowerNode.vue — Động cơ quạt hút
  - [x] 2.1 Tạo file `app/components/MotorBlowerNode.vue` với props: status, current, statorTemp, bearingTemp, label, size
  - [x] 2.2 Vẽ SVG cánh quạt 4 cánh (4 ellipse xoay quanh tâm) với trục quạt (circle)
  - [x] 2.3 Thêm CSS `@keyframes fan-spin` và class `.spinning` với `transform-origin` đúng tâm SVG
  - [x] 2.4 Hiển thị thông số I (A), T-stator (°C), T-bearing (°C) bên dưới cánh quạt
  - [x] 2.5 Đổi màu nền: xanh lá khi running, xám khi stopped, đỏ khi fault
  - [x] 2.6 Tích hợp pattern inject `getNode` để đồng bộ data từ X6

- [ ] 3. Tạo ControlValveNode.vue — Van điều khiển
  - [x] 3.1 Tạo file `app/components/ControlValveNode.vue` với props: mode, openPercent, label
  - [x] 3.2 Vẽ SVG ký hiệu van ISA: 2 tam giác đối nhau + vòng tròn giữa + cần van (stem line)
  - [x] 3.3 Tính `valveAngle = clamp(openPercent, 0, 100) * 0.9` và áp dụng `transform="rotate(angle, 40, 40)"` cho cần van
  - [x] 3.4 Đổi màu fill theo openPercent: xám (0%), xanh lá (>0%), xanh đậm (100%)
  - [x] 3.5 Hiển thị badge AUTO/MANUAL và % độ mở
  - [x] 3.6 Tích hợp pattern inject `getNode`

- [x] 4. Tạo DataTagNode.vue — Block thông số SCADA
  - [x] 4.1 Tạo file `app/components/DataTagNode.vue` với props: label, value, unit, status
  - [x] 4.2 Layout 2 dòng: dòng trên là label (text-xs uppercase), dòng dưới là value + unit (font-mono text-xl)
  - [x] 4.3 Computed `displayValue` guard NaN/null/undefined → hiển thị '---' hoặc 'ERR'
  - [x] 4.4 Computed `bgClass`: slate-900 (normal), amber-700 (high/low), red-700 + animate-pulse (alarm)
  - [x] 4.5 Tích hợp pattern inject `getNode`

- [x] 5. Tạo IndicatorLightNode.vue — Đèn báo LED
  - [x] 5.1 Tạo file `app/components/IndicatorLightNode.vue` với props: state, color, label
  - [x] 5.2 SVG circle với SVG `<filter id="glow">` (feGaussianBlur + feMerge) áp dụng khi state === 'on'
  - [x] 5.3 Thêm `animate-ping` overlay circle khi state === 'fault'
  - [x] 5.4 Màu LED: xám tối (#374151) khi off, màu theo prop `color` khi on/fault
  - [x] 5.5 Hiển thị label text bên dưới đèn
  - [x] 5.6 Tích hợp pattern inject `getNode`

- [x] 6. Tạo StaticEquipmentNode.vue — Thiết bị tĩnh
  - [x] 6.1 Tạo file `app/components/StaticEquipmentNode.vue` với props: equipmentType, label
  - [x] 6.2 SVG cyclone: thân hình thang + nón dưới + ống xả trên (màu xám/xanh lam)
  - [x] 6.3 SVG chimney: thân hình thang loe + đường kẻ gạch ngang + miệng ống (màu nâu đỏ)
  - [x] 6.4 SVG hopper: hình thang ngược + cổ xả hình chữ nhật (màu xám)
  - [x] 6.5 Dùng `v-if` / computed để chọn SVG theo `equipmentType`
  - [x] 6.6 Hiển thị label bên dưới SVG

- [x] 7. Cập nhật registerNodes.ts — Đăng ký 6 shape mới
  - [x] 7.1 Import 5 component mới (MotorBlowerNode, ControlValveNode, DataTagNode, IndicatorLightNode, StaticEquipmentNode)
  - [x] 7.2 Định nghĩa constant `PORT_GROUPS` dùng chung cho tất cả shape (top/bottom/left/right)
  - [x] 7.3 Đăng ký `esp-filter-tank` (100×140) thay thế `filter-tank-node` cũ, giữ backward compat
  - [x] 7.4 Đăng ký `motor-blower` (large: 140×140), `control-valve` (80×80), `data-tag` (120×60)
  - [x] 7.5 Đăng ký `indicator-light` (60×70), `static-equipment` (80×120)

- [x] 8. Cập nhật nodeTemplates.ts — Config mặc định và Industrial Edges
  - [x] 8.1 Thêm case `'esp-filter-tank'` với data: { label: 'Filtr 1', status: 'chạy', voltage: 80.2, current: 600 }
  - [x] 8.2 Thêm case `'motor-blower'` với data: { label: 'Ventilátor 1', status: 'stopped', current: 50.5, statorTemp: 65, bearingTemp: 45, size: 'large' }
  - [x] 8.3 Thêm case `'control-valve'` với data: { label: 'Van 1', mode: 'AUTO', openPercent: 75 }
  - [x] 8.4 Thêm case `'data-tag'` với data: { label: 'TEMP-01', value: 123, unit: '°C', status: 'normal' }
  - [x] 8.5 Thêm case `'indicator-light'` với data: { label: 'RUN', state: 'off', color: 'green' }
  - [x] 8.6 Thêm case `'static-equipment'` với data: { equipmentType: 'cyclone', label: 'Cyclone 1' }
  - [x] 8.7 Tạo hàm `createIndustrialEdge(type: 'gas' | 'clean-air' | 'signal')` trả về edge config với router manhattan, connector rounded, stroke-dasharray theo type

- [x] 9. Cập nhật connectionRules.ts — Luật kết nối ESP
  - [x] 9.1 Định nghĩa `ESP_RULES` map: esp-filter-tank, motor-blower, control-valve, static-equipment, data-tag, indicator-light
  - [x] 9.2 Cập nhật hàm `validateConnection` để tra cứu `ESP_RULES` cho các node ESP
  - [x] 9.3 Đảm bảo luật IT cũ (case, monitor, mouse...) vẫn hoạt động bình thường (không regression)
  - [x] 9.4 DataTag được phép kết nối tới bất kỳ node nào (luật mở)
  - [x] 9.5 IndicatorLight không có đầu ra (return false khi là source)

- [x] 10. Cập nhật AppSidebar.vue — Nhóm "Hệ thống ESP"
  - [x] 10.1 Thêm `<h3>` phân cách với icon ⚡ và màu xanh dương cho nhóm ESP
  - [x] 10.2 Thêm 7 mục kéo thả: esp-filter-tank, motor-blower, control-valve, data-tag, indicator-light, cyclone (static-equipment), chimney (static-equipment)
  - [x] 10.3 Style mỗi mục với màu nền phù hợp (xanh cho ESP, xanh lá cho motor, vàng cho van...)

- [x] 11. Cập nhật useGraphMonitor.ts — Simulation ESP
  - [x] 11.1 Thêm handler cho `esp-filter-tank`: voltage ±2 kV, current ±50 mA mỗi tick
  - [x] 11.2 Thêm handler cho `motor-blower`: current ±5 A, statorTemp ±3°C, bearingTemp ±2°C
  - [x] 11.3 Thêm handler cho `control-valve`: openPercent thay đổi ±5%, clamp [0, 100]
  - [x] 11.4 Thêm handler cho `data-tag`: value thay đổi ±2.5 mỗi tick
  - [x] 11.5 Thêm/xóa CSS class `flow-active` trên tất cả industrial edges khi toggle monitoring

- [x] 12. Cập nhật GraphCanvas.vue — Flow animation CSS
  - [x] 12.1 Thêm `@keyframes flow-dash` vào `<style>` toàn cục
  - [x] 12.2 Thêm CSS rule `.flow-active line { animation: flow-dash 1s linear infinite; }`
  - [x] 12.3 Kiểm tra không conflict với `@keyframes ant-line` hiện có
