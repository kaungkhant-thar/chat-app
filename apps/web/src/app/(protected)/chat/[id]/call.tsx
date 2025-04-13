"use client";

import { Button } from "@web/components/ui/button";
import { useWebRTC } from "@web/hooks/use-webrtc";
import { Mic, MicOff, PhoneOff, User } from "lucide-react";
import React, { useState } from "react";

type CallProps = {
  userId: string;
  isAudioOnly?: boolean;
};

const Call = ({ userId, isAudioOnly = false }: CallProps) => {
  const {
    localStream,
    remoteStream,
    startCall,
    endCall,
    toggleMute,
    callState,
  } = useWebRTC();

  console.log({ localStream, remoteStream });
  if (isAudioOnly) {
    return (
      <div className="flex flex-col items-center gap-8 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-xl">
          <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg">
            <div className="w-24 h-24 rounded-full bg-background grid place-items-center">
              <User className="w-12 h-12" />
            </div>
            <div className="text-lg font-medium">You</div>
            {callState.isMuted && (
              <div className="text-sm text-destructive">Muted</div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 p-8 bg-muted rounded-lg">
            <div className="w-24 h-24 rounded-full bg-background grid place-items-center">
              <User className="w-12 h-12" />
            </div>
            <div className="text-lg font-medium">Remote User</div>
            <div className="text-sm text-muted-foreground">
              {remoteStream ? "Connected" : "Connecting..."}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={toggleMute}
            variant={callState.isMuted ? "destructive" : "default"}
            size="lg"
          >
            {callState.isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
          <Button onClick={endCall} variant="destructive" size="lg">
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
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
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
            You
          </div>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
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
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <span className="text-white">
                {!callState.isCallActive
                  ? "Call ended"
                  : "Waiting for connection..."}
              </span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
            Remote
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={toggleMute}
          variant={callState.isMuted ? "destructive" : "default"}
          size="lg"
        >
          {callState.isMuted ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
        <Button onClick={endCall} variant="destructive" size="lg">
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default Call;
