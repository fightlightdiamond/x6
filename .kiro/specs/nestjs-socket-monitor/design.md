# Design Document — nestjs-socket-monitor

## Overview

Tính năng này thêm một NestJS backend service (`backend/`) với WebSocket gateway (Socket.IO) để tạo và push dữ liệu giả lập SCADA theo thời gian thực đến frontend Nuxt.js. Frontend nhận dữ liệu qua composable `useSocketMonitor.ts` và cập nhật trạng thái các node trên AntV X6 graph, thay thế hoàn toàn logic simulation nội bộ hiện có trong `useScadaSimulation.ts` và `useGraphMonitor.ts`.

Kiến trúc tổng thể:

```
Frontend (Nuxt.js :5555)          Backend (NestJS :3001)
┌─────────────────────────┐       ┌──────────────────────────────┐
│  ScadaToolbar.vue       │       │  AppModule                   │
│  ↕ emit start/stop      │       │  ├── SimulationModule         │
│  GraphCanvas.vue        │       │  │   └── SimulationService    │
│  ↕ node.setData()       │       │  └── MonitorGateway           │
│  useSocketMonitor.ts    │◄─────►│      (Socket.IO WebSocket)   │
│  (Socket.IO client)     │       │                              │
└─────────────────────────┘       └──────────────────────────────┘
         Socket.IO events:
         client → server: monitor:start, monitor:stop
         server → client: scada:frame, scada:stopped
```

## Architecture

### Backend (`backend/`)

NestJS standalone application với hai module chính:

- **SimulationModule**: Chứa `SimulationService` — engine tính toán dữ liệu giả lập theo chu kỳ, không phụ thuộc vào WebSocket.
- **MonitorGateway**: NestJS WebSocket Gateway dùng Socket.IO adapter, lắng nghe kết nối client và phát `scada:frame` theo `Tick_Interval` (1500ms).

### Frontend (`x6/app/composables/useSocketMonitor.ts`)

Composable Vue 3 mới thay thế `useScadaSimulation.ts` + `useGraphMonitor.ts` cho luồng backend-driven:

- Quản lý Socket.IO client connection đến `http://localhost:3001`
- Nhận `scada:frame` và gọi `node.setData()` cho từng node trên X6 graph
- Export `startMonitoring()`, `stopMonitoring()`, `isMonitoring`, `deviceStatuses`

### Shared Types (`backend/src/shared/types.ts` và `x6/app/types/socket-monitor.ts`)

Định nghĩa `ScadaFrame`, `DeviceUpdate`, và các device data interfaces dùng chung giữa backend và frontend.

## Components and Interfaces

### Backend Components

#### `SimulationService` (NestJS Injectable)

```typescript
@Injectable()
export class SimulationService {
  private state: Map<string, DeviceUpdate>;

  getSnapshot(): ScadaFrame;
  tick(): ScadaFrame;

  // Internal tick handlers
  private tickFilterTank(id: string, data: FilterTankData): FilterTankData;
  private tickMotorBlower(id: string, data: MotorBlowerData): MotorBlowerData;
  private tickControlValve(
    id: string,
    data: ControlValveData,
  ): ControlValveData;
  private tickDataTag(id: string, data: DataTagData): DataTagData;
}
```

#### `MonitorGateway` (NestJS WebSocket Gateway)

```typescript
@WebSocketGateway(3001, { cors: { origin: 'http://127.0.0.1:5555' } })
export class MonitorGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  handleConnection(client: Socket): void      // gửi initial snapshot
  handleDisconnect(client: Socket): void

  @SubscribeMessage('monitor:start')
  handleStart(client: Socket): void           // thêm client vào broadcast list

  @SubscribeMessage('monitor:stop')
  handleStop(client: Socket): void            // gửi scada:stopped, xóa khỏi list

  // Internal: setInterval 1500ms → emit scada:frame
  private broadcastTick(): void
}
```

### Frontend Components

#### `useSocketMonitor.ts` (Vue Composable)

```typescript
export function useSocketMonitor(getGraph: () => Graph | null) {
  const isMonitoring: Ref<boolean>;
  const deviceStatuses: Ref<DeviceStatus[]>;

  function startMonitoring(): void;
  function stopMonitoring(): void;

  // Auto-disconnect on component unmount via onUnmounted()

  return { isMonitoring, deviceStatuses, startMonitoring, stopMonitoring };
}
```

