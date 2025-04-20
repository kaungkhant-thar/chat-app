"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@web/components/ui/button";
import { useWebRTCContext } from "@web/context/webrtc.context";
import { useTRPC } from "@web/lib/trpc";
import { Mic, MicOff, PhoneOff, User } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@web/lib/utils";
import { RemoteVideo } from "./remote-stream";

type CallProps = {
  userId: string;
  isAudioOnly?: boolean;
  onEndCall: () => void;
};

const Call = ({ userId, isAudioOnly = false, onEndCall }: CallProps) => {
  const {
    localStream,
    remoteStream,
    startCall,
    endCall,
    toggleMute,
    callState,
  } = useWebRTCContext();

  const trpc = useTRPC();
  const { data: user, isLoading } = useQuery(
    trpc.findUserById.queryOptions({ id: userId })
  );

  if (isAudioOnly) {
    return (
      <div className="flex flex-col items-center gap-8 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-xl">
          <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg shadow-lg">
            <div className="w-24 h-24 rounded-full bg-background grid place-items-center shadow-inner">
              <User className="w-12 h-12" />
            </div>
            <div className="text-lg font-medium">You</div>
            {callState.isMuted && (
              <div className="text-sm text-destructive">Muted</div>
            )}
            {localStream && (
              <audio
                autoPlay
                playsInline
                muted
                ref={(audio) => {
                  if (audio) {
                    audio.srcObject = localStream;
                  }
                }}
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg shadow-lg">
            <div className="w-24 h-24 rounded-full bg-background grid place-items-center shadow-inner">
              <User className="w-12 h-12" />
            </div>
            <div className="text-lg font-medium">
              {user?.name || "Remote User"}
            </div>
            <div className="text-sm text-muted-foreground">
              {remoteStream ? "Connected" : "Connecting..."}
            </div>
            {remoteStream && (
              <audio
                autoPlay
                playsInline
                ref={(audio) => {
                  if (audio) {
                    audio.srcObject = remoteStream;
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={toggleMute}
            variant={callState.isMuted ? "destructive" : "default"}
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            {callState.isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
          <Button
            onClick={endCall}
            variant="destructive"
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6   to-muted">
      <div className="grid flex-1 grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-xl ring-1 ring-white/10">
          {localStream && (
            <video
              autoPlay
              playsInline
              muted
              ref={(video) => {
                if (video) {
                  video.srcObject = localStream;
                }
              }}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
            You
          </div>
          {callState.isMuted && (
            <div className="absolute top-3 right-3 bg-destructive/90 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              Muted
            </div>
          )}
        </div>

        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-xl ring-1 ring-white/10">
          {remoteStream ? (
            <video
              autoPlay
              playsInline
              ref={(video) => {
                if (video) {
                  video.srcObject = remoteStream;
                }
              }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/95 text-center p-4">
              <span className="text-white text-lg font-medium mb-2">
                {!callState.isCallActive
                  ? "Call ended"
                  : "Waiting for connection..."}
              </span>
              <span className="text-gray-400 text-sm">
                {!callState.isCallActive
                  ? "You can close this window"
                  : user?.name}
              </span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
            {user?.name || "Remote User"}
          </div>
        </div>
      </div>

      <div className="flex gap-4 pb-4">
        <Button
          onClick={toggleMute}
          variant={callState.isMuted ? "destructive" : "default"}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 p-0 shadow-lg transition-transform hover:scale-105",
            !callState.isMuted && "bg-primary hover:bg-primary/90"
          )}
        >
          {callState.isMuted ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
        <Button
          onClick={onEndCall}
          variant="destructive"
          size="lg"
          className="rounded-full w-14 h-14 p-0 shadow-lg transition-transform hover:scale-105"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default Call;
