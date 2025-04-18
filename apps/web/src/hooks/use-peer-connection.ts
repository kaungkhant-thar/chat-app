import { useState, useCallback, useRef, useEffect } from "react";
import { useSocket } from "@web/context/socket.context";
import { PeerConnectionConfig } from "./types/webrtc";

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: `stun:${process.env.NEXT_PUBLIC_TURN_URL}:3478`,
  },
  {
    urls: `turn:${process.env.NEXT_PUBLIC_TURN_URL}:3478`,
    username: process.env.NEXT_PUBLIC_TURN_USERNAME,
    credential: process.env.NEXT_PUBLIC_TURN_PASSWORD,
  },
];

const MAX_RECONNECT_ATTEMPTS = 3;

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

  // State management
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");
  const [iceConnectionState, setIceConnectionState] =
    useState<RTCIceConnectionState>("new");
  const [signalingState, setSignalingState] =
    useState<RTCSignalingState>("stable");
  const [error, setError] = useState<Error | null>(null);

  // Refs for managing connection
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const toUserIdRef = useRef("");
  const reconnectAttemptsRef = useRef(0);

  const cleanup = useCallback(() => {
    if (!peerConnection) return;

    try {
      peerConnection.close();
      setPeerConnection(null);
      setRemoteStream(null);
      pendingIceCandidatesRef.current = [];
      toUserIdRef.current = "";
      reconnectAttemptsRef.current = 0;
      setError(null);
    } catch (error) {
      console.error("Error closing peer connection:", error);
      setError(error as Error);
    }
  }, [peerConnection]);

  const handleConnectionStateChange = useCallback(
    (pc: RTCPeerConnection) => {
      setConnectionState(pc.connectionState);

      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        setRemoteStream(null);
        setError(new Error(`Connection ${pc.connectionState}`));

        if (
          pc.connectionState === "disconnected" &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          console.log("Attempting to reconnect...");
          reconnectAttemptsRef.current++;
          cleanup();
          createPeerConnection();
        }
      }
    },
    [cleanup]
  );

  const setupPeerConnectionListeners = useCallback(
    (pc: RTCPeerConnection) => {
      pc.onconnectionstatechange = () => handleConnectionStateChange(pc);

      pc.oniceconnectionstatechange = () => {
        setIceConnectionState(pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
          setError(new Error("ICE connection failed"));
        }
      };

      pc.onsignalingstatechange = () => {
        setSignalingState(pc.signalingState);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket?.connected) {
          socket.emit("webrtc-ice-candidate", {
            toUserId: toUserIdRef.current,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams[0]) {
          setRemoteStream(event.streams[0]);

          // Monitor track state
          event.track.onended = () =>
            console.log("Remote track ended:", event.track.id);
          event.track.onmute = () =>
            console.log("Remote track muted:", event.track.id);
          event.track.onunmute = () =>
            console.log("Remote track unmuted:", event.track.id);

          // Monitor stream removal
          event.streams[0].onremovetrack = () => {
            if (event.streams[0].getTracks().length === 0) {
              setRemoteStream(null);
            }
          };
        }
      };
    },
    [socket, handleConnectionStateChange]
  );

  const createPeerConnection = useCallback(() => {
    try {
      const pc = new RTCPeerConnection(config);
      setupPeerConnectionListeners(pc);
      setPeerConnection(pc);
      return pc;
    } catch (err) {
      console.error("Error creating peer connection:", err);
      setError(err as Error);
      return null;
    }
  }, [config, setupPeerConnectionListeners]);

  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidate) => {
      if (!peerConnection) {
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }

      try {
        if (peerConnection.remoteDescription) {
          await peerConnection.addIceCandidate(candidate);
        } else {
          pendingIceCandidatesRef.current.push(candidate);
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
        setError(error as Error);
      }
    },
    [peerConnection]
  );

  const processPendingIceCandidates = useCallback(async () => {
    if (!peerConnection) return;

    const candidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of candidates) {
      await addIceCandidate(candidate);
    }
  }, [peerConnection, addIceCandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    peerConnection,
    remoteStream,
    connectionState,
    iceConnectionState,
    signalingState,
    error,
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
