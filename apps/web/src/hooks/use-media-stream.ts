import { useState, useCallback } from "react";
import { MediaStreamConfig } from "./types/webrtc";

export const useMediaStream = (
  config: MediaStreamConfig = { video: true, audio: true }
) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const startStream = useCallback(async () => {
    try {
      const stream = await window.navigator.mediaDevices.getUserMedia(config);
      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [config]);

  const stopStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;

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
