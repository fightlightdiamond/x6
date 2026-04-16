/**
 * Shared types and interfaces for the ESP SCADA screen.
 * Used by composables (useScadaLayout, useScadaSimulation) and components.
 */

// ─── Graph structure ──────────────────────────────────────────────────────────

export interface ScadaNodeDef {
  id: string;
  type: string; // shape name (e.g. 'esp-filter-tank', 'motor-blower')
  x: number;
  y: number;
  data: Record<string, any>;
}

export interface ScadaEdgeDef {
  source: { cell: string; port: string };
  target: { cell: string; port: string };
  edgeType: "clean-air" | "gas" | "signal";
}

// ─── Device status (used by Legend) ──────────────────────────────────────────

export interface DeviceStatus {
  id: string;
  label: string;
  status: "running" | "stopped" | "fault" | "chạy" | "dừng" | "lỗi";
}

// ─── Node data models ─────────────────────────────────────────────────────────

/** Data for esp-filter-tank nodes (Filtr 1–4) */
export interface FilterTankData {
  label: string; // "Filtr 1" | "Filtr 2" | "Filtr 3" | "Filtr 4"
  status: "chạy" | "dừng" | "lỗi";
  voltage: number; // kV, range [40, 120], normal [60, 90]
  current: number; // mA, range [0, 1200], normal ~600
}

/** Data for motor-blower nodes (Ventilátor 1–2) */
export interface MotorBlowerData {
  label: string; // "Ventilátor 1" | "Ventilátor 2"
  status: "running" | "stopped" | "fault";
  current: number; // A, range [0, 500], normal ~120
  statorTemp: number; // °C, range [0, 200], fault threshold: 85
  bearingTemp: number; // °C, range [0, 150]
  size: "large";
}

/** Data for control-valve nodes */
export interface ControlValveData {
  label: string; // "Van 1" | "Van 2"
  mode: "AUTO" | "MANUAL";
  openPercent: number; // [0, 100]
}

/** Data for data-tag nodes */
export interface DataTagData {
  label: string; // "TEMP-01" | "PRES-01"
  value: number;
  unit: string; // "°C" | "kPa" | "A"
  status: "normal" | "warning" | "alarm";
}

/** Data for static-equipment nodes (cyclone, chimney, hopper) */
export interface StaticEquipmentData {
  equipmentType: "cyclone" | "chimney" | "hopper";
  label: string;
}
