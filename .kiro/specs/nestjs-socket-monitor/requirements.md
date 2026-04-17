# Requirements Document

## Introduction

Tính năng này bổ sung một NestJS backend service (đặt trong thư mục `backend/`) với WebSocket gateway để tạo và push dữ liệu giả lập SCADA theo thời gian thực đến frontend Nuxt.js (X6). Frontend nhận dữ liệu qua WebSocket và cập nhật trạng thái các node trên graph AntV X6 thay vì tự tính toán simulation nội bộ.

Hệ thống mô phỏng các thiết bị trong dây chuyền xử lý khí thải công nghiệp (ESP - Electrostatic Precipitator), bao gồm: bộ lọc tĩnh điện (Filtr 1–4), quạt thổi (Ventilátor 1–2), van điều khiển, và các cảm biến đo lường.

## Glossary

- **Monitor_Backend**: NestJS service chạy tại `backend/`, cung cấp WebSocket gateway và simulation engine.
- **WebSocket_Gateway**: Module NestJS xử lý kết nối Socket.IO, phát sóng dữ liệu đến clients.
- **Simulation_Engine**: Module NestJS tạo dữ liệu giả lập cho các thiết bị SCADA theo chu kỳ.
- **Monitor_Client**: Composable phía frontend Nuxt.js kết nối đến WebSocket_Gateway và nhận dữ liệu.
- **ScadaFrame**: Một bản snapshot dữ liệu tại một thời điểm, chứa trạng thái tất cả thiết bị.
- **FilterTank**: Node loại `esp-filter-tank` trên graph X6, đại diện cho bộ lọc tĩnh điện Filtr 1–4.
- **MotorBlower**: Node loại `motor-blower` trên graph X6, đại diện cho quạt thổi Ventilátor 1–2.
- **ControlValve**: Node loại `control-valve` trên graph X6, đại diện cho van điều khiển.
- **DataTag**: Node loại `data-tag` trên graph X6, đại diện cho cảm biến đo lường (nhiệt độ, áp suất, v.v.).
- **Tick_Interval**: Khoảng thời gian giữa hai lần phát dữ liệu liên tiếp, mặc định 1500ms.
- **CORS**: Cross-Origin Resource Sharing, cơ chế cho phép frontend truy cập backend từ origin khác. Frontend Nuxt.js chạy tại `http://127.0.0.1:5555` được cấu hình là allowed origin.

## Requirements

### Requirement 1: Khởi tạo NestJS Backend Service

**User Story:** As a developer, I want a standalone NestJS backend service, so that I can run it independently alongside the Nuxt.js frontend.

#### Acceptance Criteria

1. THE Monitor_Backend SHALL expose a WebSocket endpoint tại port 3001.
2. THE Monitor_Backend SHALL enable CORS cho origin `http://127.0.0.1:5555` để frontend Nuxt.js có thể kết nối.
3. THE Monitor_Backend SHALL sử dụng Socket.IO adapter cho WebSocket_Gateway.
4. WHEN Monitor_Backend khởi động, THE Monitor_Backend SHALL log thông báo xác nhận port và trạng thái sẵn sàng ra console.
5. IF Monitor_Backend không thể bind port 3001, THEN THE Monitor_Backend SHALL log lỗi chi tiết và thoát với exit code khác 0.

---

### Requirement 2: Simulation Engine — Tạo dữ liệu giả lập

**User Story:** As a system operator, I want the backend to continuously generate realistic SCADA simulation data, so that the frontend can display live process values.

#### Acceptance Criteria

