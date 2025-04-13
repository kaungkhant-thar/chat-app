import { useSocket } from "@web/context/socket.context";
import { useEffect, useRef, useState } from "react";

export const useWebRTC = () => {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] =
    useState<RTCPeerConnection | null>(null);
  const toUserIdRef = useRef("");

  useEffect(() => {
    if (!socket?.connected) return;

    window.navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);

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

        setPeerConnection(pc);
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });

    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [socket?.connected]);

  useEffect(() => {
    if (!socket?.connected) return;

    socket?.on("webrtc-ice-candidate", (data) => {
      const { candidate } = data;
      if (!candidate) return;
      addIceCandidate(new RTCIceCandidate(candidate));
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
      peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    return () => {
      socket?.off("webrtc-ice-candidate");
      socket?.off("incoming-call");
      socket?.off("call-answered");
    };
  }, [socket?.connected, peerConnection]);

  const startCall = (toUserId: string) => {
    if (!peerConnection || !localStream) return;
    toUserIdRef.current = toUserId;

    peerConnection
      .createOffer()
      .then((offer) => peerConnection.setLocalDescription(offer))
      .then(() => {
        socket?.emit("start-call", {
          toUserId,
          offer: peerConnection.localDescription,
          type: "video",
        });
      })
      .catch((error) => {
        console.error("Error creating offer", error);
      });
  };

  const answerCall = (toUserId: string, offer: RTCSessionDescriptionInit) => {
    if (!peerConnection) return;

    peerConnection
      .setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => peerConnection.createAnswer())
      .then((answer) => peerConnection.setLocalDescription(answer))
      .then(() => {
        socket?.emit("answer-call", {
          toUserId,
          answer: peerConnection.localDescription,
        });
      })
      .catch((error) => {
        console.error("Error creating answer", error);
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
  };
};
