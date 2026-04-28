import { watch, toRaw } from "vue";
import { storeToRefs } from "pinia";
import type { Graph, Node } from "@antv/x6";
import { useLayerStore } from "~/stores/layerStore";

export const useLayerManager = (getGraph: () => Graph | null) => {
  const layerStore = useLayerStore();
  const { layers, nodeLayerMap } = storeToRefs(layerStore);

  function applyVisibilityToCanvas(): void {
    const graph = getGraph();
    if (!graph) {
      console.warn("[LayerManager] graph is null in applyVisibilityToCanvas");
      return;
    }
    console.log(
      "[LayerManager] graph type:",
      typeof graph,
      "has getNodes:",
      typeof graph.getNodes,
      "constructor:",
      graph.constructor?.name,
    );
    const map = toRaw(nodeLayerMap.value);
    const layerList = toRaw(layers.value);
    for (const [nodeId, layerId] of Object.entries(map)) {
      const layer = layerList.find((l) => l.id === layerId);
      if (!layer) continue;
      const cell = graph.getCellById(nodeId);
      if (!cell) {
        console.warn("[LayerManager] cell not found:", nodeId);
        continue;
      }
      console.log(
        "[LayerManager] cell:",
        nodeId,
        "type:",
        typeof cell,
        "has setVisible:",
        typeof cell.setVisible,
        "keys:",
        Object.keys(cell).slice(0, 5),
      );
      // Try calling setVisible directly
      try {
        cell.setVisible(layer.visible);
      } catch (e) {
        console.error("[LayerManager] setVisible failed:", e);
      }
    }
  }

  function applyLockToCanvas(): void {
    const graph = getGraph();
    if (!graph) return;
    const map = toRaw(nodeLayerMap.value);
    const layerList = toRaw(layers.value);
    for (const [nodeId, layerId] of Object.entries(map)) {
      const layer = layerList.find((l) => l.id === layerId);
      if (!layer) continue;
      const cell = graph.getCellById(nodeId);
      if (!cell) continue;
      // setProp works on Cell base class — available on all X6 cells
      cell.setProp("interacting", !layer.locked);
    }
  }

  function applyZOrderToCanvas(): void {
    const graph = getGraph();
    if (!graph) return;
    const map = toRaw(nodeLayerMap.value);
    const layerList = toRaw(layers.value);
    for (const [nodeId, layerId] of Object.entries(map)) {
      const layer = layerList.find((l) => l.id === layerId);
      if (!layer) continue;
      const cell = graph.getCellById(nodeId);
      if (!cell) continue;
      cell.setZIndex(layer.order * 10);
    }
  }

  watch(
    [layers, nodeLayerMap],
    () => {
      applyVisibilityToCanvas();
      applyLockToCanvas();
      applyZOrderToCanvas();
    },
    { deep: true },
  );

  function onNodeAdded(node: Node): void {
    const nodeId = toRaw(node).id ?? (node as any).id;
    if (nodeId && !nodeLayerMap.value[nodeId]) {
      layerStore.assignNode(nodeId, layerStore.activeLayerId);
    }
  }

  function onNodeDropped(node: Node): boolean {
    const activeLayer = toRaw(layers.value).find(
      (l) => l.id === layerStore.activeLayerId,
    );
    if (activeLayer?.locked) {
      console.warn("[LayerManager] Active layer is locked, cannot add node");
      return false;
    }
    if (activeLayer?.visible === false) {
      console.warn("[LayerManager] Active layer is hidden, cannot add node");
      return false;
    }
    return true;
  }

  return {
    onNodeAdded,
    onNodeDropped,
    applyVisibilityToCanvas,
    applyLockToCanvas,
    applyZOrderToCanvas,
  };
};
