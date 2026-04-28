import { defineStore } from "pinia";

export const useMonitorStore = defineStore("monitor", {
  state: () => ({
    isMonitoring: false,
    activeTemplateId: null as string | null,
    deviceStatuses: [] as Array<{ id: string; label: string; status: string }>,
  }),

  actions: {
    setMonitoring(val: boolean) {
      this.isMonitoring = val;
    },

    setTemplate(templateId: string) {
      this.activeTemplateId = templateId;
    },

    updateDeviceStatuses(
      devices: Array<{ id: string; data: Record<string, any> }>,
    ) {
      this.deviceStatuses = devices.map((u) => ({
        id: u.id,
        label: u.data?.label ?? u.id,
        status: u.data?.status ?? "normal",
      }));
    },
  },
});
