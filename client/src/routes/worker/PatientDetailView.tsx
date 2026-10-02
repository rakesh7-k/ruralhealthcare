import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchPatientById, fetchPatientJourney } from '../../services/patientService';
import { createTeleconsultationApi } from '../../services/teleconsultService';
import { NewEncounterModal } from './NewEncounterModal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  AlertTriangle,
  FileText,
  Activity,
  UserCheck,
  Stethoscope,
  Send,
  Building,
  Video,
} from 'lucide-react';

export default function PatientDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<any>(null);
  const [journeyData, setJourneyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [isStartingTeleconsult, setIsStartingTeleconsult] = useState(false);

  const handleStartTeleconsult = async () => {
    if (!id) return;
    setIsStartingTeleconsult(true);
    try {
      const res = await createTeleconsultationApi({
        patientId: id,
        reasonForConsult: 'Frontline ASHA Worker initiated rural teleconsultation',
      });
      navigate(`/teleconsult/${res.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to start teleconsultation');
    } finally {
      setIsStartingTeleconsult(false);
    }
  };

  const loadData = () => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([fetchPatientById(id), fetchPatientJourney(id).catch(() => null)])
      .then(([pRes, jRes]) => {
        setPatientData(pRes);
        setJourneyData(jRes);
      })
      .catch((err) => console.error('Error loading patient details:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading longitudinal record...</p>
      </div>
    );
  }

  const patient = patientData?.patient;
  const caregivers = patientData?.caregivers || [];
  const journey = journeyData?.journey;
  const events = journeyData?.events || [];
  const followups = journeyData?.followups || [];
  const careBreaks = journeyData?.careBreaks || [];
  const referrals = journeyData?.referrals || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/worker"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Frontline Action Center</span>
        </Link>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleStartTeleconsult}
            disabled={isStartingTeleconsult}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Video className="w-4 h-4" />
            <span>{isStartingTeleconsult ? 'Connecting...' : 'Connect Video Teleconsultation'}</span>
          </button>

          <button
            onClick={() => setIsEncounterModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span>Record Encounter & Vitals</span>
          </button>
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-black text-2xl">
              {patient?.fullName ? patient.fullName[0] : 'P'}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-2xl font-black text-slate-900">{patient?.fullName}</h1>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  {patient?.gender}
                </span>
                {patient?.bloodGroup && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md">
                    {patient.bloodGroup}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5 font-medium">
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {patient?.village}, {patient?.district}
                </span>
                {patient?.phone && (
                  <span className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {patient.phone}
                  </span>
                )}
                {patient?.abhaId && (
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    ABHA: {patient.abhaId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active Status Badge */}
          <div className="text-left md:text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Care Journey Status</span>
            <span className="inline-block mt-1 text-xs font-black px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl">
              {journey?.status ? journey.status.replace(/_/g, ' ') : 'ACTIVE'}
            </span>
            <div className="text-xs text-slate-500 mt-1">
              Started {new Date(journey?.startedAt || patient?.registeredAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Caregivers strip */}
        {caregivers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-bold text-slate-600">Family / Caregiver:</span>
            {caregivers.map((cg: any) => (
              <span key={cg.id} className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-slate-700">
                <strong>{cg.caregiver_name}</strong> ({cg.relationship}) • {cg.phone}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Active Care Breaks Notice */}
      {careBreaks.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Active Care Break Intervention Required</span>
          </div>
          {careBreaks.map((cb: any) => (
            <div key={cb.id} className="text-xs text-amber-800 bg-white/70 p-3 rounded-2xl border border-amber-200">
              <div className="font-bold text-amber-900">{cb.break_type.replace(/_/g, ' ')}: {cb.expected_action}</div>
              <p className="mt-0.5">Detected: {new Date(cb.detected_at).toLocaleDateString()} • Status: <strong>{cb.status}</strong></p>
              {cb.barrier_description && (
                <div className="mt-1 font-medium text-slate-700 bg-amber-100/50 p-2 rounded-xl">
                  Reported Barrier ({cb.barrier_type}): {cb.barrier_description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Longitudinal Journey Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Longitudinal Timeline Events */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Longitudinal Care Record
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Continuity audit trail from registration to resolution
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {events.length} Timeline Events
            </span>
          </div>

          {events.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No timeline events recorded yet. Click "Record Encounter" above to start.
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-emerald-500/40 space-y-6">
              {events.map((ev: any) => (
                <div key={ev.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 bg-emerald-600 rounded-full border-2 border-white ring-2 ring-emerald-100"></div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 tracking-wide">
                        {ev.eventType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(ev.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center space-x-3 mb-2">
                      {ev.facilityName && (
                        <span className="flex items-center">
                          <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {ev.facilityName}
                        </span>
                      )}
                      {ev.actorName && (
                        <span className="flex items-center">
                          <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {ev.actorName}
                        </span>
                      )}
                    </div>

                    {/* Event-specific payload viewer */}
                    {ev.eventData && Object.keys(ev.eventData).length > 0 && (
                      <div className="text-[11px] font-mono bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                        {Object.entries(ev.eventData).map(([k, v]) => (
                          <div key={k} className="flex">
                            <span className="font-semibold text-slate-500 w-28 shrink-0">{k}:</span>
                            <span className="truncate">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Referrals & Follow-ups Summary */}
        <div className="lg:col-span-4 space-y-4">
          {/* Referrals Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Referrals ({referrals.length})</span>
            </h3>

            {referrals.length === 0 ? (
              <p className="text-xs text-slate-400">No referrals initiated.</p>
            ) : (
              <div className="space-y-3">
                {referrals.map((r: any) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{r.target_facility_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </div>
                    <div className="text-slate-600">{r.reason}</div>
                    <div className="text-[11px] text-slate-400">
                      Expected by: {new Date(r.expected_arrival_by || r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-ups Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Follow-ups ({followups.length})</span>
            </h3>

            {followups.length === 0 ? (
              <p className="text-xs text-slate-400">No pending follow-ups.</p>
            ) : (
              <div className="space-y-3">
                {followups.map((f: any) => (
                  <div key={f.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{f.follow_up_type.replace(/_/g, ' ')}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          f.status === 'MISSED'
                            ? 'bg-rose-100 text-rose-800'
                            : f.status === 'COMPLETED'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>
                    <div className="text-slate-600">Due: {new Date(f.due_date).toLocaleDateString()}</div>
                    {f.worker_name && (
                      <div className="text-[11px] text-slate-500">Worker: {f.worker_name}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Encounter Modal */}
      <NewEncounterModal
        isOpen={isEncounterModalOpen}
        patient={patient}
        onClose={() => setIsEncounterModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
