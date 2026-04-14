// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "@nuxtjs/storybook"],

  ssr: false, // Tắt SSR cho các dự án dùng đồ họa Canvas

  devServer: {
    port: 5555, // Đổi hẳn sang port này để né bộ đệm của Service Worker ở cổng 3000
  },

  devtools: { enabled: true },

  vite: {
    resolve: {
      dedupe: ["nitropack"],
    },
  },
});