#### Cập nhật `GraphCanvas.vue`

Thay thế `useScadaSimulation` bằng `useSocketMonitor`, truyền `getGraph` từ `useX6Graph`.

#### Cập nhật `ScadaToolbar.vue`

Giữ nguyên interface props/emits hiện tại (`isMonitoring`, emit `start`/`stop`).

## Data Models

### Shared Protocol Types

```typescript
// Dùng ở cả backend và frontend

export interface DeviceUpdate {
  id: string;
  type: string; // 'esp-filter-tank' | 'motor-blower' | 'control-valve' | 'data-tag'
  data: Record<string, unknown>;
}

export interface ScadaFrame {
  timestamp: number; // Date.now()
  devices: DeviceUpdate[];
}
```

### Device Data Interfaces (tái sử dụng từ `x6/app/types/scada.ts`)

```typescript
// FilterTankData: { label, status: 'chạy'|'lỗi', voltage: number, current: number }
// MotorBlowerData: { label, status: 'running'|'fault', current, statorTemp, bearingTemp }
// ControlValveData: { label, mode: 'AUTO'|'MANUAL', openPercent: number }
// DataTagData: { label, value, unit, status: 'normal'|'warning'|'alarm' }
```

### Initial Simulation State

| ID           | Type            | Initial Values                                                   |
| ------------ | --------------- | ---------------------------------------------------------------- |
| `filtr-1..4` | esp-filter-tank | voltage: 75, current: 600, status: 'chạy'                        |
| `vent-1..2`  | motor-blower    | current: 120, statorTemp: 60, bearingTemp: 45, status: 'running' |
| `van-1..2`   | control-valve   | mode: 'AUTO', openPercent: 50                                    |
| `temp-01`    | data-tag        | value: 65.0, unit: '°C', status: 'normal'                        |
| `pres-01`    | data-tag        | value: 101.3, unit: 'kPa', status: 'normal'                      |

### Simulation Tick Rules

| Device       | Field       | Delta                                     | Clamp     |
| ------------ | ----------- | ----------------------------------------- | --------- |
| FilterTank   | voltage     | ±2 kV                                     | [40, 120] |
| FilterTank   | current     | ±50 mA                                    | [0, 1200] |
| FilterTank   | status      | voltage ∈ [60,90] → 'chạy', else 'lỗi'    | —         |
| MotorBlower  | statorTemp  | ±3°C                                      | [0, 200]  |
| MotorBlower  | current     | ±5 A                                      | [0, 500]  |
| MotorBlower  | bearingTemp | ±2°C                                      | [0, 150]  |
| MotorBlower  | status      | statorTemp > 85 → 'fault', else 'running' | —         |
| ControlValve | openPercent | ±5%                                       | [0, 100]  |
| DataTag      | value       | ±2.5                                      | none      |

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: FilterTank tick clamp invariant

_For any_ FilterTank state với voltage trong [40, 120] và current trong [0, 1200], sau một lần gọi `tickFilterTank()`, voltage mới phải nằm trong [40, 120] kV và current mới phải nằm trong [0, 1200] mA.

**Validates: Requirements 2.5, 2.6**

### Property 2: FilterTank status correctness

_For any_ voltage value, `computeFilterStatus(voltage)` phải trả về `"chạy"` khi và chỉ khi voltage nằm trong [60, 90], và trả về `"lỗi"` trong mọi trường hợp còn lại.

**Validates: Requirements 2.7, 2.8**

### Property 3: MotorBlower tick clamp invariant

_For any_ MotorBlower state với statorTemp trong [0, 200], current trong [0, 500], bearingTemp trong [0, 150], sau một lần gọi `tickMotorBlower()`, tất cả ba giá trị mới phải vẫn nằm trong khoảng clamp tương ứng.

**Validates: Requirements 2.9, 2.10, 2.11**

### Property 4: MotorBlower status correctness

_For any_ statorTemp value, `computeBlowerStatus(statorTemp)` phải trả về `"fault"` khi và chỉ khi statorTemp > 85, và trả về `"running"` trong mọi trường hợp còn lại.

