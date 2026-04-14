import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    isInitialized: false,
  }),
  actions: {
    initialize() {
      this.isInitialized = true;
    }
  }
})
