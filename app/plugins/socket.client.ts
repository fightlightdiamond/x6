import { io, type Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io("http://127.0.0.1:3001", {
      transports: ["websocket", "polling"],
    });
  }
  return _socket;
}

export default defineNuxtPlugin(() => {
  const socket = getSocket();
  socket.on("connect", () => console.log("[socket] ✅ Connected:", socket.id));
  socket.on("connect_error", (e) =>
    console.warn("[socket] ❌ Error:", e.message),
  );
  socket.on("disconnect", (r) => console.log("[socket] Disconnected:", r));
  return { provide: { socket } };
});
