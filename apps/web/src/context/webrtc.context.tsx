"use client";

import { createContext, useContext } from "react";
import { useWebRTC } from "@web/hooks/use-webrtc";
import { IncomingCallDialog } from "@web/components/ui/incoming-call-dialog";

type WebRTCContextType = ReturnType<typeof useWebRTC>;

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  const webrtc = useWebRTC();

  return (
    <WebRTCContext.Provider value={webrtc}>
      {children}
      {webrtc.incomingCall && (
        <IncomingCallDialog
          isOpen={!!webrtc.incomingCall}
          fromUserId={webrtc.incomingCall.fromUserId}
          onAccept={webrtc.handleAcceptCall}
          onReject={webrtc.handleRejectCall}
        />
      )}
    </WebRTCContext.Provider>
  );
}

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error("useWebRTCContext must be used within a WebRTCProvider");
  }
  return context;
};
