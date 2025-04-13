"use client";

import { createContext, useContext, ReactNode } from "react";
import { useWebRTC } from "@web/hooks/use-webrtc";

type WebRTCContextType = ReturnType<typeof useWebRTC>;

const WebRTCContext = createContext<WebRTCContextType | null>(null);

type WebRTCProviderProps = {
  children: ReactNode;
};

export const WebRTCProvider = ({ children }: WebRTCProviderProps) => {
  const webrtc = useWebRTC();

  return (
    <WebRTCContext.Provider value={webrtc}>{children}</WebRTCContext.Provider>
  );
};

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error("useWebRTCContext must be used within a WebRTCProvider");
  }
  return context;
};
