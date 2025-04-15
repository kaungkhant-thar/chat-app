import { useEffect, useState, useCallback } from "react";
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
    console.log("Cleaning up WebRTC resources");
    stopStream();
    cleanupPeerConnection();
    endCall();
    setError(null);
  }, [stopStream, cleanupPeerConnection, endCall]);

  // Handle errors from different sources
  useEffect(() => {
    if (mediaError) setError(mediaError);
    else if (peerError) setError(peerError);
    else setError(null);
  }, [mediaError, peerError]);

  // Handle connection state changes
  useEffect(() => {
    if (connectionState === "failed" || iceConnectionState === "failed") {
      setError(new Error("Connection failed"));
    }
  }, [connectionState, iceConnectionState]);

  // Setup socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleIceCandidate = ({
      candidate,
    }: {
      candidate: RTCIceCandidateInit;
    }) => {
      if (candidate) addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handleIncomingCall = (data: IncomingCall) => {
      console.log("Received incoming call", { data });
      setIncomingCall(data);
    };

    const handleCallAnswered = async ({
      answer,
    }: {
      answer: RTCSessionDescriptionInit;
    }) => {
      if (!peerConnection) {
        setError(new Error("No peer connection available"));
        return;
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        await processPendingIceCandidates();
      } catch (error) {
        console.error("Error setting remote description:", error);
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
    socket?.connected,
    peerConnection,
    addIceCandidate,
    processPendingIceCandidates,
    cleanup,
  ]);

  // Helper function to setup tracks
  const setupTracks = (pc: RTCPeerConnection, stream: MediaStream) => {
    const senders: RTCRtpSender[] = [];

    stream.getTracks().forEach((track) => {
      console.log("Adding track:", { kind: track.kind, id: track.id });
      const sender = pc.addTrack(track, stream);
      senders.push(sender);

      track.onended = () => {
        console.log("Track ended:", track.id);
        try {
          pc.removeTrack(sender);
        } catch (error) {
          console.error("Error removing track:", error);
        }
        cleanup();
      };
    });

    return senders;
  };

  // Helper function to emit socket event
  const emitSocketEvent = (event: string, data: any) => {
    if (!socket?.connected) {
      throw new Error("Socket not connected");
    }
    socket.emit(event, data);
  };

  const handleStartCall = async (toUserId: string, type: "video" | "audio") => {
    try {
      const stream = await startStream();
      if (!stream) throw new Error("Failed to start media stream");

      const pc = createPeerConnection();
      if (!pc) throw new Error("Failed to create peer connection");

      setToUserId(toUserId);
      startCall();

      setupTracks(pc, stream);

      pc.onsignalingstatechange = () => {
        updateSignalingState(pc.signalingState as any);
      };

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
      console.error("Error starting call:", error);
      setError(error as Error);
      cleanup();
    }
  };

  const handleAnswerCall = async (
    toUserId: string,
    offer: RTCSessionDescriptionInit
  ) => {
    try {
      const stream = await startStream();
      if (!stream) throw new Error("Failed to start media stream");

      const pc = createPeerConnection();
      if (!pc) throw new Error("Failed to create peer connection");

      setToUserId(toUserId);
      answerCall();

      setupTracks(pc, stream);

      pc.onsignalingstatechange = () => {
        updateSignalingState(pc.signalingState as any);
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      emitSocketEvent("answer-call", {
        toUserId,
        answer: pc.localDescription,
      });
    } catch (error) {
      console.error("Error answering call:", error);
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
      if (!pc) {
        stopStream();
        throw new Error("Failed to create peer connection");
      }

      setToUserId(incomingCall.fromUserId);
      answerCall();

      setupTracks(pc, stream);

      pc.onsignalingstatechange = () => {
        updateSignalingState(pc.signalingState as any);
      };

      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      emitSocketEvent("answer-call", {
        toUserId: incomingCall.fromUserId,
        answer: pc.localDescription,
      });

      setCallState((prev) => ({ ...prev, type: incomingCall.type }));
      setIncomingCall(null);
    } catch (error) {
      console.error("Error accepting call:", error);
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
    answerCall: handleAnswerCall,
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
