import { useState, useCallback, useRef } from "react";
import { useSocket } from "@web/context/socket.context";
import { PeerConnectionConfig } from "./types/webrtc";

export const usePeerConnection = (
  config: PeerConnectionConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  }
) => {
  const { socket } = useSocket();
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const toUserIdRef = useRef("");

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket?.connected) {
        socket.emit("webrtc-ice-candidate", {
          toUserId: toUserIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
    };

    setPeerConnection(pc);
    return pc;
  }, [config, socket]);

  const addIceCandidate = useCallback(
    (candidate: RTCIceCandidate) => {
      if (!peerConnection) return;

      if (peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(candidate).catch(console.error);
      } else {
        pendingIceCandidatesRef.current.push(candidate);
      }
    },
    [peerConnection]
  );

  const processPendingIceCandidates = useCallback(() => {
    if (!peerConnection) return;

    pendingIceCandidatesRef.current.forEach((candidate) => {
      addIceCandidate(candidate);
    });
    pendingIceCandidatesRef.current = [];
  }, [peerConnection, addIceCandidate]);

  const cleanup = useCallback(() => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    setRemoteStream(null);
    pendingIceCandidatesRef.current = [];
    toUserIdRef.current = "";
  }, [peerConnection]);

  return {
    peerConnection,
    remoteStream,
    createPeerConnection,
    addIceCandidate,
    processPendingIceCandidates,
    cleanup,
    setToUserId: (userId: string) => {
      toUserIdRef.current = userId;
    },
  };
};
