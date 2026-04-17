# Tasks — nestjs-socket-monitor

## Task List

- [x] 1. Khởi tạo NestJS Backend Project
  - [x] 1.1 Tạo thư mục `backend/` ngang cấp với `x6/`, khởi tạo NestJS project với `@nestjs/cli` (hoặc tạo thủ công `package.json`, `tsconfig.json`, `src/main.ts`)
  - [x] 1.2 Cài đặt dependencies: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-socket.io`, `@nestjs/websockets`, `socket.io`, `reflect-metadata`, `rxjs`
  - [x] 1.3 Cài đặt dev dependencies: `typescript`, `ts-node`, `jest`, `@types/jest`, `ts-jest`, `fast-check`
  - [x] 1.4 Cấu hình `main.ts`: khởi động NestJS app tại port 3001, enable CORS cho origin `http://127.0.0.1:5555`, log thông báo khi sẵn sàng
  - [x] 1.5 Cấu hình error handling cho port binding failure: log lỗi chi tiết và `process.exit(1)`

- [x] 2. Định nghĩa Shared Types
  - [x] 2.1 Tạo `backend/src/shared/types.ts` với interfaces `DeviceUpdate` (`id`, `type`, `data`) và `ScadaFrame` (`timestamp`, `devices`)
  - [x] 2.2 Tạo `backend/src/shared/device-data.types.ts` với interfaces `FilterTankData`, `MotorBlowerData`, `ControlValveData`, `DataTagData` (mirror từ `x6/app/types/scada.ts`)
  - [x] 2.3 Tạo `x6/app/types/socket-monitor.ts` với cùng `DeviceUpdate` và `ScadaFrame` interfaces cho frontend sử dụng

- [x] 3. Implement SimulationService
  - [x] 3.1 Tạo `backend/src/simulation/simulation.service.ts` với `@Injectable()` decorator
  - [x] 3.2 Khởi tạo `state: Map<string, DeviceUpdate>` với 10 devices (filtr-1..4, vent-1..2, van-1..2, temp-01, pres-01) và initial values theo design
  - [x] 3.3 Implement `computeFilterStatus(voltage: number): 'chạy' | 'lỗi'` — pure function, export để test
  - [x] 3.4 Implement `computeBlowerStatus(statorTemp: number): 'running' | 'fault'` — pure function, export để test
  - [x] 3.5 Implement `tickFilterTank()`: voltage ±2 kV clamp [40,120], current ±50 mA clamp [0,1200], tính status
  - [x] 3.6 Implement `tickMotorBlower()`: statorTemp ±3°C clamp [0,200], current ±5 A clamp [0,500], bearingTemp ±2°C clamp [0,150], tính status
  - [x] 3.7 Implement `tickControlValve()`: openPercent ±5% clamp [0,100]
  - [x] 3.8 Implement `tickDataTag()`: value ±2.5
  - [x] 3.9 Implement `tick(): ScadaFrame` — gọi tất cả tick handlers, trả về ScadaFrame với timestamp và toàn bộ devices
  - [x] 3.10 Implement `getSnapshot(): ScadaFrame` — trả về trạng thái hiện tại không tính tick mới

- [x] 4. Implement MonitorGateway
  - [x] 4.1 Tạo `backend/src/monitor/monitor.gateway.ts` với `@WebSocketGateway(3001, { cors: { origin: 'http://127.0.0.1:5555' } })`
  - [x] 4.2 Inject `SimulationService`, khởi tạo `setInterval` 1500ms trong `afterInit()` để gọi `broadcastTick()`
  - [x] 4.3 Implement `handleConnection(client)`: gửi ngay `scada:frame` với `simulationService.getSnapshot()` đến client vừa kết nối
  - [x] 4.4 Implement `handleDisconnect(client)`: log disconnect, không dừng simulation
  - [x] 4.5 Implement `@SubscribeMessage('monitor:start') handleStart(client)`: thêm client vào set `activeClients`
  - [x] 4.6 Implement `@SubscribeMessage('monitor:stop') handleStop(client)`: xóa client khỏi `activeClients`, gửi `scada:stopped` đến client đó
  - [x] 4.7 Implement `broadcastTick()`: gọi `simulationService.tick()`, emit `scada:frame` đến tất cả clients trong `activeClients` (chỉ khi có ít nhất 1 client)
  - [x] 4.8 Tạo `backend/src/monitor/monitor.module.ts` và `backend/src/app.module.ts`

