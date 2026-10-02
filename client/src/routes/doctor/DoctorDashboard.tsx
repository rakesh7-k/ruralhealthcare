import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDoctorQueue } from '../../services/doctorService';
import {
  Stethoscope,
  AlertTriangle,
  Clock,
  HeartPulse,
  Video,
  ArrowRight,
  Activity,
  Filter,
  User,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export default function DoctorDashboard() {
  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | 'EMERGENCY' | 'URGENT' | 'ROUTINE'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadQueue = () => {
    setIsLoading(true);
    fetchDoctorQueue()
      .then((res) => setData(res))
      .catch((err) => console.error('Error fetching doctor queue:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadQueue();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-700">Loading doctor clinical queue...</p>
        </div>
      </div>
    );
  }

  const queue = data?.queue || [];
  const teleconsults = data?.teleconsults || [];
  const counts = data?.counts || { totalQueue: 0, emergencyCount: 0, urgentCount: 0, teleconsultsPending: 0 };

  const limitedQueue = queue.slice(0, 10);
  const filteredQueue = limitedQueue.filter((item: any) => {
    if (filter === 'ALL') return true;
    return item.triageLevel === filter;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Primary Care Clinic
            </span>
            <span className="text-xs font-medium text-slate-500">
              Thenkarai PHC • Outpatient & Triage Ward
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-emerald-600" />
            Dr. Anand Sharma (Medical Officer)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Decision support assistance active • Triage levels evaluated deterministically
          </p>
        </div>

        <button
          onClick={loadQueue}
          className="self-start md:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
        >
          Refresh Queue
        </button>
      </div>

      {/* METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Waiting in Queue</span>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{counts.totalQueue}</div>
          <p className="text-xs text-slate-500 mt-1">Patients present at clinic</p>
        </div>

        <div className={`p-5 rounded-3xl border shadow-sm ${
          counts.emergencyCount > 0 ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900">Emergency Priority</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-900 mt-2">{counts.emergencyCount}</div>
          <p className="text-xs text-rose-700 mt-1 font-medium">Immediate escalation required</p>
        </div>

        <div className={`p-5 rounded-3xl border shadow-sm ${
          counts.urgentCount > 0 ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Urgent Triage</span>
            <HeartPulse className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-900 mt-2">{counts.urgentCount}</div>
          <p className="text-xs text-amber-700 mt-1 font-medium">Review within 1-2 hours</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Teleconsults Pending</span>
            <Video className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{counts.teleconsultsPending}</div>
          <p className="text-xs text-slate-500 mt-1">Specialist virtual consults</p>
        </div>
      </div>

      {/* QUEUE CONTROLS & FILTER TABS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Active Patient Queue
            </h2>
            <p className="text-xs text-slate-500">
              Ranked by digital triage urgency • Automated assistance, not final diagnosis
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({queue.length})
            </button>
            <button
              onClick={() => setFilter('EMERGENCY')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'EMERGENCY' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Emergency ({counts.emergencyCount})
            </button>
            <button
              onClick={() => setFilter('URGENT')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'URGENT' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Urgent ({counts.urgentCount})
            </button>
            <button
              onClick={() => setFilter('ROUTINE')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'ROUTINE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Routine
            </button>
          </div>
        </div>

        {/* QUEUE PATIENT CARDS */}
        {filteredQueue.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No patients currently matching this urgency filter in queue.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQueue.map((item: any) => (
              <div
                key={item.patientId}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.triageLevel === 'EMERGENCY'
                    ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20'
                    : item.triageLevel === 'URGENT'
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-extrabold text-slate-900 text-base">{item.fullName}</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {item.gender} • {item.village}
                    </span>

                    {/* Triage Badge */}
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        item.triageLevel === 'EMERGENCY'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : item.triageLevel === 'URGENT'
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.triageLevel} TRIAGE
                    </span>

                    <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.journeyStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700">
                    Chief Complaint: <strong>"{item.primaryComplaint || 'Routine medical review'}"</strong>
                  </div>

                  {/* Vitals Summary Pill */}
                  {item.vitals && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-600">
                      {item.vitals.bloodPressureSystolic && (
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                          BP: <strong>{item.vitals.bloodPressureSystolic}/{item.vitals.bloodPressureDiastolic}</strong>
                        </span>
                      )}
                      {item.vitals.oxygenSaturation && (
                        <span className={`px-2 py-0.5 rounded border font-medium ${
                          item.vitals.oxygenSaturation < 94 ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white border-slate-200'
                        }`}>
                          SpO2: <strong>{item.vitals.oxygenSaturation}%</strong>
                        </span>
                      )}
                      {item.vitals.heartRate && (
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                          Pulse: <strong>{item.vitals.heartRate} bpm</strong>
                        </span>
                      )}
                      {item.vitals.temperature && (
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                          Temp: <strong>{item.vitals.temperature}°C</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <Link
                    to={`/doctor/consult/${item.patientId}`}
                    className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-transform active:scale-95 ${
                      item.triageLevel === 'EMERGENCY'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Open Consultation Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PENDING SPECIALIST TELECONSULTATIONS */}
      {teleconsults.length > 0 && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-teal-900">
              <Video className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold">
                Specialist Teleconsultation Queue ({teleconsults.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-200/60 px-2.5 py-1 rounded-full">
              Virtual Clinic
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teleconsults.map((tc: any) => (
              <div key={tc.id} className="bg-white rounded-2xl p-4 border border-teal-200 shadow-sm space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{tc.patient_name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 uppercase">
                    {tc.specialty_required}
                  </span>
                </div>
                <p className="text-slate-600">Reason: {tc.reason_for_consult}</p>
                <div className="text-slate-400 text-[11px]">
                  Requested by {tc.requesting_doctor_name} ({tc.requesting_facility_name})
                </div>
                <div className="pt-2">
                  <Link
                    to={`/doctor/teleconsult/${tc.id}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Enter Teleconsultation Room</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
