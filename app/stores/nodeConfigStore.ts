import { defineStore } from "pinia";

export const useNodeConfigStore = defineStore("nodeConfig", {
  state: () => ({
    selectedNodeId: null as string | null,
  }),
  getters: {
    isPanelOpen: (state): boolean => state.selectedNodeId !== null,
  },
  actions: {
    openPanel(nodeId: string) {
      if (this.selectedNodeId === nodeId) return;
      this.selectedNodeId = nodeId;
    },
    closePanel() {
      this.selectedNodeId = null;
    },
  },
});
