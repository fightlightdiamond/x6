export interface ThresholdEntry {
  min: number;
  max: number;
  color: string; // hex color, e.g. '#22c55e'
  label: string; // e.g. 'Bình thường'
}

export interface NodeFormData {
  // Common (all nodes)
  label: string;

  // Conditional: node with unit
  unit?: string;

  // Conditional: control-valve
  mode?: "AUTO" | "MANUAL";
  openPercent?: number;

  // Conditional: indicator-light
  color?: "green" | "yellow" | "red" | "blue";
  state?: "on" | "off";

  // Conditional: esp-filter-tank
  voltage?: number;
  current?: number;

  // Conditional: motor-blower
  statorTemp?: number;
  bearingTemp?: number;

  // Conditional: data-tag
  value?: number;
  status?: "normal" | "warning" | "alarm";

  // Conditional: nodes supporting threshold
  thresholds?: ThresholdEntry[];

  // Rotate & Resize
  angle?: number; // Rotation_Angle: 0–359 degrees
  width?: number; // Node width in pixels: MIN_WIDTH–MAX_WIDTH
  height?: number; // Node height in pixels: MIN_HEIGHT–MAX_HEIGHT
}

const DEFAULT_THRESHOLDS: ThresholdEntry[] = [
  { min: 0, max: 50, color: "#22c55e", label: "Bình thường" },
  { min: 50, max: 80, color: "#f59e0b", label: "Cảnh báo" },
  { min: 80, max: 100, color: "#ef4444", label: "Nguy hiểm" },
];

export function validateLabel(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Nhãn không được để trống";
  if (trimmed.length > 32) return "Nhãn không được vượt quá 32 ký tự";
  return null;
}

export function validateThreshold(entry: ThresholdEntry): string | null {
  if (entry.min >= entry.max) return "Giá trị min phải nhỏ hơn max";
  return null;
}

export function validateOpenPercent(value: number): string | null {
  if (value < 0 || value > 100) return "Độ mở phải trong khoảng 0–100";
  return null;
}

export function canAddThreshold(count: number): boolean {
  return count < 5;
}

export function canRemoveThreshold(count: number): boolean {
  return count > 1;
}

export function buildFormData(
  nodeShape: string,
  nodeData: Record<string, any>,
): NodeFormData {
  const base: NodeFormData = {
    label: nodeData.label ?? "",
  };

  switch (nodeShape) {
    case "esp-filter-tank":
      return {
        ...base,
        thresholds: nodeData.thresholds ?? [...DEFAULT_THRESHOLDS],
        voltage: nodeData.voltage,
        current: nodeData.current,
      };

    case "motor-blower":
      return {
        ...base,
        thresholds: nodeData.thresholds ?? [...DEFAULT_THRESHOLDS],
        current: nodeData.current,
        statorTemp: nodeData.statorTemp,
        bearingTemp: nodeData.bearingTemp,
      };

    case "control-valve":
      return {
        ...base,
        thresholds: nodeData.thresholds ?? [...DEFAULT_THRESHOLDS],
        mode: nodeData.mode,
        openPercent: nodeData.openPercent,
      };

    case "data-tag":
      return {
        ...base,
        unit: nodeData.unit,
        thresholds: nodeData.thresholds ?? [...DEFAULT_THRESHOLDS],
        value: nodeData.value,
        status: nodeData.status,
      };

    case "indicator-light":
      return {
        ...base,
        color: nodeData.color,
        state: nodeData.state,
      };

    case "static-equipment":
    case "computer-device-node":
    case "my-vue-shape":
    default:
      return base;
  }
}

export function applyFormDataToNode(node: any, formData: NodeFormData): void {
  node.setData(formData);
}

// --- Rotate & Resize constants and validation (node-rotate-resize feature) ---

export const MIN_WIDTH = 20;
export const MAX_WIDTH = 800;
export const MIN_HEIGHT = 20;
export const MAX_HEIGHT = 800;

export function validateRotationAngle(angle: number): string | null {
  if (!Number.isFinite(angle) || angle < 0 || angle > 359) {
    return "Góc xoay phải trong khoảng 0–359 độ";
  }
  return null;
}

export function validateNodeWidth(width: number): string | null {
  if (!Number.isFinite(width) || width < MIN_WIDTH || width > MAX_WIDTH) {
    return `Chiều rộng phải trong khoảng ${MIN_WIDTH}–${MAX_WIDTH} px`;
  }
  return null;
}

export function validateNodeHeight(height: number): string | null {
  if (!Number.isFinite(height) || height < MIN_HEIGHT || height > MAX_HEIGHT) {
    return `Chiều cao phải trong khoảng ${MIN_HEIGHT}–${MAX_HEIGHT} px`;
  }
  return null;
}