**Validates: Requirements 2.12, 2.13**

### Property 5: ControlValve tick clamp invariant

_For any_ ControlValve state với openPercent trong [0, 100], sau một lần gọi `tickControlValve()`, openPercent mới phải nằm trong [0, 100].

**Validates: Requirements 2.14**

### Property 6: DataTag tick delta bound

_For any_ DataTag state với value v, sau một lần gọi `tickDataTag()`, giá trị mới `v'` phải thỏa mãn `|v' - v| <= 2.5`.

**Validates: Requirements 2.15**

### Property 7: ScadaFrame completeness and structure

_For any_ trạng thái simulation, `SimulationService.tick()` phải trả về một `ScadaFrame` có `timestamp` là số nguyên dương và `devices` là mảng chứa đúng 10 `DeviceUpdate` (4 filtr + 2 vent + 2 van + 2 data-tag), mỗi phần tử có `id`, `type`, và `data` hợp lệ.

**Validates: Requirements 3.2, 3.3**

### Property 8: Monitor_Client frame application

_For any_ `ScadaFrame` nhận được từ WebSocket, `useSocketMonitor` phải gọi `node.setData(deviceUpdate.data)` cho mỗi `DeviceUpdate` trong `frame.devices`, và `deviceStatuses` phải được cập nhật để phản ánh trạng thái mới nhất từ frame đó.

**Validates: Requirements 4.2, 6.3**

## Error Handling

### Backend

| Tình huống                           | Xử lý                                                               |
| ------------------------------------ | ------------------------------------------------------------------- |
| Port 3001 đã bị chiếm                | Log lỗi chi tiết, `process.exit(1)`                                 |
| Client ngắt kết nối đột ngột         | `handleDisconnect` xóa client khỏi danh sách, simulation tiếp tục   |
| Lỗi trong `SimulationService.tick()` | Try/catch per-device, log warning, bỏ qua device lỗi, tiếp tục tick |

### Frontend

| Tình huống                                                   | Xử lý                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------- |
| Không kết nối được trong 5 giây                              | Log warning, `isMonitoring.value = false`                           |
| `scada:frame` nhận được với node ID không tồn tại trên graph | Log warning, bỏ qua node đó, tiếp tục xử lý các node còn lại        |
| Component unmount khi đang monitoring                        | `onUnmounted` gọi `socket.disconnect()` tự động                     |
| Backend ngắt kết nối đột ngột                                | Socket.IO auto-reconnect (3 lần), sau đó set `isMonitoring = false` |

## Testing Strategy

### Backend (NestJS)

**Unit tests** (Jest — đã có sẵn trong NestJS):

- `SimulationService`: Test `tickFilterTank`, `tickMotorBlower`, `tickControlValve`, `tickDataTag` với các giá trị biên
- `computeFilterStatus`, `computeBlowerStatus`: Test với các giá trị biên (59.9, 60, 90, 90.1)
- `MonitorGateway`: Test `handleConnection` gửi initial snapshot, `handleStop` gửi `scada:stopped`

**Property-based tests** (fast-check — cài thêm vào backend):

- Mỗi property test chạy tối thiểu 100 iterations
- Test các Properties 1–7 được định nghĩa ở trên
- Tag format: `// Feature: nestjs-socket-monitor, Property N: <property_text>`

**Integration tests**:

- Khởi động NestJS test app, kết nối Socket.IO client thật, kiểm tra `scada:frame` được nhận sau 1500ms
- Kiểm tra `monitor:stop` → `scada:stopped` flow

### Frontend (Vitest)

**Unit tests** (Vitest):

- `useSocketMonitor`: Mock `socket.io-client`, kiểm tra `startMonitoring`/`stopMonitoring` gửi đúng events
- Kiểm tra `onUnmounted` gọi `socket.disconnect()`
- Kiểm tra timeout 5 giây set `isMonitoring = false`

**Property-based tests** (fast-check):

- Property 8: Generate random `ScadaFrame`, mock X6 graph, kiểm tra `node.setData()` được gọi đúng số lần với đúng data

**PBT library**: `fast-check` (npm package, hỗ trợ cả Jest và Vitest)
