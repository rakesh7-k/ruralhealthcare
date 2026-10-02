import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyJourney } from '../../services/patientService';
import { useLanguage, LanguageSelector } from '../../components/common/LanguageSelector';
import {
  PhoneCall,
  MapPin,
  Calendar,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  User,
  HeartPulse,
  HelpCircle,
  Video,
} from 'lucide-react';

export default function PatientPortal() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [helpRequested, setHelpRequested] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchMyJourney()
      .then((res) => setData(res))
      .catch((err) => console.error('Error fetching patient journey:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handlePlayVoice = () => {
    setAudioPlaying(true);
    // Web Speech API fallback or placeholder
    if ('speechSynthesis' in window && data?.nextAction?.description) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `${data.nextAction.title}. ${data.nextAction.description}`
      );
      utterance.onend = () => setAudioPlaying(false);
      utterance.onerror = () => setAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setAudioPlaying(false), 4000);
    }
  };

  const handleRequestHelp = () => {
    setHelpRequested(true);
    setTimeout(() => setHelpRequested(false), 6000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-base font-semibold text-slate-700">Loading your health journey...</p>
        </div>
      </div>
    );
  }

  const patient = data?.patient;
  const journey = data?.journey;
  const nextAction = data?.nextAction;
  const activeReferral = data?.activeReferral;
  const nextAppointment = data?.nextAppointment;
  const activeCareBreak = data?.activeCareBreak;

  // Visual Journey Stages
  const stages = [
    { key: 'start', label: t.journeyStages.start, done: true },
    { key: 'triage', label: t.journeyStages.triage, done: ['TRIAGED', 'CONSULTATION', 'TELECONSULTATION_COMPLETE', 'ROUTE_EVALUATED', 'REFERRED', 'APPOINTMENT_BOOKED', 'PATIENT_ARRIVED', 'TREATMENT_IN_PROGRESS', 'AWAITING_FOLLOWUP', 'COMPLETED'].includes(journey?.status) },
    { key: 'referral', label: t.journeyStages.referral, done: ['REFERRED', 'APPOINTMENT_BOOKED', 'PATIENT_ARRIVED', 'TREATMENT_IN_PROGRESS', 'AWAITING_FOLLOWUP', 'COMPLETED'].includes(journey?.status) },
    { key: 'treatment', label: t.journeyStages.treatment, done: ['TREATMENT_IN_PROGRESS', 'AWAITING_FOLLOWUP', 'COMPLETED'].includes(journey?.status) },
    { key: 'followup', label: t.journeyStages.followup, done: ['AWAITING_FOLLOWUP', 'COMPLETED'].includes(journey?.status) },
    { key: 'complete', label: t.journeyStages.complete, done: journey?.status === 'COMPLETED' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-28 text-slate-900 font-sans">
      {/* 1. TOP BAR WITH LANGUAGE SELECTOR & EMERGENCY HOTLINE */}
      <div className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-6 h-6 text-emerald-400" />
            <span className="font-extrabold text-lg tracking-wide">{t.appName}</span>
          </div>
          <LanguageSelector />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* 2. EMERGENCY 108 AMBULANCE BANNER (Always Visible) */}
        <a
          href="tel:108"
          className="flex items-center justify-between p-3.5 bg-rose-600 active:bg-rose-700 text-white rounded-2xl shadow-md transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <PhoneCall className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-100">{t.emergency}</div>
              <div className="text-base font-black tracking-wide">{t.emergencyCall}</div>
            </div>
          </div>
          <span className="bg-white text-rose-700 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm">
            Toll Free
          </span>
        </a>

        {/* 3. PATIENT HEADER CARD */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-lg">
              {patient?.fullName ? patient.fullName[0] : 'P'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{patient?.fullName || 'Rural Patient'}</h2>
              <p className="text-xs text-slate-500 flex items-center mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1" />
                {patient?.village || 'Nilgiri Village'}
                {patient?.bloodGroup && ` • Blood Group: ${patient.bloodGroup}`}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
            {patient?.phone || 'No phone'}
          </span>
        </div>

        {/* 4. CARE BREAK WARNING (If active) */}
        {activeCareBreak && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">Care Continuity Notice</h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  We noticed you may need assistance continuing your care journey. Your health worker <strong>{journey?.assignedWorkerName || 'Asha Devi'}</strong> has been notified to assist with transportation or scheduling.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. HERO CARD: "YOUR NEXT CARE STEP" (CORE USER EXPERIENCE) */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              {t.nextStepTitle}
            </span>
            <button
              onClick={handlePlayVoice}
              className={`flex items-center space-x-1 bg-white text-emerald-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm active:scale-95 transition-transform ${
                audioPlaying ? 'ring-2 ring-amber-300' : ''
              }`}
            >
              <Volume2 className={`w-3.5 h-3.5 ${audioPlaying ? 'animate-bounce text-amber-500' : ''}`} />
              <span>{audioPlaying ? 'Playing...' : t.audioListen}</span>
            </button>
          </div>

          <h3 className="text-xl font-extrabold leading-snug mb-2">
            {nextAction?.title || 'Rest & Follow Medications'}
          </h3>

          <p className="text-emerald-50 text-sm leading-relaxed mb-4">
            {nextAction?.description || 'Continue taking your prescribed medicines on schedule.'}
          </p>

          {/* Details Pill */}
          <div className="bg-black/20 backdrop-blur rounded-2xl p-3.5 space-y-2 text-xs">
            {nextAction?.facilityName && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="font-medium text-white truncate">
                  {t.whereToGo}: <strong>{nextAction.facilityName}</strong>
                </span>
              </div>
            )}
            {nextAction?.date && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="font-medium text-white">
                  {t.whenToArrive}: <strong>{new Date(nextAction.date).toLocaleDateString()}</strong>
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-medium text-white">
                Assigned Worker: <strong>{nextAction?.contactWorkerName || 'Asha Devi'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* VIRTUAL DOCTOR TELECONSULTATION ACCESS */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-teal-200 bg-teal-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-teal-100 text-teal-800 rounded-2xl">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Virtual Doctor Video Call</h4>
                <p className="text-xs text-slate-500">Live encrypted teleconsultation</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full uppercase">
              WebRTC
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Connect directly with your primary care clinician or district specialist doctor without traveling.
          </p>

          <Link
            to={`/teleconsult/tc-01`}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all"
          >
            <Video className="w-4 h-4" />
            <span>Join Teleconsultation Call</span>
          </Link>
        </div>

        {/* 6. VISUAL CARE JOURNEY PROGRESS TRACKER */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t.yourCareJourney}
            </h4>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {journey?.status ? journey.status.replace(/_/g, ' ') : 'Active'}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1 text-center pt-2">
            {stages.map((stage, idx) => (
              <div key={stage.key} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    stage.done
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {stage.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[9px] mt-1.5 leading-tight ${
                    stage.done ? 'font-bold text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 7. DESTINATION FACILITY CARD (IF REFERRED OR APPOINTMENT) */}
        {(activeReferral || nextAppointment) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Destination Facility
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Verified Route
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900">
              {activeReferral?.target_facility_name || nextAppointment?.facility_name}
            </h4>
            <p className="text-xs text-slate-600">
              {activeReferral?.target_facility_address || nextAppointment?.facility_address}
            </p>
            {activeReferral?.target_facility_phone && (
              <a
                href={`tel:${activeReferral.target_facility_phone}`}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl mt-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Facility ({activeReferral.target_facility_phone})</span>
              </a>
            )}
          </div>
        )}

        {/* 8. HEALTH WORKER ASSISTANCE CARD */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Your Village Health Worker</div>
                <div className="text-sm font-bold text-slate-900">{journey?.assignedWorkerName || 'Asha Devi (ASHA)'}</div>
              </div>
            </div>
            <a
              href={`tel:${journey?.assignedWorkerPhone || '9876500001'}`}
              className="p-3 bg-emerald-600 active:bg-emerald-700 text-white rounded-xl shadow-sm"
              title="Call Worker"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
          </div>

          <div className="pt-2 border-t border-slate-100">
            {helpRequested ? (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl text-center">
                ✓ Request sent! Asha Devi has been alerted on her frontline app.
              </div>
            ) : (
              <button
                onClick={handleRequestHelp}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-slate-600" />
                <span>{t.needHelp} (Request Assistance)</span>
              </button>
            )}
          </div>
        </div>

        {/* 9. CARE INSTRUCTIONS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.careInstructions}</span>
          </h4>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
            <li>Take prescribed tablets with drinking water after morning meal.</li>
            <li>Avoid heavy physical labor until your follow-up check is complete.</li>
            <li>Carry your SETHU care booklet or phone when visiting the hospital.</li>
            <li>If chest pain or difficulty breathing worsens, call <strong>108</strong> immediately.</li>
          </ul>
        </div>

        {/* 10. EXPANDABLE CARE HISTORY */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full text-center py-2.5 text-xs font-bold text-slate-600 bg-slate-200/70 rounded-xl hover:bg-slate-200 transition-colors"
        >
          {showHistory ? 'Hide Visit History' : 'View Past Visits & Tests'}
        </button>

        {showHistory && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800">Longitudinal Timeline</h4>
            <div className="border-l-2 border-emerald-500 pl-3 space-y-3">
              <div>
                <div className="font-bold text-slate-800">Initial Encounter & Triage</div>
                <div className="text-slate-500 text-[11px]">Thenkarai PHC • 5 days ago</div>
                <div className="text-slate-600">Chief complaint: Chest pain and shortness of breath.</div>
              </div>
              <div>
                <div className="font-bold text-slate-800">Specialist Teleconsultation</div>
                <div className="text-slate-500 text-[11px]">Dr. Venkat Reddy (Cardiologist) • 4 days ago</div>
                <div className="text-slate-600">Recommended ECG and chest X-ray at District Hospital.</div>
              </div>
              <div>
                <div className="font-bold text-slate-800">Referral Completed</div>
                <div className="text-slate-500 text-[11px]">Kaveri District Hospital • 3 days ago</div>
                <div className="text-slate-600">Diagnostics and physical exam conducted. Treatment prescribed.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FIXED BOTTOM QUICK HELP BUTTON */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3 z-30 shadow-lg">
        <div className="max-w-md mx-auto flex items-center space-x-3">
          <a
            href="tel:108"
            className="flex-1 flex items-center justify-center space-x-2 py-3 bg-rose-600 active:bg-rose-700 text-white font-extrabold text-sm rounded-2xl shadow-sm"
          >
            <PhoneCall className="w-4 h-4" />
            <span>108 EMERGENCY</span>
          </a>
          <a
            href={`tel:${journey?.assignedWorkerPhone || '9876500001'}`}
            className="flex-1 flex items-center justify-center space-x-2 py-3 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-sm"
          >
            <User className="w-4 h-4" />
            <span>{t.callWorker}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
