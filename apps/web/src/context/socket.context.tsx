"use client";

import { useAuthStore } from "@web/store/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      console.log("No token available, cannot connect socket");
      return;
    }

    console.log("Connecting socket with token...");
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: {
        token,
      },
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected successfully!");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    setSocket(socketInstance);

    return () => {
      console.log("Cleaning up socket connection");
      socketInstance.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
