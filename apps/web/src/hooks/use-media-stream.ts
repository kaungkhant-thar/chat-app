import { useState, useCallback } from "react";
import { MediaStreamConfig } from "./types/webrtc";

export const useMediaStream = (
  config: MediaStreamConfig = { video: true, audio: true }
) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const startStream = useCallback(async () => {
    try {
      // First try to get the stream with ideal constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: config.video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
              facingMode: "user",
            }
          : false,
      };

      console.log("Requesting media stream with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Log stream details for debugging
      console.log("Media stream obtained:", {
        tracks: stream.getTracks().map((track) => ({
          kind: track.kind,
          id: track.id,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          constraints: track.getConstraints(),
        })),
      });

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
      console.log("Stopping media stream");
      localStream.getTracks().forEach((track) => {
        console.log(`Stopping track: ${track.kind}`, {
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
        });
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
      console.log(`Toggling audio track ${track.id}:`, {
        wasEnabled: track.enabled,
        willBe: !track.enabled,
      });
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
