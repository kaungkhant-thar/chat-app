"use client";

import { Button } from "@web/components/ui/button";
import { useWebRTC } from "@web/hooks/use-webrtc";
import { PhoneCall } from "lucide-react";
import React from "react";

const Call = ({ userId }: { userId: string }) => {
  const { localStream, remoteStream, startCall } = useWebRTC();

  const handleCall = () => {
    startCall(userId);
  };
  return (
    <div>
      <Button onClick={handleCall}>
        <PhoneCall />
      </Button>

      <div className="flex gap-3">
        {localStream && (
          <video
            autoPlay
            playsInline
            ref={(video) => {
              if (video) {
                video.srcObject = localStream;
              }
            }}
            style={{ width: "300px", height: "300px" }}
          />
        )}

        {remoteStream && (
          <video
            autoPlay
            playsInline
            ref={(video) => {
              if (video) {
                video.srcObject = remoteStream;
              }
            }}
            style={{ width: "300px", height: "300px" }}
          />
        )}
      </div>
    </div>
  );
};

export default Call;
