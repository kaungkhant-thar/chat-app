import { useState, useCallback } from "react";
import { CallState } from "./types/webrtc";

export const useCallState = () => {
  const [callState, setCallState] = useState<CallState>({
    isMuted: false,
    isCallActive: false,
    isInitiator: false,
    signalingState: "stable",
    type: "video",
  });

  const updateSignalingState = useCallback(
    (state: CallState["signalingState"]) => {
      setCallState((prev) => ({
        ...prev,
        signalingState: state,
      }));
    },
    []
  );

  const startCall = useCallback(() => {
    setCallState((prev) => ({
      ...prev,
      isCallActive: true,
      isInitiator: true,
    }));
  }, []);

  const answerCall = useCallback(() => {
    setCallState((prev) => ({
      ...prev,
      isCallActive: true,
      isInitiator: false,
    }));
  }, []);

  const endCall = useCallback(() => {
    setCallState((prev) => ({
      ...prev,
      isCallActive: false,
      isInitiator: false,
      signalingState: "stable",
    }));
  }, []);

  const toggleMute = useCallback(() => {
    setCallState((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
    }));
  }, []);

  return {
    callState,
    updateSignalingState,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    setCallState,
  };
};
