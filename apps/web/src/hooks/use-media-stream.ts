import { useState, useCallback } from "react";
import { MediaStreamConfig } from "./types/webrtc";

export const useMediaStream = (
  config: MediaStreamConfig = { video: true, audio: true }
) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const startStream = useCallback(async () => {
    try {
      const constraints = {
        audio: true,
        video: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Set up track event listeners
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          console.log(`Track ${track.id} ended`);
        };
        track.onmute = () => {
          console.log(`Track ${track.id} muted`);
        };
        track.onunmute = () => {
          console.log(`Track ${track.id} unmuted`);
        };
      });

      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (err) {
      console.error("Error getting media stream:", err);

      // If failed with ideal constraints, try with minimum constraints
      try {
        const minConstraints = {
          audio: config.audio,
          video: config.video
            ? {
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 24 },
              }
            : false,
        };

        console.log("Retrying with minimum constraints:", minConstraints);
        const stream = await navigator.mediaDevices.getUserMedia(
          minConstraints
        );
        setLocalStream(stream);
        setError(null);
        return stream;
      } catch (fallbackErr) {
        console.error(
          "Error getting media stream with minimum constraints:",
          fallbackErr
        );
        setError(fallbackErr as Error);
        return null;
      }
    }
  }, [config]);

  const stopStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(null);
    }
  }, [localStream]);

  const toggleMute = useCallback(() => {
    if (!localStream) {
      console.warn("No local stream to toggle mute");
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
  }, [localStream]);

  return {
    localStream,
    error,
    startStream,
    stopStream,
    toggleMute,
  };
};
