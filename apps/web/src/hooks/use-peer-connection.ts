// ✅ CLEANED & FIXED: usePeerConnection.ts
type IceServerResponse = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

import { useState, useCallback, useRef, useEffect } from "react";
import { useSocket } from "@web/context/socket.context";
import { useQuery } from "@tanstack/react-query";

const fetchTurnCredentials = async (): Promise<IceServerResponse[]> => {
  try {
    const res = await fetch(
      `https://kkt.metered.live/api/v1/turn/credentials?apiKey=${process.env.NEXT_PUBLIC_METERED_API_KEY}`
    );
    return await res.json();
  } catch {
    return [
      {
        urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
      },
    ];
  }
};

const MAX_RECONNECT_ATTEMPTS = 3;

export const usePeerConnection = () => {
  const { socket } = useSocket();
  const { data: iceServers } = useQuery({
    queryKey: ["iceServers"],
    queryFn: fetchTurnCredentials,
  });

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

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const toUserIdRef = useRef("");
  const reconnectAttemptsRef = useRef(0);
  const addedCandidates = useRef<Set<string>>(new Set());

  const cleanup = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setPeerConnection(null);
    setRemoteStream(null);
    pendingIceCandidatesRef.current = [];
    toUserIdRef.current = "";
    reconnectAttemptsRef.current = 0;
    addedCandidates.current.clear();
  }, []);

  const handleConnectionStateChange = useCallback(
    (pc: RTCPeerConnection) => {
      setConnectionState(pc.connectionState);
      if (
        pc.connectionState === "disconnected" &&
        reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectAttemptsRef.current++;
        cleanup();
        createPeerConnection();
      }
      if (pc.connectionState === "failed") {
        setError(new Error("Connection failed"));
      }
    },
    [cleanup]
  );

  const setupPeerConnectionListeners = useCallback(
    (pc: RTCPeerConnection) => {
      pc.onconnectionstatechange = () => handleConnectionStateChange(pc);
      pc.oniceconnectionstatechange = () =>
        setIceConnectionState(pc.iceConnectionState);
      pc.onicecandidate = ({ candidate }) => {
        if (!candidate || !candidate.candidate.includes("typ relay")) return;
        if (!addedCandidates.current.has(candidate.candidate)) {
          addedCandidates.current.add(candidate.candidate);
          socket?.emit("webrtc-ice-candidate", {
            toUserId: toUserIdRef.current,
            candidate,
          });
        }
      };
      pc.onsignalingstatechange = () => setSignalingState(pc.signalingState);
      pc.ontrack = (event) => {
        const stream = event.streams?.[0];
        if (!stream) return;
        setRemoteStream(stream);
      };
    },
    [socket, handleConnectionStateChange]
  );

  const createPeerConnection = useCallback(() => {
    if (!iceServers || iceServers.length === 0) {
      console.warn("❌ ICE servers not ready");
      return null;
    }

    const pc = new RTCPeerConnection({
      iceTransportPolicy: "relay",
      iceServers,
    });
    peerConnectionRef.current = pc;
    setPeerConnection(pc);
    setupPeerConnectionListeners(pc);
    return pc;
  }, [iceServers, setupPeerConnectionListeners]);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
    if (
      !candidate?.candidate ||
      addedCandidates.current.has(candidate.candidate)
    )
      return;

    if (
      !peerConnectionRef.current ||
      !peerConnectionRef.current.remoteDescription
    ) {
      pendingIceCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
      addedCandidates.current.add(candidate.candidate);
      console.log("✅ ICE candidate added");
    } catch (err) {
      console.error("❌ Failed to add ICE candidate", err);
      setError(err as Error);
    }
  }, []);

  const processPendingIceCandidates = useCallback(async () => {
    if (!peerConnectionRef.current) return;
    for (const candidate of pendingIceCandidatesRef.current) {
      await addIceCandidate(candidate);
    }
    pendingIceCandidatesRef.current = [];
  }, [addIceCandidate]);

  useEffect(() => cleanup, [cleanup]);

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
    pendingIceCandidatesRef,
  };
};
