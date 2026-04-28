import { defineStore } from "pinia";
import type {
  Layer,
  LayerState,
  LayerExportData,
  DeleteLayerResult,
} from "~/types/layer";
import { LAYER_COLORS } from "~/types/layer";

export const useLayerStore = defineStore("layer", {
  state: (): LayerState => ({
    layers: [],
    activeLayerId: "",
    nodeLayerMap: {},
  }),

  actions: {
    initDefault() {
      this.layers = [];
      this.nodeLayerMap = {};
      const defaultLayer: Layer = {
        id: crypto.randomUUID(),
        name: "Layer 1",
        color: LAYER_COLORS[0],
        visible: true,
        locked: false,
        order: 0,
      };
      this.layers.push(defaultLayer);
      this.activeLayerId = defaultLayer.id;
    },

    addLayer() {
      // Find next unused number for auto-increment name
      const existingNumbers = new Set(
        this.layers
          .map((l) => {
            const match = l.name.match(/^Layer (\d+)$/);
            return match ? parseInt(match[1], 10) : null;
          })
          .filter((n): n is number => n !== null),
      );
      let nextNumber = 1;
      while (existingNumbers.has(nextNumber)) {
        nextNumber++;
      }

      // Pick next color cycling through palette
      const colorIndex = this.layers.length % LAYER_COLORS.length;
      const newLayer: Layer = {
        id: crypto.randomUUID(),
        name: `Layer ${nextNumber}`,
        color: LAYER_COLORS[colorIndex],
        visible: true,
        locked: false,
        order: this.layers.length,
      };
      this.layers.push(newLayer);
    },

    renameLayer(id: string, name: string) {
      if (name.trim() === "") return;
      const layer = this.layers.find((l) => l.id === id);
      if (layer) {
        layer.name = name;
      }
    },

    setActiveLayer(id: string) {
      const exists = this.layers.some((l) => l.id === id);
      if (exists) {
        this.activeLayerId = id;
      }
    },

    setVisible(id: string, visible: boolean) {
      const layer = this.layers.find((l) => l.id === id);
      if (layer) {
        layer.visible = visible;
      }
    },

    setLocked(id: string, locked: boolean) {
      const layer = this.layers.find((l) => l.id === id);
      if (layer) {
        layer.locked = locked;
      }
    },

    setColor(id: string, color: string) {
      const layer = this.layers.find((l) => l.id === id);
      if (layer) {
        layer.color = color;
      }
    },

    deleteLayer(id: string): DeleteLayerResult {
      if (this.layers.length <= 1) {
        return { ok: false, error: "LAST_LAYER" };
      }
      const nodeIds = Object.entries(this.nodeLayerMap)
        .filter(([, layerId]) => layerId === id)
        .map(([nodeId]) => nodeId);
      if (nodeIds.length > 0) {
        return { ok: false, error: "HAS_NODES", nodeIds };
      }
      const idx = this.layers.findIndex((l) => l.id === id);
      this.layers.splice(idx, 1);
      this.layers.forEach((l, i) => {
        l.order = i;
      });
      if (this.activeLayerId === id) {
        this.activeLayerId = this.layers[0].id;
      }
      return { ok: true };
    },

    deleteLayerConfirmed(id: string): void {
      if (this.layers.length <= 1) return;
      // Move all nodes from deleted layer to active layer
      for (const nodeId of Object.keys(this.nodeLayerMap)) {
        if (this.nodeLayerMap[nodeId] === id) {
          this.nodeLayerMap[nodeId] = this.activeLayerId;
        }
      }
      const idx = this.layers.findIndex((l) => l.id === id);
      this.layers.splice(idx, 1);
      this.layers.forEach((l, i) => {
        l.order = i;
      });
      if (this.activeLayerId === id) {
        this.activeLayerId = this.layers[0].id;
      }
    },

    assignNode(nodeId: string, layerId: string): void {
      this.nodeLayerMap[nodeId] = layerId;
    },

    assignNodes(nodeIds: string[], layerId: string): void {
      for (const nodeId of nodeIds) {
        this.nodeLayerMap[nodeId] = layerId;
      }
    },

    getLayerOfNode(nodeId: string): string | undefined {
      return this.nodeLayerMap[nodeId];
    },

    reorderLayers(fromIndex: number, toIndex: number): void {
      if (fromIndex === toIndex) return;
      if (
        fromIndex < 0 ||
        fromIndex >= this.layers.length ||
        toIndex < 0 ||
        toIndex >= this.layers.length
      ) {
        return;
      }
      const [moved] = this.layers.splice(fromIndex, 1);
      this.layers.splice(toIndex, 0, moved);
      this.layers.forEach((l, i) => {
        l.order = i;
      });
    },

    exportLayerData(): LayerExportData {
      return {
        layers: JSON.parse(JSON.stringify(this.layers)),
        nodeLayerMap: { ...this.nodeLayerMap },
        activeLayerId: this.activeLayerId,
      };
    },

    importLayerData(data: unknown): void {
      if (data == null) {
        this.initDefault();
        return;
      }

      const isValidLayer = (item: unknown): boolean => {
        if (typeof item !== "object" || item === null) return false;
        const l = item as Record<string, unknown>;
        return (
          typeof l.id === "string" &&
          typeof l.name === "string" &&
          typeof l.color === "string" &&
          typeof l.visible === "boolean" &&
          typeof l.locked === "boolean" &&
          typeof l.order === "number"
        );
      };

      const isValid =
        typeof data === "object" &&
        data !== null &&
        Array.isArray((data as Record<string, unknown>).layers) &&
        ((data as Record<string, unknown>).layers as unknown[]).every(
          isValidLayer,
        ) &&
        typeof (data as Record<string, unknown>).nodeLayerMap === "object" &&
        (data as Record<string, unknown>).nodeLayerMap !== null &&
        typeof (data as Record<string, unknown>).activeLayerId === "string";

      if (!isValid) {
        console.warn(
          "[layerStore] importLayerData: invalid data, falling back to default",
        );
        this.initDefault();
        return;
      }

      const d = data as LayerExportData;
      this.layers = JSON.parse(JSON.stringify(d.layers));
      this.nodeLayerMap = { ...d.nodeLayerMap };
      this.activeLayerId = d.activeLayerId;
    },
  },
});
