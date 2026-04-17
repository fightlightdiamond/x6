export interface DeviceUpdate {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface ScadaFrame {
  timestamp: number;
  devices: DeviceUpdate[];
}
