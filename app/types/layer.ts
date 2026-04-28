export interface Layer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface LayerState {
  layers: Layer[];
  activeLayerId: string;
  nodeLayerMap: Record<string, string>;
}

export interface LayerExportData {
  layers: Layer[];
  nodeLayerMap: Record<string, string>;
  activeLayerId: string;
}

export type DeleteLayerResult =
  | { ok: true }
  | { ok: false; error: "LAST_LAYER" }
  | { ok: false; error: "HAS_NODES"; nodeIds: string[] };

export const LAYER_COLORS: string[] = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];
