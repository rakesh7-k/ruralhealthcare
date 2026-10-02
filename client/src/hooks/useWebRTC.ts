import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../services/socketService';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isClinicalNote?: boolean;
}

export interface PeerUser {
  socketId: string;
  userId: string;
  name: string;
  role: string;
  facility?: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
}

interface UseWebRTCOptions {
  roomId: string;
  user: {
    id: string;
    name: string;
    role: string;
    facility?: string;
  };
  onRemoteVitals?: (vitals: any) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTC({ roomId, user, onRemoteVitals }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  >('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUsingSyntheticVideo, setIsUsingSyntheticVideo] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0); // 0-100 for speaking indicator

  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const canvasAnimRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const originalCameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const onRemoteVitalsRef = useRef(onRemoteVitals);
  onRemoteVitalsRef.current = onRemoteVitals;

  // Generate synthetic stream when real camera/mic is unavailable
  const createSyntheticMediaStream = useCallback((): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let tick = 0;
    const draw = () => {
      if (!ctx) return;
      tick += 0.05;

      // Clean clinical backdrop gradient
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Medical cross / avatar circle
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.arc(320, 200, 70, 0, Math.PI * 2);
      ctx.fill();

      // Initials
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = (user.name || 'MD')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2);
      ctx.fillText(initials, 320, 200);

      // User name & role banner
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(user.name, 320, 310);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#5eead4';
      ctx.fillText(`${user.role} • ${user.facility || 'SETHU Telemedicine'}`, 320, 340);

      // Animated ECG rhythm line across bottom
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x < 640; x += 10) {
        const pulse = Math.sin((x + tick * 80) * 0.05) * 12 * Math.exp(-Math.pow(((x % 160) - 80) / 30, 2) * 2);
        const y = 430 - pulse;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      canvasAnimRef.current = requestAnimationFrame(draw);
    };

    draw();
    const stream = canvas.captureStream(24);

    // Add silent audio track
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();
      const silentTrack = dst.stream.getAudioTracks()[0];
      if (silentTrack) {
        silentTrack.enabled = false;
        stream.addTrack(silentTrack);
      }
    } catch (e) {
      console.warn('AudioContext silent track error:', e);
    }

    return stream;
  }, [user.name, user.role, user.facility]);

  // Setup local media
  useEffect(() => {
    let active = true;

    async function initLocalStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { max: 30 } },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsUsingSyntheticVideo(false);

        // Setup audio analyser for speaking activity meter
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setMicAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            requestAnimationFrame(checkVolume);
          };
          checkVolume();
        } catch (e) {
          // Audio visualizer optional
        }
      } catch (err) {
        console.warn('[WebRTC] Native webcam/mic unavailable, activating synthetic camera simulation:', err);
        const synthStream = createSyntheticMediaStream();
        localStreamRef.current = synthStream;
        setLocalStream(synthStream);
        setIsUsingSyntheticVideo(true);
      }
    }

    initLocalStream();

    return () => {
      active = false;
      if (canvasAnimRef.current) cancelAnimationFrame(canvasAnimRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [createSyntheticMediaStream]);

  // Initialize Socket.io and PeerConnection
  useEffect(() => {
    if (!roomId) return;
    const socket = getSocket();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Attach local stream tracks to PeerConnection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote track
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const inboundStream = new MediaStream([event.track]);
        setRemoteStream(inboundStream);
      }
      setConnectionStatus('connected');
    };

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal-ice-candidate', {
          targetSocketId: peers[0]?.socketId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionStatus('connected');
      } else if (pc.iceConnectionState === 'disconnected') {
        setConnectionStatus('reconnecting');
      } else if (pc.iceConnectionState === 'failed') {
        setConnectionStatus('disconnected');
      }
    };

    // Join room
    socket.emit('join-room', {
      roomId,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        facility: user.facility,
      },
    });

    // Room existing users
    socket.on('room-users', async ({ users, chatHistory }: { users: PeerUser[]; chatHistory: ChatMessage[] }) => {
      console.log('[WebRTC] Existing users in room:', users);
      setPeers(users);
      if (chatHistory && chatHistory.length > 0) {
        setMessages(chatHistory);
      }

      // If there's an existing user, create an SDP offer to initiate the peer call
      if (users.length > 0) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('signal-offer', {
            targetSocketId: users[0].socketId,
            offer,
          });
        } catch (err) {
          console.error('[WebRTC] Failed to create offer:', err);
        }
      }
    });

    // Another user joined
    socket.on('user-joined', ({ user: newUser }: { user: PeerUser }) => {
      console.log('[WebRTC] New user joined room:', newUser);
      setPeers((prev) => [...prev.filter((p) => p.socketId !== newUser.socketId), newUser]);
    });

    // Incoming SDP Offer
    socket.on('signal-offer', async ({ senderSocketId, senderUser, offer }: { senderSocketId: string; senderUser: PeerUser; offer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received offer from:', senderSocketId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal-answer', {
          targetSocketId: senderSocketId,
          answer,
        });
      } catch (err) {
        console.error('[WebRTC] Failed to answer offer:', err);
      }
    });

    // Incoming SDP Answer
    socket.on('signal-answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Received answer');
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('[WebRTC] Failed to set remote description on answer:', err);
      }
    });

    // Incoming ICE Candidate
    socket.on('signal-ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('[WebRTC] Failed to add ICE candidate:', err);
      }
    });

    // Incoming Chat Message
    socket.on('chat-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Peer Media State Changed
    socket.on('peer-media-state', ({ socketId, isMuted: pMuted, isVideoOff: pVideoOff, isScreenSharing: pScreenShare }: any) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.socketId === socketId
            ? { ...p, isMuted: pMuted, isVideoOff: pVideoOff, isScreenSharing: pScreenShare }
            : p
        )
      );
    });

    // Remote Vitals Updated
    socket.on('vitals-telemetry-updated', ({ vitals }: { vitals: any }) => {
      if (onRemoteVitalsRef.current) onRemoteVitalsRef.current(vitals);
    });

    // User Left
    socket.on('user-left', ({ socketId }: { socketId: string }) => {
      console.log('[WebRTC] User left:', socketId);
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
      setRemoteStream(null);
      setConnectionStatus('connecting');
    });

    return () => {
      socket.emit('leave-room');
      socket.off('room-users');
      socket.off('user-joined');
      socket.off('signal-offer');
      socket.off('signal-answer');
      socket.off('signal-ice-candidate');
      socket.off('chat-message');
      socket.off('peer-media-state');
      socket.off('vitals-telemetry-updated');
      socket.off('user-left');
      pc.close();
    };
  // NOTE: onRemoteVitals is accessed via ref to avoid re-running this effect
  }, [roomId, user.id, user.name, user.role, user.facility]);

  // Toggle Audio (Mute / Unmute)
  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      getSocket().emit('media-state', {
        roomId,
        isMuted: !audioTrack.enabled,
        isVideoOff,
        isScreenSharing,
      });
    } else {
      setIsMuted((prev) => !prev);
    }
  }, [roomId, isVideoOff, isScreenSharing]);

  // Toggle Video (Camera On / Off)
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
      getSocket().emit('media-state', {
        roomId,
        isMuted,
        isVideoOff: !videoTrack.enabled,
        isScreenSharing,
      });
    } else {
      setIsVideoOff((prev) => !prev);
    }
  }, [roomId, isMuted, isScreenSharing]);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (!pcRef.current || !localStreamRef.current) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
        originalCameraTrackRef.current = currentVideoTrack;

        // Replace track in PeerConnection sender
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        // Update local preview
        localStreamRef.current.removeTrack(currentVideoTrack);
        localStreamRef.current.addTrack(screenTrack);
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          // Screen share cancelled via browser banner
          if (originalCameraTrackRef.current && sender) {
            sender.replaceTrack(originalCameraTrackRef.current);
            localStreamRef.current?.removeTrack(screenTrack);
            localStreamRef.current?.addTrack(originalCameraTrackRef.current);
            setIsScreenSharing(false);
          }
        };

        getSocket().emit('media-state', {
          roomId,
          isMuted,
          isVideoOff,
          isScreenSharing: true,
        });
      } catch (err) {
        console.warn('Screen sharing denied or not available:', err);
      }
    } else {
      // Revert to camera
      if (originalCameraTrackRef.current) {
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        const screenTrack = localStreamRef.current.getVideoTracks()[0];
        if (sender) sender.replaceTrack(originalCameraTrackRef.current);
        screenTrack.stop();
        localStreamRef.current.removeTrack(screenTrack);
        localStreamRef.current.addTrack(originalCameraTrackRef.current);
      }
      setIsScreenSharing(false);
      getSocket().emit('media-state', {
        roomId,
        isMuted,
        isVideoOff,
        isScreenSharing: false,
      });
    }
  }, [isScreenSharing, roomId, isMuted, isVideoOff]);

  // Toggle Rural / Low Bandwidth Mode (optimizes 2G/3G connectivity)
  const toggleLowBandwidthMode = useCallback(() => {
    setIsLowBandwidth((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          try {
            // Apply bandwidth constraints: low framerate & lower resolution to save data
            videoTrack.applyConstraints(
              next
                ? { frameRate: { max: 10 }, width: { max: 480 }, height: { max: 360 } }
                : { frameRate: { ideal: 30 }, width: { ideal: 1280 }, height: { ideal: 720 } }
            );
          } catch (e) {
            console.warn('Could not apply bandwidth constraints to track:', e);
          }
        }
      }
      return next;
    });
  }, []);

  // Capture image snapshot from active video stream
  const captureSnapshot = useCallback((videoElement: HTMLVideoElement | null): string | null => {
    if (!videoElement) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (err) {
      console.error('Failed to capture snapshot from video element:', err);
      return null;
    }
  }, []);

  // Send in-call chat message
  const sendMessage = useCallback((text: string, isClinicalNote: boolean = false) => {
    if (!text.trim()) return;
    const socket = getSocket();
    socket.emit('chat-message', {
      roomId,
      message: {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        text: text.trim(),
        isClinicalNote,
      },
    });
  }, [roomId, user.id, user.name, user.role]);

  // Broadcast vitals telemetry
  const broadcastVitals = useCallback((vitals: any) => {
    const socket = getSocket();
    socket.emit('vitals-telemetry', {
      roomId,
      vitals,
    });
  }, [roomId]);

  return {
    localStream,
    remoteStream,
    connectionStatus,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isLowBandwidth,
    peers,
    messages,
    isUsingSyntheticVideo,
    micAudioLevel,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleLowBandwidthMode,
    captureSnapshot,
    sendMessage,
    broadcastVitals,
  };
}