- [x] 5. Implement useSocketMonitor Composable (Frontend)
  - [x] 5.1 Tạo `x6/app/composables/useSocketMonitor.ts`
  - [x] 5.2 Cài đặt `socket.io-client` vào `x6/package.json`
  - [x] 5.3 Khởi tạo Socket.IO client kết nối đến `http://localhost:3001` (lazy — chỉ kết nối khi `startMonitoring()` được gọi)
  - [x] 5.4 Implement `startMonitoring()`: kết nối socket nếu chưa kết nối, emit `monitor:start`, set `isMonitoring = true`
  - [x] 5.5 Implement `stopMonitoring()`: emit `monitor:stop`, lắng nghe `scada:stopped` rồi set `isMonitoring = false`
  - [x] 5.6 Implement handler cho `scada:frame`: với mỗi `DeviceUpdate` trong `frame.devices`, gọi `graph.getCellById(id)?.setData(data)`, log warning nếu node không tồn tại
  - [x] 5.7 Implement cập nhật `deviceStatuses` sau mỗi `scada:frame` nhận được
  - [x] 5.8 Implement connection timeout 5 giây: nếu không kết nối được, log warning và set `isMonitoring = false`
  - [x] 5.9 Implement `onUnmounted` hook: gọi `socket.disconnect()` để tránh memory leak
  - [x] 5.10 Export `{ isMonitoring, deviceStatuses, startMonitoring, stopMonitoring }`

- [x] 6. Tích hợp Frontend
  - [x] 6.1 Cập nhật `x6/app/components/GraphCanvas.vue` (hoặc component tương đương): thay thế `useScadaSimulation` bằng `useSocketMonitor`, truyền `getGraph` từ `useX6Graph`
  - [x] 6.2 Cập nhật `x6/app/pages/scada.vue` hoặc component cha: kết nối emit `start`/`stop` từ `ScadaToolbar` đến `startMonitoring()`/`stopMonitoring()` của `useSocketMonitor`
  - [x] 6.3 Đảm bảo `isMonitoring` từ `useSocketMonitor` được truyền vào `ScadaToolbar` prop
  - [x] 6.4 Đảm bảo `deviceStatuses` từ `useSocketMonitor` được truyền vào `ScadaLegend` component
  - [x] 6.5 Khi `isMonitoring` chuyển sang `true`: thêm CSS class `flow-active` lên tất cả industrial edges; khi chuyển sang `false`: xóa class đó

- [x] 7. Viết Tests Backend
  - [x] 7.1 Tạo `backend/src/simulation/simulation.service.spec.ts`: unit test `computeFilterStatus` với các giá trị biên (59.9, 60, 75, 90, 90.1)
  - [x] 7.2 Unit test `computeBlowerStatus` với các giá trị biên (84.9, 85, 85.1)
  - [x] 7.3 Unit test `getSnapshot()` trả về đúng 10 devices với đúng IDs
  - [x] 7.4 Tạo `backend/src/simulation/simulation.service.pbt.spec.ts`: property test (fast-check) cho Property 1 — FilterTank tick clamp invariant (≥100 runs)
  - [x] 7.5 Property test cho Property 2 — FilterTank status correctness (≥100 runs)
  - [x] 7.6 Property test cho Property 3 — MotorBlower tick clamp invariant (≥100 runs)
  - [x] 7.7 Property test cho Property 4 — MotorBlower status correctness (≥100 runs)
  - [x] 7.8 Property test cho Property 5 — ControlValve tick clamp invariant (≥100 runs)
  - [x] 7.9 Property test cho Property 6 — DataTag tick delta bound (≥100 runs)
  - [x] 7.10 Property test cho Property 7 — ScadaFrame completeness and structure (≥100 runs)
  - [x] 7.11 Tạo `backend/src/monitor/monitor.gateway.spec.ts`: unit test `handleConnection` gửi initial snapshot, `handleStop` gửi `scada:stopped`

- [x] 8. Viết Tests Frontend
  - [x] 8.1 Cài đặt `vitest`, `@vue/test-utils` vào `x6/` nếu chưa có
  - [x] 8.2 Tạo `x6/app/composables/useSocketMonitor.spec.ts`: mock `socket.io-client`, test `startMonitoring` emit `monitor:start`
  - [x] 8.3 Test `stopMonitoring` emit `monitor:stop` và set `isMonitoring = false` khi nhận `scada:stopped`
  - [x] 8.4 Test connection timeout 5 giây set `isMonitoring = false`
  - [x] 8.5 Test `onUnmounted` gọi `socket.disconnect()`
  - [x] 8.6 Property test (fast-check) cho Property 8 — Monitor_Client frame application: generate random ScadaFrame, mock X6 graph, kiểm tra `node.setData()` được gọi đúng (≥100 runs)
