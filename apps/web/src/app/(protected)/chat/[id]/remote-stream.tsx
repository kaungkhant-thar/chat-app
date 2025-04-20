import { useRef, useEffect } from "react";

export const RemoteVideo = ({
  remoteStream,
}: {
  remoteStream: MediaStream | null;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoEl = videoRef.current;

    if (!videoEl || !remoteStream) return;

    videoEl.srcObject = remoteStream;

    videoEl
      .play()
      .then(() => console.log("🔊 Remote video playing"))
      .catch((err) => console.log("❌ Remote video play error:", err));
  }, [remoteStream]);

  return (
    <>
      <h1>Hello</h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={true}
        style={{
          width: "100%",
          maxHeight: "300px",
          backgroundColor: "black",
          border: "4px dashed lime",
          zIndex: 9999,
        }}
      />
    </>
  );
};
