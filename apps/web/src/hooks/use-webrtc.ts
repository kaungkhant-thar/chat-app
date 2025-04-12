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
          pc.addTrack(track);
        });

        pc.onicecandidate = (event) => {
          console.log("on ice candidate", event);
          if (event.candidate) {
            console.log("emitting ice candidate", event.candidate);
            socket?.emit("ice-candidate", {
              toUserId: toUserIdRef.current,
              candidaate: event.candidate,
            });
          }
        };
        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          setRemoteStream(remoteStream);
        };
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });

    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, []);

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
    console.log({ candidate }, "adding ice candidate");
    if (!peerConnection) return;

    peerConnection.addIceCandidate(candidate).catch((error) => {
      console.error("Error adding ice candidate", error);
    });
  };

  useEffect(() => {
    socket?.on("incoming-call", (data) => {
      const { fromUserId, offer, type } = data;

      if (
        window.confirm(
          `Incoming call from ${fromUserId}. Do you want to answer?`
        )
      ) {
        answerCall(fromUserId, offer);
      }
    });

    socket?.on("call-answered", (data) => {
      const { fromUserId, answer } = data;
      peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket?.on("ice-candidate", (data) => {
      const { fromUserId, candidate } = data;
      console.log({ candidate }, "ice candidate");

      addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socket?.off("incoming-call");
      socket?.off("call-answered");
      socket?.off("ice-candidate");
    };
  }, [peerConnection]);

  return {
    localStream,
    remoteStream,
    startCall,
    answerCall,
  };
};
