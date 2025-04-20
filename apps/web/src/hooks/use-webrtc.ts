import { useEffect, useState, useCallback, useRef } from "react";
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
  const isPeerReadyRef = useRef(false);
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall>(null);
  const [error, setError] = useState<Error | null>(null);

  const {
    localStream,
    startStream,
    stopStream,
    toggleMute: toggleMediaMute,
    error: mediaError,
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
    connectionState,
    iceConnectionState,
    signalingState,
    error: peerError,
    pendingIceCandidatesRef,
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

  const cleanup = useCallback(() => {
    stopStream();
    cleanupPeerConnection();
    endCall();
    setError(null);
  }, [stopStream, cleanupPeerConnection, endCall]);

  useEffect(() => {
    if (mediaError) setError(mediaError);
    else if (peerError) setError(peerError);
    else setError(null);
  }, [mediaError, peerError]);

  useEffect(() => {
    if (connectionState === "failed" || iceConnectionState === "failed") {
      setError(new Error("Connection failed"));
    }
  }, [connectionState, iceConnectionState]);

  useEffect(() => {
    if (!socket) return;

    const handleIceCandidate = ({
      candidate,
    }: {
      candidate: RTCIceCandidateInit;
    }) => {
      if (!candidate?.candidate.includes("typ relay")) return;

      const rtcCandidate = new RTCIceCandidate(candidate);
      console.log("📥 Received TURN candidate:", rtcCandidate);

      if (isPeerReadyRef.current) {
        addIceCandidate(rtcCandidate);
      } else {
        console.log("🧊 Buffering ICE candidate (peer not ready)");
        pendingIceCandidatesRef.current.push(rtcCandidate);
        console.log(
          "🧊 Pending ICE buffer now:",
          pendingIceCandidatesRef.current
        );
      }
    };

    const handleIncomingCall = (data: IncomingCall) => {
      console.log("📞 Incoming call from", data.fromUserId);
      setIncomingCall(data);
    };

    const handleCallAnswered = async ({
      answer,
    }: {
      answer: RTCSessionDescriptionInit;
    }) => {
      if (!peerConnection)
        return setError(new Error("No peer connection available"));

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        await processPendingIceCandidates();
      } catch (error) {
        console.error("❌ Error setting remote description", error);
        setError(error as Error);
        cleanup();
      }
    };

    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-answered", handleCallAnswered);
    socket.on("end-call", cleanup);

    return () => {
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-answered", handleCallAnswered);
      socket.off("end-call", cleanup);
    };
  }, [
    socket,
    peerConnection,
    addIceCandidate,
    processPendingIceCandidates,
    cleanup,
  ]);

  const setupTracks = (pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      const sender = pc.addTrack(track, stream);
      track.onended = () => {
        try {
          pc.removeTrack(sender);
        } catch (error) {
          console.error("Error removing track:", error);
        }
        cleanup();
      };
    });
  };

  const emitSocketEvent = (event: string, data: any) => {
    if (!socket?.connected) throw new Error("Socket not connected");
    socket.emit(event, data);
  };

  const handleStartCall = async (toUserId: string, type: "video" | "audio") => {
    try {
      const stream = await startStream();
      if (!stream) throw new Error("Failed to start media stream");

      const pc = createPeerConnection();
      if (!pc) throw new Error("Failed to create peer connection");
      isPeerReadyRef.current = true;

      setToUserId(toUserId);
      startCall();

      setupTracks(pc, stream);

      pc.onsignalingstatechange = () => updateSignalingState(pc.signalingState);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video",
      });
      await pc.setLocalDescription(offer);

      setCallState((prev) => ({ ...prev, type }));
      emitSocketEvent("start-call", {
        toUserId,
        offer: pc.localDescription,
        type,
      });
    } catch (error) {
      setError(error as Error);
      cleanup();
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await startStream();
      if (!stream) throw new Error("Failed to start media stream");

      const pc = createPeerConnection();
      if (!pc) throw new Error("Failed to create peer connection");
      isPeerReadyRef.current = true;

      setToUserId(incomingCall.fromUserId);
      answerCall();

      setupTracks(pc, stream);

      pc.onsignalingstatechange = () => updateSignalingState(pc.signalingState);

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );
      await processPendingIceCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      emitSocketEvent("answer-call", {
        toUserId: incomingCall.fromUserId,
        answer: pc.localDescription,
      });

      setCallState((prev) => ({ ...prev, type: incomingCall.type }));
      setIncomingCall(null);
    } catch (error) {
      setError(error as Error);
      cleanup();
    }
  };

  const handleRejectCall = () => setIncomingCall(null);

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

  return {
    localStream,
    remoteStream,
    startCall: handleStartCall,
    endCall: handleEndCall,
    toggleMute: handleToggleMute,
    callState,
    setCallState,
    incomingCall,
    handleAcceptCall,
    handleRejectCall,
    error,
    connectionState,
    iceConnectionState,
    signalingState,
  };
};
