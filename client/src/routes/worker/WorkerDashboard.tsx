import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWorkerDashboard } from '../../services/workerService';
import { fetchPatients } from '../../services/patientService';
import { RegisterPatientModal } from './RegisterPatientModal';
import { NewEncounterModal } from './NewEncounterModal';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Search,
  UserPlus,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Users,
  Activity,
  Send,
  Wifi,
} from 'lucide-react';

export default function WorkerDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [encounterPatient, setEncounterPatient] = useState<any>(null);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      fetchWorkerDashboard(),
      fetchPatients({ q: searchQuery, village: selectedVillage }),
    ])
      .then(([dashRes, patRes]) => {
        setDashboardData(dashRes);
        setPatients(patRes);
      })
      .catch((err) => console.error('Error loading worker dashboard:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedVillage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-700">Loading frontline priority queue...</p>
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary;
  const careBreaks = dashboardData?.careBreaks || [];
  const overdueFollowups = dashboardData?.overdueFollowups || [];
  const todayFollowups = dashboardData?.todayFollowups || [];
  const activeReferrals = dashboardData?.activeReferrals || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Worker Greeting + Quick Actions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Frontline Care Center
            </span>
            <span className="text-xs font-medium text-slate-500 flex items-center">
              <Wifi className="w-3.5 h-3.5 text-emerald-500 mr-1" />
              Connected • Auto-sync active
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Asha Devi (ASHA Worker)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Primary Area: <strong>Nilgiri & Thenkarai Villages</strong> • Kaveri Block PHC
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-transform active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Assisted Registration</span>
          </button>
        </div>
      </div>

      {/* PRIORITY ACTION SUMMARY CARDS (Answering "What do I need to do next?") */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Care Breaks Needing Immediate Action */}
        <div className={`p-5 rounded-3xl border shadow-sm transition-all ${
          (summary?.criticalCareBreaksCount || 0) > 0
            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Care Breaks Needing Action
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-900 mt-2">
            {summary?.criticalCareBreaksCount || 0}
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">
            Break in patient care journey detected. Home visit/contact needed.
          </p>
        </div>

        {/* 2. Overdue Follow-ups */}
        <div className={`p-5 rounded-3xl border shadow-sm transition-all ${
          (summary?.overdueFollowupsCount || 0) > 0
            ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
              Overdue Follow-ups
            </span>
            <Clock className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-900 mt-2">
            {summary?.overdueFollowupsCount || 0}
          </div>
          <p className="text-xs text-rose-700 mt-1 font-medium">
            Patients past their expected check date. Urgent follow-up.
          </p>
        </div>

        {/* 3. Today's Due Follow-ups */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Today's Follow-ups
            </span>
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {summary?.todayFollowupsCount || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Routine vitals/medication checks scheduled for today.
          </p>
        </div>

        {/* 4. Active Referrals */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Patients In Transit
            </span>
            <Send className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {summary?.activeReferralsCount || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Referred patients traveling to CHC or District Hospital.
          </p>
        </div>
      </div>

      {/* SECTION 1: CRITICAL CARE BREAKS QUEUE */}
      {careBreaks.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-amber-900">
                Immediate Action Queue: Active Care Breaks ({careBreaks.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-full">
              Highest Priority
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {careBreaks.map((cb: any) => (
              <div key={cb.id} className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{cb.patient_name}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    {cb.break_type.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex items-center space-x-3">
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1" />
                    {cb.village}
                  </span>
                  {cb.phone && <span>Phone: {cb.phone}</span>}
                </div>

                <div className="text-xs font-medium text-amber-900 bg-amber-50 p-2 rounded-xl">
                  Expected Action: <strong>{cb.expected_action}</strong>
                </div>

                {cb.barrier_description && (
                  <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <strong>Reported Barrier ({cb.barrier_type}):</strong> {cb.barrier_description}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    to={`/worker/patients/${cb.patient_id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>Open Care Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => setEncounterPatient({ id: cb.patient_id, fullName: cb.patient_name, village: cb.village })}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                  >
                    Record Home Visit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: OVERDUE & TODAY'S FOLLOW-UPS QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Follow-ups */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-slate-900">
                Overdue Follow-ups ({overdueFollowups.length})
              </h2>
            </div>
          </div>

          {overdueFollowups.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No overdue follow-up visits! All current patients up to date.
            </div>
          ) : (
            <div className="space-y-3">
              {overdueFollowups.map((f: any) => (
                <div key={f.id} className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{f.patient_name}</span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      Due: {new Date(f.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Type: <strong>{f.follow_up_type.replace(/_/g, ' ')}</strong> • Village: {f.village}
                  </div>
                  {f.primary_complaint && (
                    <div className="text-slate-500 italic">Complaint: "{f.primary_complaint}"</div>
                  )}
                  <div className="pt-1 flex items-center justify-between">
                    <Link
                      to={`/worker/patients/${f.patient_id}`}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                    >
                      <span>Patient Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => setEncounterPatient({ id: f.patient_id, fullName: f.patient_name, village: f.village })}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700"
                    >
                      Record Check
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Follow-ups */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Today's Scheduled Follow-ups ({todayFollowups.length})
              </h2>
            </div>
          </div>

          {todayFollowups.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No follow-ups due today.
            </div>
          ) : (
            <div className="space-y-3">
              {todayFollowups.map((f: any) => (
                <div key={f.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{f.patient_name}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  </div>
                  <div className="text-slate-600">
                    {f.follow_up_type.replace(/_/g, ' ')} • {f.village}
                  </div>
                  <div className="pt-1 flex items-center justify-between">
                    <Link
                      to={`/worker/patients/${f.patient_id}`}
                      className="text-xs font-bold text-emerald-700 flex items-center space-x-1"
                    >
                      <span>View Record</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => setEncounterPatient({ id: f.patient_id, fullName: f.patient_name, village: f.village })}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700"
                    >
                      Perform Follow-up
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: COMMUNITY PATIENTS ROSTER & FAST LOOKUP */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Community Patients Roster
            </h2>
            <p className="text-xs text-slate-500">Search and manage longitudinal patient care records</p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, ABHA..."
                className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs w-48 sm:w-64 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">All Villages</option>
              <option value="Nilgiri">Nilgiri</option>
              <option value="Thenkarai">Thenkarai</option>
              <option value="Vazhapadi">Vazhapadi</option>
              <option value="Mettur">Mettur</option>
            </select>

            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Patients Table / Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3">Patient</th>
                <th className="pb-3">Village</th>
                <th className="pb-3">Phone</th>
                <th className="pb-3">Active Journey Status</th>
                <th className="pb-3 text-center">Follow-ups</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-slate-900">{p.fullName}</div>
                    <div className="text-[11px] text-slate-500">
                      {p.gender} {p.bloodGroup && `• ${p.bloodGroup}`}
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-700">{p.village}</td>
                  <td className="py-3.5 text-slate-700 font-mono text-[11px]">{p.phone || '—'}</td>
                  <td className="py-3.5">
                    {p.activeJourney ? (
                      <div>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {p.activeJourney.status.replace(/_/g, ' ')}
                        </span>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                          {p.activeJourney.primaryComplaint}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No active journey</span>
                    )}
                  </td>
                  <td className="py-3.5 text-center">
                    {p.activeCareBreaksCount > 0 ? (
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full">
                        {p.activeCareBreaksCount} Care Break
                      </span>
                    ) : p.pendingFollowupsCount > 0 ? (
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full">
                        {p.pendingFollowupsCount} Due
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3.5 text-right space-x-2">
                    <button
                      onClick={() => setEncounterPatient({ id: p.id, fullName: p.fullName, village: p.village })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      + Encounter
                    </button>
                    <Link
                      to={`/worker/patients/${p.id}`}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors"
                    >
                      <span>Timeline</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <RegisterPatientModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={loadData}
      />

      <NewEncounterModal
        isOpen={!!encounterPatient}
        patient={encounterPatient}
        onClose={() => setEncounterPatient(null)}
        onSuccess={loadData}
      />
    </div>
  );
}
