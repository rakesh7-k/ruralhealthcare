import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchTeleconsultationById, saveTeleconsultationSnapshotApi } from '../../services/teleconsultService';
import { useAuthStore } from '../../stores/authStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import {
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Stethoscope,
  Activity,
  HeartPulse,
  Camera,
  MessageSquare,
  Wifi,
  WifiOff,
  Send,
  User,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function UniversalTeleconsultRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, activeRole } = useAuthStore();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [vitalsInput, setVitalsInput] = useState({ bp: '150/95', spo2: '96', hr: '98' });

  const {
    localStream,
    remoteStream,
    connectionStatus,
    isMuted,
    isVideoOff,
    isLowBandwidth,
    peers,
    messages,
    micAudioLevel,
    toggleAudio,
    toggleVideo,
    toggleLowBandwidthMode,
    captureSnapshot,
    sendMessage,
    broadcastVitals,
  } = useWebRTC({
    roomId: id || 'tc-default',
    user: {
      id: user?.id || 'usr-participant',
      name: user?.fullName || 'Participant',
      role: activeRole || 'WORKER',
      facility: 'Thenkarai Sub-Centre',
    },
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetchTeleconsultationById(id)
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load teleconsultation:', err))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const handlePushVitals = () => {
    broadcastVitals({
      bloodPressureSystolic: parseInt(vitalsInput.bp.split('/')[0]) || 120,
      bloodPressureDiastolic: parseInt(vitalsInput.bp.split('/')[1]) || 80,
      oxygenSaturation: parseInt(vitalsInput.spo2) || 98,
      heartRate: parseInt(vitalsInput.hr) || 72,
    });
    alert('Updated vitals broadcasted live to the consulting doctor!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wide">
            Connecting to secure teleconsultation session...
          </p>
        </div>
      </div>
    );
  }

  const tc = data?.teleconsult;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-6 space-y-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Call</span>
        </button>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>LIVE WebRTC • {formatDuration(callDuration)}</span>
          </span>
          <span className="px-3 py-1 bg-slate-900 rounded-xl border border-slate-800 font-mono">
            {connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Call View */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* VIDEO CONTAINER (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative bg-slate-900 rounded-3xl border border-slate-800 aspect-video overflow-hidden shadow-2xl flex items-center justify-center">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-20 h-20 rounded-full bg-emerald-900/60 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-300 font-black text-2xl">
                  DR
                </div>
                <h3 className="text-lg font-bold text-white">
                  {tc?.specialist_name || 'Consulting Doctor'}
                </h3>
                <p className="text-xs text-slate-400">
                  {peers.length > 0
                    ? `Connected with ${peers[0].name}`
                    : 'Awaiting doctor to join video room...'}
                </p>
              </div>
            )}

            {/* Remote Doctor Badge */}
            <div className="absolute top-4 left-4 z-20">
              <span className="bg-slate-900/80 backdrop-blur border border-slate-700/60 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{tc?.specialist_name || 'Doctor'} (Consulting Room)</span>
              </span>
            </div>

            {/* Self-view PIP */}
            <div className="absolute bottom-4 right-4 z-20 w-36 sm:w-44 aspect-video bg-slate-800/90 backdrop-blur rounded-2xl border border-slate-700 overflow-hidden">
              {isVideoOff ? (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                  Camera Off
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                />
              )}
              <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px]">
                You
              </div>
            </div>

            {/* Floating Call Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 bg-slate-900/90 backdrop-blur px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl">
              <button
                type="button"
                onClick={toggleAudio}
                className={`p-2.5 rounded-xl transition-all ${
                  !isMuted ? 'bg-slate-800 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {!isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleVideo}
                className={`p-2.5 rounded-xl transition-all ${
                  !isVideoOff ? 'bg-slate-800 text-white' : 'bg-rose-600 text-white'
                }`}
              >
                {!isVideoOff ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleLowBandwidthMode}
                className={`p-2.5 rounded-xl transition-all ${
                  isLowBandwidth ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
                title="Toggle Low Bandwidth Mode"
              >
                {isLowBandwidth ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowChat(!showChat)}
                className={`p-2.5 rounded-xl transition-all relative ${
                  showChat ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                {messages.length > 0 && !showChat && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
                    {messages.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* In-Call Chat */}
          {showChat && (
            <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 space-y-3">
              <div className="h-36 overflow-y-auto space-y-2 text-xs">
                {messages.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No messages yet.</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2 rounded-xl max-w-[85%] ${
                        m.senderId === user?.id
                          ? 'ml-auto bg-emerald-950 border border-emerald-800 text-emerald-100'
                          : 'bg-slate-950 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <span className="font-bold text-[10px] block text-slate-400">{m.senderName}</span>
                      <p className="text-xs">{m.text}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type message..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        {/* SIDE PANEL: PATIENT DOSSIER & FIELD VITALS BROADCASTER (4 COLS) */}
        <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Patient Session
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">{tc?.patient_name || 'Patient'}</h2>
            <p className="text-xs text-slate-400">{tc?.patient_village} • {tc?.patient_gender}</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 text-xs">
            <span className="text-slate-400 font-semibold block text-[11px]">Reason for Consult:</span>
            <p className="text-slate-200">{tc?.reason_for_consult}</p>
          </div>

          {/* Frontline Health Worker Live Vitals Broadcaster */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <span className="font-bold text-slate-200 flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Broadcast Field Vitals to Doctor</span>
            </span>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                  Blood Pressure (mmHg)
                </label>
                <input
                  type="text"
                  value={vitalsInput.bp}
                  onChange={(e) => setVitalsInput({ ...vitalsInput, bp: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    SpO2 (%)
                  </label>
                  <input
                    type="text"
                    value={vitalsInput.spo2}
                    onChange={(e) => setVitalsInput({ ...vitalsInput, spo2: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    Pulse (bpm)
                  </label>
                  <input
                    type="text"
                    value={vitalsInput.hr}
                    onChange={(e) => setVitalsInput({ ...vitalsInput, hr: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handlePushVitals}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Transmit Vitals Live
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