1. THE Simulation_Engine SHALL tạo dữ liệu cho 4 FilterTank nodes với id `filtr-1`, `filtr-2`, `filtr-3`, `filtr-4`.
2. THE Simulation_Engine SHALL tạo dữ liệu cho 2 MotorBlower nodes với id `vent-1`, `vent-2`.
3. THE Simulation_Engine SHALL tạo dữ liệu cho ControlValve nodes với id `van-1`, `van-2`.
4. THE Simulation_Engine SHALL tạo dữ liệu cho DataTag nodes với id `temp-01`, `pres-01`.
5. WHEN Simulation_Engine tính toán FilterTank tick, THE Simulation_Engine SHALL thay đổi `voltage` trong khoảng ±2 kV mỗi tick, clamp trong [40, 120] kV.
6. WHEN Simulation_Engine tính toán FilterTank tick, THE Simulation_Engine SHALL thay đổi `current` trong khoảng ±50 mA mỗi tick, clamp trong [0, 1200] mA.
7. WHEN `voltage` của FilterTank nằm ngoài khoảng [60, 90] kV, THE Simulation_Engine SHALL đặt `status` của FilterTank thành `"lỗi"`.
8. WHILE `voltage` của FilterTank nằm trong khoảng [60, 90] kV, THE Simulation_Engine SHALL đặt `status` của FilterTank thành `"chạy"`.
9. WHEN Simulation_Engine tính toán MotorBlower tick, THE Simulation_Engine SHALL thay đổi `statorTemp` trong khoảng ±3°C mỗi tick, clamp trong [0, 200]°C.
10. WHEN Simulation_Engine tính toán MotorBlower tick, THE Simulation_Engine SHALL thay đổi `current` trong khoảng ±5 A mỗi tick, clamp trong [0, 500] A.
11. WHEN Simulation_Engine tính toán MotorBlower tick, THE Simulation_Engine SHALL thay đổi `bearingTemp` trong khoảng ±2°C mỗi tick, clamp trong [0, 150]°C.
12. WHEN `statorTemp` của MotorBlower vượt quá 85°C, THE Simulation_Engine SHALL đặt `status` của MotorBlower thành `"fault"`.
13. WHILE `statorTemp` của MotorBlower không vượt quá 85°C, THE Simulation_Engine SHALL đặt `status` của MotorBlower thành `"running"`.
14. WHEN Simulation_Engine tính toán ControlValve tick, THE Simulation_Engine SHALL thay đổi `openPercent` trong khoảng ±5% mỗi tick, clamp trong [0, 100].
15. WHEN Simulation_Engine tính toán DataTag tick, THE Simulation_Engine SHALL thay đổi `value` trong khoảng ±2.5 đơn vị mỗi tick.

---

### Requirement 3: WebSocket Gateway — Phát dữ liệu theo chu kỳ

**User Story:** As a frontend developer, I want the backend to push SCADA data frames at regular intervals, so that the graph updates in real time without polling.

#### Acceptance Criteria

1. THE WebSocket_Gateway SHALL phát sự kiện `scada:frame` đến tất cả clients đang kết nối theo chu kỳ Tick_Interval (1500ms).
2. THE WebSocket_Gateway SHALL đóng gói toàn bộ trạng thái thiết bị trong một ScadaFrame duy nhất mỗi tick.
3. THE ScadaFrame SHALL có cấu trúc: `{ timestamp: number, devices: DeviceUpdate[] }` trong đó mỗi `DeviceUpdate` có dạng `{ id: string, type: string, data: object }`.
4. WHEN không có client nào kết nối, THE WebSocket_Gateway SHALL tiếp tục chạy Simulation_Engine nhưng không phát sự kiện.
5. WHEN một client kết nối lần đầu, THE WebSocket_Gateway SHALL gửi ngay một ScadaFrame với trạng thái hiện tại (initial snapshot) đến client đó.
6. THE WebSocket_Gateway SHALL lắng nghe sự kiện `monitor:start` từ client để bắt đầu phát dữ liệu đến client đó.
7. THE WebSocket_Gateway SHALL lắng nghe sự kiện `monitor:stop` từ client để dừng phát dữ liệu đến client đó.
8. WHEN client gửi sự kiện `monitor:stop`, THE WebSocket_Gateway SHALL gửi sự kiện `scada:stopped` xác nhận đến client đó.

---

### Requirement 4: Monitor_Client — Composable phía Frontend

**User Story:** As a frontend developer, I want a Vue composable that manages the WebSocket connection and applies received data to the X6 graph, so that I can replace the local simulation with backend-driven data.

