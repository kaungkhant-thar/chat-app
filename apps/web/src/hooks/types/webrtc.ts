export type CallState = {
  isMuted: boolean;
  isCallActive: boolean;
  isInitiator: boolean;
  type: "video" | "audio";
  signalingState: RTCSignalingState;
};

export type MediaStreamConfig = {
  video: boolean;
  audio: boolean;
};

export type PeerConnectionConfig = {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize?: number;
  iceTransportPolicy?: "all" | "relay";
  bundlePolicy?: RTCBundlePolicy;
  rtcpMuxPolicy?: RTCRtcpMuxPolicy;
  sdpSemantics?: "unified-plan" | "plan-b";
};
