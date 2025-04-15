import { useState, useCallback, useRef } from "react";
import { useSocket } from "@web/context/socket.context";
import { PeerConnectionConfig } from "./types/webrtc";

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:80?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
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
    console.log("Creating new peer connection");
    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket?.connected) {
        console.log("Sending ICE candidate:", event.candidate);
        socket.emit("webrtc-ice-candidate", {
          toUserId: toUserIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("ICE gathering state:", pc.iceGatheringState);
      if (pc.iceGatheringState === "complete") {
        console.log("ICE gathering completed");
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state changed:", pc.iceConnectionState);
      setIceConnectionState(pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.error("ICE connection failed");
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          console.log("Attempting to reconnect ICE connection");
          reconnectAttemptsRef.current += 1;
          cleanup();
          createPeerConnection();
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state changed:", pc.connectionState);
      setConnectionState(pc.connectionState);
      if (
        pc.connectionState === "failed" &&
        reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        console.log("Connection failed, attempting to reconnect");
        reconnectAttemptsRef.current += 1;
        cleanup();
        createPeerConnection();
      }
    };

    pc.ontrack = (event) => {
      console.log("Received remote track");
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
    console.log("Cleaning up peer connection");
    if (peerConnection) {
      try {
        peerConnection.close();
      } catch (error) {
        console.error("Error closing peer connection:", error);
      }
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
