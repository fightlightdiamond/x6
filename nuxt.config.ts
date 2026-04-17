// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],

  plugins: ["~/plugins/socket.client.ts"],

  ssr: false,

  devServer: {
    host: "127.0.0.1",
    port: 5555, // Đổi hẳn sang port này để né bộ đệm của Service Worker ở cổng 3000
  },

  devtools: { enabled: true },

  vite: {
    resolve: {
      dedupe: ["nitropack"],
    },
    server: {
      hmr: {
        protocol: "ws",
        host: "127.0.0.1",
        port: 5555, // Đảm bảo port này khớp với port của browser đang chạy
      },
    },
  },
});