#### Acceptance Criteria

1. THE Monitor_Client SHALL kết nối đến WebSocket_Gateway tại `http://localhost:3001` khi được khởi tạo.
2. WHEN Monitor_Client nhận sự kiện `scada:frame`, THE Monitor_Client SHALL cập nhật từng node trên X6 graph bằng cách gọi `node.setData(deviceUpdate.data)` cho node có id tương ứng.
3. THE Monitor_Client SHALL export hàm `startMonitoring()` để gửi sự kiện `monitor:start` đến WebSocket_Gateway và bắt đầu nhận dữ liệu.
4. THE Monitor_Client SHALL export hàm `stopMonitoring()` để gửi sự kiện `monitor:stop` đến WebSocket_Gateway và dừng nhận dữ liệu.
5. THE Monitor_Client SHALL export reactive property `isMonitoring` phản ánh trạng thái kết nối hiện tại.
6. IF WebSocket_Gateway không thể kết nối trong vòng 5 giây, THEN THE Monitor_Client SHALL log cảnh báo và đặt `isMonitoring` thành `false`.
7. WHEN component Vue sử dụng Monitor_Client bị unmount, THE Monitor_Client SHALL tự động ngắt kết nối WebSocket để tránh memory leak.
8. THE Monitor_Client SHALL export reactive property `deviceStatuses` chứa danh sách trạng thái thiết bị được đồng bộ từ ScadaFrame nhận được.

---

### Requirement 5: Định nghĩa kiểu dữ liệu chia sẻ (Shared Types)

**User Story:** As a developer, I want shared TypeScript type definitions for the WebSocket protocol, so that both backend and frontend use consistent data structures.

#### Acceptance Criteria

1. THE Monitor_Backend SHALL định nghĩa interface `DeviceUpdate` với các trường: `id: string`, `type: string`, `data: Record<string, unknown>`.
2. THE Monitor_Backend SHALL định nghĩa interface `ScadaFrame` với các trường: `timestamp: number`, `devices: DeviceUpdate[]`.
3. THE Monitor_Client SHALL sử dụng cùng định nghĩa `ScadaFrame` và `DeviceUpdate` khi parse dữ liệu nhận được từ WebSocket_Gateway.
4. THE Simulation_Engine SHALL serialize dữ liệu FilterTank theo interface `FilterTankData`: `{ label, status, voltage, current }`.
5. THE Simulation_Engine SHALL serialize dữ liệu MotorBlower theo interface `MotorBlowerData`: `{ label, status, current, statorTemp, bearingTemp }`.
6. THE Simulation_Engine SHALL serialize dữ liệu ControlValve theo interface `ControlValveData`: `{ label, mode, openPercent }`.
7. THE Simulation_Engine SHALL serialize dữ liệu DataTag theo interface `DataTagData`: `{ label, value, unit, status }`.

---

### Requirement 6: Tích hợp với ScadaToolbar và DeviceStatus

**User Story:** As a system operator, I want the Start/Stop monitoring buttons on the SCADA toolbar to control the backend WebSocket connection, so that the UI controls are consistent with the data source.

#### Acceptance Criteria

1. WHEN người dùng nhấn nút "Start Monitor" trên ScadaToolbar, THE Monitor_Client SHALL gọi `startMonitoring()` để kết nối và nhận dữ liệu từ WebSocket_Gateway.
2. WHEN người dùng nhấn nút "Stop Monitor" trên ScadaToolbar, THE Monitor_Client SHALL gọi `stopMonitoring()` để dừng nhận dữ liệu.
3. THE Monitor_Client SHALL cập nhật `deviceStatuses` sau mỗi ScadaFrame nhận được để ScadaLegend hiển thị trạng thái chính xác.
4. WHILE `isMonitoring` là `true`, THE Monitor_Client SHALL kích hoạt CSS class `flow-active` trên tất cả industrial edges của graph.
5. WHEN `isMonitoring` chuyển từ `true` sang `false`, THE Monitor_Client SHALL xóa CSS class `flow-active` khỏi tất cả industrial edges.
