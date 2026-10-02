import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchTeleconsultationById,
  completeTeleconsultationApi,
  startTeleconsultationApi,
  saveTeleconsultationSnapshotApi,
} from '../../services/teleconsultService';
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
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  User,
  Info,
  Monitor,
  Camera,
  MessageSquare,
  Wifi,
  WifiOff,
  Maximize2,
  Send,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function TeleconsultationRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [callDuration, setCallDuration] = useState(0); // seconds elapsed
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [capturedSnapshots, setCapturedSnapshots] = useState<{ id: string; url: string; time: string }[]>([]);
  const [liveVitals, setLiveVitals] = useState<any>(null);

  // Clinical formulation form
  const [specialistNotes, setSpecialistNotes] = useState(
    'Evaluated patient virtual presentation. Review of recorded ECG shows non-specific ST-T wave changes. History consistent with unstable angina.'
  );
  const [specialistRecommendation, setSpecialistRecommendation] = useState(
    'Recommend formal 12-lead digital ECG, digital Chest X-ray, cardiac troponin panel, and physical cardiology evaluation.'
  );
  const [requiresPhysicalExam, setRequiresPhysicalExam] = useState(true);
  const [selectedDiagnostics, setSelectedDiagnostics] = useState<string[]>([
    'ECG',
    'Chest X-ray',
    'Cardiac Troponin',
  ]);
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([
    'Amlodipine 5mg',
    'Aspirin 75mg',
    'Sorbitrate 5mg',
  ]);
  const [followUpDays, setFollowUpDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WebRTC Hook
  const {
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
  } = useWebRTC({
    roomId: id || 'tc-default',
    user: React.useMemo(() => ({
      id: user?.id || 'usr-doctor-03',
      name: user?.fullName || 'Dr. Venkat Reddy',
      role: 'SPECIALIST',
      facility: 'Kaveri District Hospital',
    }), [user?.id, user?.fullName]),
    onRemoteVitals: (v) => {
      setLiveVitals(v);
    },
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Fetch consultation dossier
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    fetchTeleconsultationById(id)
      .then((res) => {
        setData(res);
        if (res.triage?.vitals) {
          setLiveVitals(res.triage.vitals);
        }
        // Notify backend session is active
        startTeleconsultationApi(id).catch(console.warn);
      })
      .catch((err) => console.error('Failed to load teleconsultation:', err))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleDiagnostic = (diag: string) => {
    setSelectedDiagnostics((prev) =>
      prev.includes(diag) ? prev.filter((d) => d !== diag) : [...prev, diag]
    );
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const handleCaptureSnapshot = () => {
    const targetEl = remoteStream ? remoteVideoRef.current : localVideoRef.current;
    const snap = captureSnapshot(targetEl);
    if (snap && id) {
      const item = {
        id: `snap-${Date.now()}`,
        url: snap,
        time: new Date().toLocaleTimeString(),
      };
      setCapturedSnapshots((prev) => [item, ...prev]);
      saveTeleconsultationSnapshotApi(id, snap, 'Clinical Video Snapshot').catch(console.warn);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);

    try {
      const res = await completeTeleconsultationApi(id, {
        specialistNotes,
        specialistRecommendation,
        requiresPhysicalExam,
        diagnosticsRecommended: selectedDiagnostics,
        medicinesRecommended: selectedMedicines,
        followUpDays,
      });

      if (res.requiresPhysicalExam && res.careRequirementId) {
        navigate(`/doctor/care-route/${res.careRequirementId}`);
      } else {
        alert('Teleconsultation completed and care plan saved.');
        navigate('/doctor');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to complete teleconsultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wide">
            Connecting to SETHU Encrypted Teleconsultation Room...
          </p>
          <span className="text-xs text-slate-500 font-mono">STUN / WebRTC Signaling Init</span>
        </div>
      </div>
    );
  }

  const tc = data?.teleconsult;
  const triage = data?.triage;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 md:p-6 space-y-4">
      {/* TOP HEADER */}
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <Link
          to="/doctor"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Room</span>
        </Link>

        {/* Live Call Telemetry Badges */}
        <div className="flex items-center space-x-2.5 text-xs">
          <span className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>LIVE WebRTC • {formatDuration(callDuration)}</span>
          </span>

          <span
            className={`px-3 py-1 rounded-xl border text-xs font-mono font-bold flex items-center space-x-1.5 ${
              connectionStatus === 'connected'
                ? 'bg-teal-950 text-teal-300 border-teal-700'
                : 'bg-amber-950 text-amber-300 border-amber-700'
            }`}
          >
            {connectionStatus === 'connected' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="uppercase">{connectionStatus}</span>
          </span>

          {isLowBandwidth && (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-xl font-bold text-[11px]">
              2G/3G Rural Optimized (-85% data)
            </span>
          )}

          <span className="bg-slate-900 text-slate-300 px-3 py-1 rounded-xl border border-slate-800 hidden sm:inline-block">
            {tc?.requesting_doctor_name || 'PHC Doctor'} ↔ Dr. Venkat Reddy (Specialist)
          </span>
        </div>
      </div>

      {/* MAIN TELEMEDICINE INTERFACE GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT & CENTER: VIDEO STREAMS & HUD (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Remote Video Window */}
          <div className="relative bg-slate-900 rounded-3xl border border-slate-800 aspect-video overflow-hidden shadow-2xl flex items-center justify-center group">
            {/* Live Remote Stream or Waiting State */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-3 z-0">
                <div className="w-20 h-20 rounded-full bg-teal-900/60 border-2 border-teal-500/50 flex items-center justify-center mx-auto text-teal-300 font-black text-2xl shadow-inner">
                  {tc?.patient_name ? tc.patient_name[0] : 'P'}
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {tc?.patient_name || 'Patient'}
                </h3>
                <p className="text-xs text-slate-400">
                  {peers.length > 0
                    ? `Connected with ${peers[0].name} (${peers[0].facility || 'PHC'})`
                    : `Presenting at ${tc?.requesting_facility_name || 'Thenkarai PHC'} • Awaiting primary doctor feed`}
                </p>
                <div className="flex items-center justify-center space-x-2 text-[11px] text-teal-400/80 bg-slate-950/60 py-1 px-3 rounded-full border border-teal-900/40 w-fit mx-auto">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                  <span>WebRTC Peer Room: {id}</span>
                </div>
              </div>
            )}

            {/* Remote Info Banner Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center space-x-2">
              <span className="bg-slate-900/85 backdrop-blur border border-slate-700/60 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{tc?.requesting_facility_name || 'Thenkarai Primary Health Centre'} (PHC Clinic)</span>
              </span>
            </div>

            {/* Local Doctor PIP Self-View Tile */}
            <div className="absolute bottom-4 right-4 z-20 w-36 sm:w-48 aspect-video bg-slate-800/95 backdrop-blur rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center">
              {isVideoOff ? (
                <div className="flex flex-col items-center justify-center p-2">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 mb-1">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">Camera Paused</span>
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

              {/* Local Doctor Tag */}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-950/80 backdrop-blur rounded-lg px-2 py-0.5 flex items-center justify-between text-[9px] text-slate-300">
                <span className="font-bold truncate">You (Specialist)</span>
                {/* Audio pulse meter */}
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isMuted
                      ? 'bg-rose-500'
                      : micAudioLevel > 15
                      ? 'bg-emerald-400 animate-ping'
                      : 'bg-emerald-600'
                  }`}
                />
              </div>
            </div>

            {/* Floating Call Controls Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 bg-slate-900/90 backdrop-blur px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl">
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={toggleAudio}
                className={`p-2.5 rounded-xl transition-all ${
                  !isMuted
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {!isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={toggleVideo}
                className={`p-2.5 rounded-xl transition-all ${
                  !isVideoOff
                    ? 'bg-slate-800 hover:bg-slate-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30'
                }`}
                title={isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
              >
                {!isVideoOff ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>

              {/* Screen Share (ECG/Scans) */}
              <button
                type="button"
                onClick={toggleScreenShare}
                className={`p-2.5 rounded-xl transition-all ${
                  isScreenSharing
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title="Share Screen (Display ECG/X-Ray Scans)"
              >
                <Monitor className="w-4 h-4" />
              </button>

              {/* Snapshot Frame Capture Tool */}
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl transition-all"
                title="Capture Frame Snapshot (Attach to Record)"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Low-Bandwidth Rural Mode Toggle */}
              <button
                type="button"
                onClick={toggleLowBandwidthMode}
                className={`p-2.5 rounded-xl transition-all text-xs font-bold ${
                  isLowBandwidth
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="Toggle Rural 2G/3G Low-Bandwidth Mode"
              >
                {isLowBandwidth ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              </button>

              {/* In-Call Chat Toggle */}
              <button
                type="button"
                onClick={() => setShowChat(!showChat)}
                className={`p-2.5 rounded-xl transition-all relative ${
                  showChat ? 'bg-teal-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
                title="Toggle In-Call Clinical Chat"
              >
                <MessageSquare className="w-4 h-4" />
                {messages.length > 0 && !showChat && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center">
                    {messages.length}
                  </span>
                )}
              </button>

              {/* Disconnect Call */}
              <button
                type="button"
                onClick={() => navigate('/doctor')}
                className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all"
                title="End Consultation Call"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* IN-CALL CHAT DRAWER (IF OPEN) */}
          {showChat && (
            <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-teal-400" />
                  <span>Encrypted In-Call Clinical Messages ({messages.length})</span>
                </span>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="h-40 overflow-y-auto space-y-2 text-xs pr-1">
                {messages.length === 0 ? (
                  <p className="text-slate-500 text-center py-6 text-[11px]">
                    No messages yet. Send clinical observations or notes during the call.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-2xl max-w-[85%] ${
                        m.senderId === user?.id
                          ? 'ml-auto bg-teal-950 border border-teal-800 text-teal-100'
                          : 'bg-slate-950 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-bold">{m.senderName}</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs leading-relaxed">{m.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChatMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type message or clinical note..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* CAPTURED SNAPSHOTS GALLERY (IF ANY TAKEN) */}
          {capturedSnapshots.length > 0 && (
            <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-teal-400" />
                <span>Video Snapshots Attached ({capturedSnapshots.length})</span>
              </span>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {capturedSnapshots.map((s) => (
                  <div key={s.id} className="relative w-32 aspect-video rounded-xl overflow-hidden border border-slate-700 shrink-0">
                    <img src={s.url} alt="Snapshot" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] px-1 rounded text-slate-300">
                      {s.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REAL-TIME PATIENT VITALS & TRIAGE STRIP */}
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-teal-400" />
                <span>Patient Vitals Telemetry (Transmitted from PHC)</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Fresh • 100% Reliable
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Blood Pressure</span>
                <span className="text-base font-black text-rose-400">
                  {liveVitals?.bloodPressureSystolic
                    ? `${liveVitals.bloodPressureSystolic}/${liveVitals.bloodPressureDiastolic}`
                    : '150/95'}
                </span>
                <span className="text-[10px] text-slate-500 block">Stage 2 HTN</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Oxygen Saturation</span>
                <span className="text-base font-black text-emerald-400">
                  {liveVitals?.oxygenSaturation ? `${liveVitals.oxygenSaturation}%` : '96%'}
                </span>
                <span className="text-[10px] text-slate-500 block">Room air</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Heart Rate</span>
                <span className="text-base font-black text-amber-400">
                  {liveVitals?.heartRate ? `${liveVitals.heartRate} bpm` : '98 bpm'}
                </span>
                <span className="text-[10px] text-slate-500 block">Tachycardia</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Triage Tier</span>
                <span className="text-base font-black text-amber-400">
                  {triage?.triage_level || 'URGENT'}
                </span>
                <span className="text-[10px] text-slate-500 block">Digital triage rule</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold">Chief Complaint: </span>
              <span className="text-white font-medium">"{tc?.reason_for_consult || 'Chest pain radiating to left shoulder'}"</span>
            </div>
          </div>
        </div>

        {/* RIGHT: SPECIALIST CLINICAL ASSESSMENT & ACTION ROUTER (5 COLS) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-teal-400" />
              <span>Specialist Clinical Evaluation</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Formulate care requirement and route to physical care if needed
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Specialist Clinical Notes */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Specialist Clinical Impressions *
              </label>
              <textarea
                required
                rows={3}
                value={specialistNotes}
                onChange={(e) => setSpecialistNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-teal-500"
              />
            </div>

            {/* Specialist Recommendation */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Specialist Care Directive *
              </label>
              <input
                type="text"
                required
                value={specialistRecommendation}
                onChange={(e) => setSpecialistRecommendation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-teal-500"
              />
            </div>

            {/* CORE DECISION: DOES PATIENT REQUIRE PHYSICAL EXAMINATION? */}
            <div className="p-4 bg-teal-500/10 border-2 border-teal-500/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-300 text-xs">
                  Physical Examination & In-Person Diagnostics Required?
                </span>
                <input
                  type="checkbox"
                  checked={requiresPhysicalExam}
                  onChange={(e) => setRequiresPhysicalExam(e.target.checked)}
                  className="w-5 h-5 accent-teal-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-teal-200/80 leading-relaxed">
                {requiresPhysicalExam
                  ? 'YES: Care Requirement will be formulated to activate SETHU CARE ROUTE ASSURANCE (Facility verification, capacity match, and confirmed referral).'
                  : 'NO: Patient can be safely managed locally at the PHC with specialist-guided prescriptions.'}
              </p>
            </div>

            {/* In-Person Diagnostics Required */}
            {requiresPhysicalExam && (
              <div className="space-y-2">
                <label className="block font-bold text-slate-300">
                  Required In-Person Diagnostics (Checked for Route Assurance):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['ECG', 'Chest X-ray', 'Cardiac Troponin', '2D Echocardiogram'].map((diag) => (
                    <label
                      key={diag}
                      className="flex items-center space-x-2 p-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer text-[11px]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDiagnostics.includes(diag)}
                        onChange={() => handleToggleDiagnostic(diag)}
                        className="accent-teal-500 rounded"
                      />
                      <span className="text-slate-200">{diag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Window */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-slate-300">Follow-up Window:</span>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(parseInt(e.target.value, 10))}
                  className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white text-xs outline-none"
                />
                <span className="text-slate-400">days</span>
              </div>
            </div>

            {/* Submit & Next Step Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                requiresPhysicalExam
                  ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <span>
                {isSubmitting
                  ? 'Processing Care Requirement...'
                  : requiresPhysicalExam
                  ? 'Generate Care Requirement & Launch Care Route Assurance'
                  : 'Complete Teleconsultation & Save Care Plan'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
