import { useEffect } from "react";
import { useSocket } from "@web/context/socket.context";
import { useMediaStream } from "./use-media-stream";
import { usePeerConnection } from "./use-peer-connection";
import { useCallState } from "./use-call-state";

export const useWebRTC = () => {
  const { socket } = useSocket();

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

  useEffect(() => {
    if (!socket) return;

    socket.on("webrtc-ice-candidate", (data) => {
      const { candidate } = data;
      if (!candidate) return;

      const iceCandidate = new RTCIceCandidate(candidate);
      addIceCandidate(iceCandidate);
    });

    socket.on("incoming-call", (data) => {
      console.log("received incoming call", data);
      const { fromUserId, offer } = data;
      if (
        window.confirm(
          `Incoming call from ${fromUserId}. Do you want to answer?`
        )
      ) {
        handleAnswerCall(fromUserId, offer);
      }
    });

    socket.on("call-answered", (data) => {
      const { answer } = data;
      if (peerConnection?.signalingState !== "have-local-offer") {
        console.error(
          "Invalid signaling state for setting remote answer:",
          peerConnection?.signalingState
        );
        return;
      }

      peerConnection
        ?.setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => {
          processPendingIceCandidates();
        })
        .catch(console.error);
    });

    socket.on("end-call", cleanup);

    return () => {
      socket.off("webrtc-ice-candidate");
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("end-call");
    };
  }, [socket?.connected, peerConnection]);

  const handleStartCall = async (toUserId: string) => {
    const stream = await startStream();
    console.log("started calling", toUserId, stream);
    if (!stream) return;

    const pc = createPeerConnection();
    setToUserId(toUserId);
    startCall();

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onsignalingstatechange = () => {
      updateSignalingState(pc.signalingState as any);
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socket?.connected) {
        socket.emit("start-call", {
          toUserId,
          offer: pc.localDescription,
          type: "video",
        });
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

  const handleEndCall = () => {
    if (callState.isCallActive) {
      socket?.emit("end-call", { toUserId: setToUserId });
    }
    cleanup();
  };

  const handleToggleMute = () => {
    toggleMediaMute();
    toggleCallMute();
  };

  const cleanup = () => {
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
  };
};
