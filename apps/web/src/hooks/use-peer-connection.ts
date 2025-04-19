import { useState, useCallback, useRef, useEffect } from "react";
import { useSocket } from "@web/context/socket.context";
import { PeerConnectionConfig } from "./types/webrtc";
import { useQuery } from "@tanstack/react-query";

const fetchTurnCredentials = async () => {
  try {
    const response = await fetch(
      `https://kkt.metered.live/api/v1/turn/credentials?apiKey=${process.env.NEXT_PUBLIC_METERED_API_KEY}`
    );
    return await response.json();
  } catch (error) {
    console.error("Error fetching TURN credentials:", error);
    // Fallback to Google STUN servers if Metered fails
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
  console.log({ iceServers });

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
      pc.onconnectionstatechange = () => {
        console.log("Connection state changed:", {
          connectionState: pc.connectionState,
          iceConnectionState: pc.iceConnectionState,
          iceGatheringState: pc.iceGatheringState,
          signalingState: pc.signalingState,
        });

        if (pc.connectionState === "failed") {
          console.log("Connection failed, attempting reconnection...");
          // Close the existing connection
          pc.close();
          // Create a new connection after a short delay
          setTimeout(() => {
            if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
              console.log("Attempting reconnection...");
              reconnectAttemptsRef.current++;
              createPeerConnection();
            } else {
              console.log("Max reconnection attempts reached");
              setError(
                new Error(
                  "Failed to establish connection after multiple attempts"
                )
              );
            }
          }, 1000);
        }
        handleConnectionStateChange(pc);
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state changed:", {
          state: pc.iceConnectionState,
          gatheringState: pc.iceGatheringState,
        });
        setIceConnectionState(pc.iceConnectionState);

        if (pc.iceConnectionState === "disconnected") {
          console.log("ICE disconnected, checking connection...");
          // Give it some time to recover naturally
          setTimeout(() => {
            if (pc.iceConnectionState === "disconnected") {
              console.log("ICE still disconnected, attempting restart...");
              pc.restartIce();
            }
          }, 3000);
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log("ICE gathering state:", pc.iceGatheringState);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("New ICE candidate:", {
            type: event.candidate.type,
            protocol: event.candidate.protocol,
            address: event.candidate.address,
            port: event.candidate.port,
          });
          if (socket?.connected) {
            socket.emit("webrtc-ice-candidate", {
              toUserId: toUserIdRef.current,
              candidate: event.candidate,
            });
          }
        }
      };

      pc.onicecandidateerror = (event) => {
        console.error("ICE candidate error:", {
          errorCode: event.errorCode,
          errorText: event.errorText,
          url: event.url,
          address: event.address,
          port: event.port,
        });
      };

      pc.onsignalingstatechange = () => {
        setSignalingState(pc.signalingState);
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
      const pc = new RTCPeerConnection({
        iceServers: iceServers || [],
        iceTransportPolicy: "relay",
      });
      setupPeerConnectionListeners(pc);
      setPeerConnection(pc);
      return pc;
    } catch (err) {
      console.error("Error creating peer connection:", err);
      setError(err as Error);
      return null;
    }
  }, [iceServers, setupPeerConnectionListeners]);

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
