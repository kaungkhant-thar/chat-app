import { useEffect, useState } from "react";
import { useSocket } from "@web/context/socket.context";
import { useMediaStream } from "./use-media-stream";
import { usePeerConnection } from "./use-peer-connection";
import { useCallState } from "./use-call-state";

type IncomingCall = {
  fromUserId: string;
  offer: RTCSessionDescriptionInit;
  type: "video" | "audio";
} | null;

export const useWebRTC = () => {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall>(null);

  const {
    localStream,
    startStream,
    stopStream,
    toggleMute: toggleMediaMute,
  } = useMediaStream();

  const {
    peerConnection,
    remoteStream,
    createPeerConnection,
    addIceCandidate,
    processPendingIceCandidates,
    cleanup: cleanupPeerConnection,
    setToUserId,
    toUserId,
  } = usePeerConnection();

  const {
    callState,
    setCallState,
    updateSignalingState,
    startCall,
    answerCall,
    endCall,
    toggleMute: toggleCallMute,
  } = useCallState();
  console.log([callState]);

  useEffect(() => {
    if (!socket) return;

    const handleIceCandidate = (data: { candidate: RTCIceCandidateInit }) => {
      const { candidate } = data;
      if (!candidate) return;

      const iceCandidate = new RTCIceCandidate(candidate);
      addIceCandidate(iceCandidate);
    };

    const handleIncomingCall = (data: IncomingCall) => {
      console.log("received incoming call", data);
      setIncomingCall(data);
    };

    const handleCallAnswered = (data: {
      answer: RTCSessionDescriptionInit;
    }) => {
      const { answer } = data;
      console.log("received call answer", {
        answer,
        peerConnection,
        signalingState: peerConnection?.signalingState,
        connectionState: peerConnection?.connectionState,
      });

      if (!peerConnection) {
        console.error("No peer connection available when receiving answer");
        return;
      }

      peerConnection
        .setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => {
          processPendingIceCandidates();
        })
        .catch((error) => {
          console.error("Error setting remote description:", error);
          cleanup();
        });
    };

    const handleEndCall = () => {
      console.log("Received end-call event, cleaning up");
      cleanup();
    };

    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-answered", handleCallAnswered);
    socket.on("end-call", handleEndCall);

    return () => {
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-answered", handleCallAnswered);
      socket.off("end-call", handleEndCall);
    };
  }, [socket?.connected]);

  const handleStartCall = async (toUserId: string, type: "video" | "audio") => {
    console.log("Starting call with", { toUserId, type });
    const stream = await startStream();
    console.log("Stream started:", !!stream);
    if (!stream) return;

    const pc = createPeerConnection();
    console.log("Created peer connection:", !!pc);
    setToUserId(toUserId);
    startCall();

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onsignalingstatechange = () => {
      console.log("Signaling state changed:", pc.signalingState);
      updateSignalingState(pc.signalingState as any);
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Created and set local offer");

      setCallState((prev) => ({
        ...prev,
        type,
      }));
      if (socket?.connected) {
        socket.emit("start-call", {
          toUserId,
          offer: pc.localDescription,
          type,
        });
        console.log("Emitted start-call event");
      }
    } catch (error) {
      console.error("Error creating offer:", error);
      cleanup();
    }
  };

  const handleAnswerCall = async (
    toUserId: string,
    offer: RTCSessionDescriptionInit
  ) => {
    const stream = await startStream();
    if (!stream) return;

    const pc = createPeerConnection();
    setToUserId(toUserId);
    answerCall();

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onsignalingstatechange = () => {
      updateSignalingState(pc.signalingState as any);
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket?.connected) {
        socket.emit("answer-call", {
          toUserId,
          answer: pc.localDescription,
        });
      }
    } catch (error) {
      console.error("Error answering call:", error);
      cleanup();
    }
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    handleAnswerCall(incomingCall.fromUserId, incomingCall.offer);
    setCallState((prev) => ({
      ...prev,
      type: incomingCall.type,
    }));
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    if (callState.isCallActive) {
      socket?.emit("end-call", { toUserId });
    }
    cleanup();
  };

  const handleToggleMute = () => {
    toggleMediaMute();
    toggleCallMute();
  };

  const cleanup = () => {
    console.log("Cleaning up WebRTC resources");
    stopStream();
    cleanupPeerConnection();
    endCall();
  };

  return {
    localStream,
    remoteStream,
    startCall: handleStartCall,
    answerCall: handleAnswerCall,
    endCall: handleEndCall,
    toggleMute: handleToggleMute,
    callState,
    setCallState,
    incomingCall,
    handleAcceptCall,
    handleRejectCall,
  };
};
