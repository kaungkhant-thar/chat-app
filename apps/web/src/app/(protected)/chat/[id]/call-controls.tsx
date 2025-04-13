"use client";

import React from "react";
import { Button } from "@web/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@web/components/ui/dialog";
import { Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import Call from "@web/app/(protected)/chat/[id]/call";
import { useWebRTC } from "@web/hooks/use-webrtc";
import { VisuallyHidden } from "@web/components/ui/visually-hidden";

type CallControlsProps = {
  userId: string;
};

const CallControls = ({ userId }: CallControlsProps) => {
  const [isCallModalOpen, setIsCallModalOpen] = React.useState(false);
  console.log({ isCallModalOpen });
  const [callType, setCallType] = React.useState<"video" | "audio" | null>(
    null
  );
  const { callState, startCall, endCall } = useWebRTC();

  const handleStartCall = (type: "video" | "audio") => {
    setCallType(type);
    setIsCallModalOpen(true);
    startCall(userId);
  };

  const handleEndCall = () => {
    endCall();
    setIsCallModalOpen(false);
    setCallType(null);
  };

  return (
    <>
      {!callState.isCallActive ? (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleStartCall("video")}
            title="Start video call"
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleStartCall("audio")}
            title="Start audio call"
          >
            <Phone className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <Button
          variant="destructive"
          size="icon"
          onClick={handleEndCall}
          title="End call"
        >
          {callType === "video" ? (
            <VideoOff className="h-5 w-5" />
          ) : (
            <PhoneOff className="h-5 w-5" />
          )}
        </Button>
      )}

      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogTitle>
          <VisuallyHidden>Calling</VisuallyHidden>
        </DialogTitle>

        <DialogContent className="max-w-4xl">
          <Call userId={userId} isAudioOnly={false} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CallControls;
