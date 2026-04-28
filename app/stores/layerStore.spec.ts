import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useLayerStore } from "./layerStore";
import { LAYER_COLORS } from "../types/layer";

describe("useLayerStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ── initDefault ────────────────────────────────────────────────────────────

  it("initDefault creates exactly one layer named 'Layer 1'", () => {
    const store = useLayerStore();
    store.initDefault();
    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.name).toBe("Layer 1");
    expect(store.activeLayerId).toBe(store.layers[0]!.id);
  });

  // ── addLayer ───────────────────────────────────────────────────────────────

  it("addLayer increments layer count", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    expect(store.layers).toHaveLength(2);
  });

  it("addLayer generates unique names", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    store.addLayer();
    const names = store.layers.map((l) => l.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("addLayer skips taken numbers for auto-name", () => {
    const store = useLayerStore();
    store.initDefault(); // Layer 1
    store.addLayer(); // Layer 2
    store.addLayer(); // Layer 3
    // Delete Layer 2 (index 1) — it has no nodes so ok
    const id2 = store.layers[1]!.id;
    store.deleteLayer(id2);
    // Now add again — should be Layer 2 (skipped number)
    store.addLayer();
    const names = store.layers.map((l) => l.name);
    expect(names).toContain("Layer 2");
  });

  // ── renameLayer ────────────────────────────────────────────────────────────

  it("renameLayer updates the layer name", () => {
    const store = useLayerStore();
    store.initDefault();
    const id = store.layers[0]!.id;
    store.renameLayer(id, "My Layer");
    expect(store.layers[0]!.name).toBe("My Layer");
  });

  it("renameLayer ignores empty/whitespace names", () => {
    const store = useLayerStore();
    store.initDefault();
    const id = store.layers[0]!.id;
    store.renameLayer(id, "   ");
    expect(store.layers[0]!.name).toBe("Layer 1");
  });

  // ── setActiveLayer ─────────────────────────────────────────────────────────

  it("setActiveLayer changes active layer", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    const secondId = store.layers[1]!.id;
    store.setActiveLayer(secondId);
    expect(store.activeLayerId).toBe(secondId);
  });

  it("setActiveLayer ignores unknown id", () => {
    const store = useLayerStore();
    store.initDefault();
    const original = store.activeLayerId;
    store.setActiveLayer("nonexistent");
    expect(store.activeLayerId).toBe(original);
  });

  // ── setVisible / setLocked / setColor ──────────────────────────────────────

  it("setVisible toggles visibility", () => {
    const store = useLayerStore();
    store.initDefault();
    const id = store.layers[0]!.id;
    store.setVisible(id, false);
    expect(store.layers[0]!.visible).toBe(false);
    store.setVisible(id, true);
    expect(store.layers[0]!.visible).toBe(true);
  });

  it("setLocked toggles lock", () => {
    const store = useLayerStore();
    store.initDefault();
    const id = store.layers[0]!.id;
    store.setLocked(id, true);
    expect(store.layers[0]!.locked).toBe(true);
    store.setLocked(id, false);
    expect(store.layers[0]!.locked).toBe(false);
  });

  it("setColor updates color", () => {
    const store = useLayerStore();
    store.initDefault();
    const id = store.layers[0]!.id;
    store.setColor(id, "#123456");
    expect(store.layers[0]!.color).toBe("#123456");
  });

  // ── deleteLayer ────────────────────────────────────────────────────────────

  it("deleteLayer returns LAST_LAYER when only one layer exists", () => {
    const store = useLayerStore();
    store.initDefault();
    const result = store.deleteLayer(store.layers[0]!.id);
    expect(result).toEqual({ ok: false, error: "LAST_LAYER" });
    expect(store.layers).toHaveLength(1);
  });

  it("deleteLayer returns HAS_NODES when layer has nodes", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    const id = store.layers[0]!.id;
    store.assignNode("node-1", id);
    const result = store.deleteLayer(id);
    expect(result).toEqual({
      ok: false,
      error: "HAS_NODES",
      nodeIds: ["node-1"],
    });
  });

  it("deleteLayer removes empty layer and decrements length", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    const id = store.layers[1]!.id;
    const result = store.deleteLayer(id);
    expect(result).toEqual({ ok: true });
    expect(store.layers).toHaveLength(1);
  });

  it("deleteLayer updates activeLayerId when active layer is deleted", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    const secondId = store.layers[1]!.id;
    store.setActiveLayer(secondId);
    store.deleteLayer(secondId);
    expect(store.activeLayerId).toBe(store.layers[0]!.id);
  });

  // ── deleteLayerConfirmed ───────────────────────────────────────────────────

  it("deleteLayerConfirmed moves nodes to active layer then removes layer", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    const firstId = store.layers[0]!.id;
    const secondId = store.layers[1]!.id;
    store.setActiveLayer(secondId);
    store.assignNode("node-a", firstId);
    store.deleteLayerConfirmed(firstId);
    expect(store.layers).toHaveLength(1);
    expect(store.nodeLayerMap["node-a"]).toBe(secondId);
  });

  it("deleteLayerConfirmed is a no-op when only one layer exists", () => {
    const store = useLayerStore();
    store.initDefault();
    const id = store.layers[0]!.id;
    store.deleteLayerConfirmed(id);
    expect(store.layers).toHaveLength(1);
  });

  // ── assignNode / assignNodes / getLayerOfNode ──────────────────────────────

  it("assignNode maps node to layer", () => {
    const store = useLayerStore();
    store.initDefault();
    const id = store.layers[0]!.id;
    store.assignNode("n1", id);
    expect(store.getLayerOfNode("n1")).toBe(id);
  });

  it("assignNodes maps multiple nodes to layer", () => {
    const store = useLayerStore();
    store.initDefault();
    const id = store.layers[0]!.id;
    store.assignNodes(["n1", "n2", "n3"], id);
    expect(store.getLayerOfNode("n1")).toBe(id);
    expect(store.getLayerOfNode("n2")).toBe(id);
    expect(store.getLayerOfNode("n3")).toBe(id);
  });

  it("getLayerOfNode returns undefined for unknown node", () => {
    const store = useLayerStore();
    store.initDefault();
    expect(store.getLayerOfNode("unknown")).toBeUndefined();
  });

  // ── reorderLayers ──────────────────────────────────────────────────────────

  it("reorderLayers moves layer from index to index", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    store.addLayer();
    const originalFirst = store.layers[0]!.id;
    store.reorderLayers(0, 2);
    expect(store.layers[2]!.id).toBe(originalFirst);
  });

  it("reorderLayers updates order fields", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    store.reorderLayers(0, 1);
    store.layers.forEach((l, i) => {
      expect(l.order).toBe(i);
    });
  });

  it("reorderLayers is a no-op for out-of-bounds indices", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    const before = store.layers.map((l) => l.id);
    store.reorderLayers(0, 5);
    expect(store.layers.map((l) => l.id)).toEqual(before);
  });

  // ── exportLayerData / importLayerData ──────────────────────────────────────

  it("exportLayerData returns a deep copy of state", () => {
    const store = useLayerStore();
    store.initDefault();
    store.assignNode("n1", store.layers[0]!.id);
    const exported = store.exportLayerData();
    expect(exported.layers).toHaveLength(1);
    expect(exported.nodeLayerMap["n1"]).toBe(store.layers[0]!.id);
    expect(exported.activeLayerId).toBe(store.activeLayerId);
  });

  it("importLayerData restores state from exported data", () => {
    const store = useLayerStore();
    store.initDefault();
    store.addLayer();
    store.assignNode("n1", store.layers[0]!.id);
    const exported = store.exportLayerData();

    // Reset and import
    store.initDefault();
    store.importLayerData(exported);
    expect(store.layers).toHaveLength(2);
    expect(store.nodeLayerMap["n1"]).toBe(exported.layers[0]!.id);
    expect(store.activeLayerId).toBe(exported.activeLayerId);
  });

  it("importLayerData falls back to default on null", () => {
    const store = useLayerStore();
    store.importLayerData(null);
    expect(store.layers).toHaveLength(1);
    expect(store.layers[0]!.name).toBe("Layer 1");
  });

  it("importLayerData falls back to default on invalid data", () => {
    const store = useLayerStore();
    store.importLayerData({
      layers: "bad",
      nodeLayerMap: {},
      activeLayerId: "",
    });
    expect(store.layers).toHaveLength(1);
  });

  // ── LAYER_COLORS ───────────────────────────────────────────────────────────

  it("LAYER_COLORS has 8 entries", () => {
    expect(LAYER_COLORS).toHaveLength(8);
  });
});
