import { useState, useCallback, useRef } from "react";
import { useSocket } from "@web/context/socket.context";
import { PeerConnectionConfig } from "./types/webrtc";

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  // Add your TURN server configuration here if you have one
  // {
  //   urls: "turn:your-turn-server.com:3478",
  //   username: "username",
  //   credential: "credential"
  // }
];

export const usePeerConnection = (
  config: PeerConnectionConfig = {
    iceServers: DEFAULT_ICE_SERVERS,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: "all",
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require" as const,
  }
) => {
  const { socket } = useSocket();
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");
  const [iceConnectionState, setIceConnectionState] =
    useState<RTCIceConnectionState>("new");
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const toUserIdRef = useRef("");
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 3;

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

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (
        pc.connectionState === "failed" &&
        reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectAttemptsRef.current += 1;
        // Attempt to reconnect
        cleanup();
        createPeerConnection();
      }
    };

    pc.oniceconnectionstatechange = () => {
      setIceConnectionState(pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.error("ICE connection failed");
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          cleanup();
          createPeerConnection();
        }
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("ICE gathering state:", pc.iceGatheringState);
    };

    setPeerConnection(pc);
    return pc;
  }, [config, socket]);

  const addIceCandidate = useCallback(
    (candidate: RTCIceCandidate) => {
      if (!peerConnection) return;

      if (peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(candidate).catch((error) => {
          console.error("Error adding ICE candidate:", error);
        });
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
    reconnectAttemptsRef.current = 0;
  }, [peerConnection]);

  return {
    peerConnection,
    remoteStream,
    connectionState,
    iceConnectionState,
    createPeerConnection,
    addIceCandidate,
    processPendingIceCandidates,
    cleanup,
    setToUserId: (userId: string) => {
      toUserIdRef.current = userId;
    },
    toUserId: toUserIdRef.current,
  };
};
