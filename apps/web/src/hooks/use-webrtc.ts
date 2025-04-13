import { useSocket } from "@web/context/socket.context";
import { useEffect, useRef, useState } from "react";

type CallState = {
  isMuted: boolean;
  isCallActive: boolean;
  isInitiator: boolean;
  signalingState:
    | "stable"
    | "have-local-offer"
    | "have-remote-offer"
    | "closed";
};

export const useWebRTC = () => {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [callState, setCallState] = useState<CallState>({
    isMuted: false,
    isCallActive: false,
    isInitiator: false,
    signalingState: "stable",
  });
  const toUserIdRef = useRef("");
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);

  const initUserMedia = async () => {
    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const pc = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit("webrtc-ice-candidate", {
            toUserId: toUserIdRef.current,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
      };

      pc.onsignalingstatechange = () => {
        setCallState((prev) => ({
          ...prev,
          signalingState: pc.signalingState as CallState["signalingState"],
        }));
      };

      setPeerConnection(pc);
      setLocalStream(stream);
    } catch (error) {
      console.error("Error accessing media devices.", error);
    }
  };

  useEffect(() => {
    if (!socket?.connected) return;

    return () => {
      cleanupCall();
    };
  }, [socket?.connected]);

  useEffect(() => {
    if (!socket?.connected) return;

    socket?.on("webrtc-ice-candidate", (data) => {
      const { candidate } = data;
      if (!candidate) return;

      const iceCandidate = new RTCIceCandidate(candidate);
      if (peerConnection?.remoteDescription) {
        addIceCandidate(iceCandidate);
      } else {
        pendingIceCandidatesRef.current.push(iceCandidate);
      }
    });

    socket?.on("incoming-call", (data) => {
      const { fromUserId, offer } = data;
      if (
        window.confirm(
          `Incoming call from ${fromUserId}. Do you want to answer?`
        )
      ) {
        answerCall(fromUserId, offer);
      }
    });

    socket?.on("call-answered", (data) => {
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
          // Add any pending ICE candidates
          pendingIceCandidatesRef.current.forEach((candidate) => {
            addIceCandidate(candidate);
          });
          pendingIceCandidatesRef.current = [];
          setCallState((prev) => ({ ...prev, isCallActive: true }));
        })
        .catch((error) => {
          console.error("Error setting remote description", error);
        });
    });

    socket?.on("end-call", () => {
      console.log("Received end-call signal");
      cleanupCall();
    });

    return () => {
      socket?.off("webrtc-ice-candidate");
      socket?.off("incoming-call");
      socket?.off("call-answered");
      socket?.off("end-call");
    };
  }, [socket?.connected, peerConnection]);

  const toggleMute = () => {
    if (!localStream) return;

    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setCallState((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
    }));
  };

  const cleanupCall = () => {
    console.log("Cleaning up call resources");

    setRemoteStream(null);

    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    const tracks = localStream?.getTracks();
    console.log({ tracks });
    tracks?.forEach((track) => track.stop());
    setLocalStream(null);

    setCallState((prev) => ({
      ...prev,
      isCallActive: false,
      isInitiator: false,
      signalingState: "stable",
    }));

    // Clear pending ICE candidates
    pendingIceCandidatesRef.current = [];
  };

  const endCall = () => {
    console.log("Ending call", { toUserId: toUserIdRef.current, callState });

    cleanupCall();

    if (callState.isCallActive && toUserIdRef.current) {
      socket?.emit("end-call", { toUserId: toUserIdRef.current });
    }

    toUserIdRef.current = "";
  };

  const startCall = async (toUserId: string) => {
    await initUserMedia();
    console.log("Starting call to", { toUserId, peerConnection, localStream });
    if (!peerConnection || !localStream) return;
    toUserIdRef.current = toUserId;
    setCallState((prev) => ({
      ...prev,
      isCallActive: true,
      isInitiator: true,
    }));

    peerConnection
      .createOffer()
      .then((offer) => {
        return peerConnection.setLocalDescription(offer);
      })
      .then(() => {
        if (peerConnection.localDescription) {
          socket?.emit("start-call", {
            toUserId,
            offer: peerConnection.localDescription,
            type: "video",
          });
        }
      })
      .catch((error) => {
        console.error("Error creating offer", error);
        setCallState((prev) => ({
          ...prev,
          isCallActive: false,
          isInitiator: false,
        }));
      });
  };

  const answerCall = (toUserId: string, offer: RTCSessionDescriptionInit) => {
    if (!peerConnection) return;
    toUserIdRef.current = toUserId;
    setCallState((prev) => ({
      ...prev,
      isCallActive: true,
      isInitiator: false,
    }));

    peerConnection
      .setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => peerConnection.createAnswer())
      .then((answer) => {
        return peerConnection.setLocalDescription(answer);
      })
      .then(() => {
        if (peerConnection.localDescription) {
          socket?.emit("answer-call", {
            toUserId,
            answer: peerConnection.localDescription,
          });
        }
      })
      .catch((error) => {
        console.error("Error creating answer", error);
        setCallState((prev) => ({
          ...prev,
          isCallActive: false,
          isInitiator: false,
        }));
      });
  };

  const addIceCandidate = (candidate: RTCIceCandidate) => {
    if (!peerConnection) return;
    peerConnection.addIceCandidate(candidate).catch((error) => {
      console.error("Error adding ice candidate", error);
    });
  };

  return {
    localStream,
    remoteStream,
    startCall,
    answerCall,
    toggleMute,
    endCall,
    callState,
  };
};
