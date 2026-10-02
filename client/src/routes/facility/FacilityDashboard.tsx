import React, { useEffect, useState } from 'react';
import {
  fetchFacilityDashboard,
  updateReferralStatusApi,
  uploadDiagnosticResultApi,
  dispenseMedicineApi,
  updateResourceStatusApi,
} from '../../services/facilityService';
import { ReferralStatus, ResourceStatus } from '@sethu/shared';
import {
  Building2,
  Users,
  Activity,
  Pill,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileCheck,
  Plus,
  HeartPulse,
  TrendingUp,
  MapPin,
  Phone,
  Calendar,
  Layers,
} from 'lucide-react';

export default function FacilityDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'referrals' | 'diagnostics' | 'pharmacy' | 'resources'>('referrals');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<any>(null);
  const [selectedResource, setSelectedResource] = useState<any>(null);

  // Diagnostic result form
  const [diagSummary, setDiagSummary] = useState('');
  const [diagIsNormal, setDiagIsNormal] = useState(true);

  // Dispensation form
  const [dispensePatientId, setDispensePatientId] = useState('');
  const [dispenseMedId, setDispenseMedId] = useState('');
  const [dispenseQty, setDispenseQty] = useState(14);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);

  // Failure reason form
  const [failureReason, setFailureReason] = useState('Patient lacked transport to district hospital');
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);

  const loadDashboard = () => {
    setIsLoading(true);
    fetchFacilityDashboard()
      .then((res) => {
        setData(res);
        if (res.referrals && res.referrals.length > 0 && !dispensePatientId) {
          setDispensePatientId(res.referrals[0].patient_id);
        }
        if (res.medicines && res.medicines.length > 0 && !dispenseMedId) {
          setDispenseMedId(res.medicines[0].medicine_id);
        }
      })
      .catch((err) => console.error('Failed to load facility dashboard:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Update Referral Status handler
  const handleUpdateReferral = async (referralId: string, newStatus: string, reason?: string) => {
    setActionLoading(true);
    try {
      await updateReferralStatusApi(referralId, newStatus, undefined, reason);
      loadDashboard();
      setIsFailureModalOpen(false);
      setSelectedReferral(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update referral');
    } finally {
      setActionLoading(false);
    }
  };

  // Upload Diagnostic Result handler
  const handleUploadDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiagnostic) return;
    setActionLoading(true);
    try {
      await uploadDiagnosticResultApi(selectedDiagnostic.id, diagSummary, diagIsNormal);
      setSelectedDiagnostic(null);
      setDiagSummary('');
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to upload diagnostic result');
    } finally {
      setActionLoading(false);
    }
  };

  // Dispense Medicine handler
  const handleDispenseMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispensePatientId || !dispenseMedId) return;
    setActionLoading(true);
    try {
      await dispenseMedicineApi(dispensePatientId, dispenseMedId, dispenseQty, dispenseNotes);
      setIsDispenseModalOpen(false);
      setDispenseNotes('');
      loadDashboard();
      alert('Prescription successfully dispensed and logged to patient care journey.');
    } catch (err: any) {
      alert(err.message || 'Failed to dispense medicine');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Resource Status & Freshness handler
  const handleUpdateResource = async (resourceId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      await updateResourceStatusApi(resourceId, newStatus, 'Verified by staff operational review');
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to update resource');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-700">Loading facility operations dashboard...</p>
        </div>
      </div>
    );
  }

  const facility = data?.facility;
  const counts = data?.counts || {};
  const referrals = data?.referrals || [];
  const diagnostics = data?.diagnostics || [];
  const resources = data?.resources || [];
  const medicines = data?.medicines || [];

  // Filter referrals by search
  const filteredReferrals = referrals.filter((r: any) =>
    r.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.source_facility_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* 1. FACILITY HEADER & VERIFICATION BADGE */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Secondary Care Facility
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                ID: {facility?.id || 'fac-dh-01'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {facility?.name || 'Kaveri District Hospital'}
            </h1>
            <p className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
              <span>{facility?.address || 'Hospital Road, District Headquarters'}</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">24x7 Emergency & Inpatient Operations</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsDispenseModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
          >
            <Pill className="w-4 h-4" />
            <span>Dispense Medicine</span>
          </button>
          <button
            onClick={loadDashboard}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Incoming Referrals</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{counts.activeReferrals || 0}</div>
          <p className="text-xs text-slate-500 mt-1">En route from primary clinics</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Patients Arrived</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2">{counts.arrivedPatients || 0}</div>
          <p className="text-xs text-slate-500 mt-1">Checked in at reception desk</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Diagnostics</span>
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700 mt-2">{counts.pendingDiagnostics || 0}</div>
          <p className="text-xs text-slate-500 mt-1">ECG, X-Ray & Lab orders</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Facility Resources</span>
            <ShieldCheck className="w-5 h-5 text-slate-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{counts.totalResources || 0}</div>
          <p className="text-xs text-slate-500 mt-1">Live telemetry tracked</p>
        </div>
      </div>

      {/* 3. TAB NAVIGATION BAR */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'referrals'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-teal-600" />
          <span>Referral Intake Queue ({referrals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'diagnostics'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-amber-600" />
          <span>Diagnostics & Labs ({diagnostics.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pharmacy')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'pharmacy'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="w-4 h-4 text-emerald-600" />
          <span>Hospital Pharmacy ({medicines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'resources'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Resource Status & Trust Engine ({resources.length})</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: INCOMING REFERRALS QUEUE                              */}
      {/* ============================================================ */}
      {activeTab === 'referrals' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Incoming Rural Patient Referrals</h2>
              <p className="text-xs text-slate-500">
                Processed via SETHU Care Route Assurance • Confirmed capability match
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {filteredReferrals.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No referral records match your search criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReferrals.map((ref: any) => (
                <div
                  key={ref.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    ref.status === ReferralStatus.PATIENT_ARRIVED
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : ref.status === ReferralStatus.FAILED
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5 flex-wrap gap-1">
                      <span className="font-extrabold text-slate-900 text-base">
                        {ref.patient_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {ref.patient_gender} • {ref.patient_village}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          ref.status === ReferralStatus.PATIENT_ARRIVED
                            ? 'bg-emerald-200 text-emerald-900'
                            : ref.status === ReferralStatus.COMPLETED
                            ? 'bg-blue-100 text-blue-900'
                            : ref.status === ReferralStatus.FAILED
                            ? 'bg-rose-200 text-rose-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {ref.status?.replace(/_/g, ' ')}
                      </span>

                      <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Ref ID: {ref.id}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center space-x-2 flex-wrap">
                      <span>Referred by: <strong>{ref.referring_doctor_name}</strong> ({ref.source_facility_name})</span>
                      <span>•</span>
                      <span>Specialty: <strong className="text-teal-700 uppercase">{ref.specialist_type || 'Cardiology'}</strong></span>
                    </div>

                    <p className="text-xs text-slate-700 bg-white/70 p-2 rounded-xl border border-slate-200/60 inline-block max-w-2xl">
                      Reason: "{ref.reason || ref.clinical_notes || 'Specialist examination and diagnostic workup'}"
                    </p>

                    {/* Diagnostics & Medicines Needed Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {ref.diagnosticsNeeded && ref.diagnosticsNeeded.length > 0 && (
                        ref.diagnosticsNeeded.map((d: any, idx: number) => (
                          <span key={idx} className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                            Order: {typeof d === 'string' ? d : d.type || d.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-1">
                    {ref.status === ReferralStatus.SENT || ref.status === 'REQUESTED' ? (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateReferral(ref.id, ReferralStatus.PATIENT_ARRIVED)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        Confirm Arrival
                      </button>
                    ) : ref.status === ReferralStatus.PATIENT_ARRIVED ? (
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateReferral(ref.id, ReferralStatus.COMPLETED)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                      >
                        Complete Care & Discharge
                      </button>
                    ) : null}

                    {ref.status !== ReferralStatus.COMPLETED && ref.status !== ReferralStatus.FAILED && (
                      <button
                        onClick={() => {
                          setSelectedReferral(ref);
                          setIsFailureModalOpen(true);
                        }}
                        className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
                        title="Report Referral Failure / Care Break"
                      >
                        Report Break
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: DIAGNOSTIC ORDERS & LAB RESULTS                       */}
      {/* ============================================================ */}
      {activeTab === 'diagnostics' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hospital Diagnostic Laboratory Queue</h2>
              <p className="text-xs text-slate-500">
                Perform investigations and upload results to advance patient Care Journeys
              </p>
            </div>
          </div>

          {diagnostics.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No diagnostic orders recorded for this facility yet.
            </div>
          ) : (
            <div className="space-y-3">
              {diagnostics.map((order: any) => (
                <div
                  key={order.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    order.status === 'COMPLETED'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {order.diagnostic_name}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        Patient: <strong>{order.patient_name}</strong> ({order.patient_village})
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          order.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      Ordered by {order.ordered_by_name} • {new Date(order.ordered_at).toLocaleDateString()}
                    </div>

                    {order.result_summary && (
                      <div className="text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200 mt-1">
                        <strong>Result:</strong> {order.result_summary}
                        {order.is_normal ? (
                          <span className="ml-2 text-emerald-700 font-bold">(Normal)</span>
                        ) : (
                          <span className="ml-2 text-rose-700 font-bold">(Abnormal Findings)</span>
                        )}
                      </div>
                    )}
                  </div>

                  {order.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => {
                        setSelectedDiagnostic(order);
                        setDiagSummary(`Completed ${order.diagnostic_name}. Review shows satisfactory parameters.`);
                        setDiagIsNormal(true);
                      }}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors shrink-0"
                    >
                      Record Lab Result
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Result Delivered</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: HOSPITAL PHARMACY                                     */}
      {/* ============================================================ */}
      {activeTab === 'pharmacy' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Hospital Pharmacy Stock & Dispensation</h2>
              <p className="text-xs text-slate-500">
                Verified inventory tracking • Dispense directly to patient prescriptions
              </p>
            </div>
            <button
              onClick={() => setIsDispenseModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Dispense Medicine</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Medicine Name</th>
                  <th className="py-2.5 px-3">Generic Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">In Stock</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicines.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{m.medicine_name}</td>
                    <td className="py-3 px-3 text-slate-600">{m.generic_name}</td>
                    <td className="py-3 px-3 text-slate-500 uppercase text-[10px] font-semibold">{m.category}</td>
                    <td className="py-3 px-3 font-black text-slate-900">{m.current_stock}</td>
                    <td className="py-3 px-3 text-slate-500">{m.unit}</td>
                    <td className="py-3 px-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        {m.stock_status || 'IN_STOCK'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => {
                          setDispenseMedId(m.medicine_id);
                          setIsDispenseModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Dispense
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: RESOURCE STATUS & DATA TRUST ENGINE                   */}
      {/* ============================================================ */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Facility Resource Telemetry & Data Trust Engine
              </h2>
              <p className="text-xs text-slate-500">
                Core SETHU Principle: <strong>Never pretend unknown data is known</strong>. Updating status here immediately boosts referral assurance scores.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res: any) => {
              const trustScore = res.trustScore || { score: 85, confidenceLevel: 'HIGH', isStale: false };
              const isAvail = res.status === ResourceStatus.AVAILABLE;

              return (
                <div
                  key={res.id}
                  className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3 relative hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {res.resource_type}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        trustScore.confidenceLevel === 'HIGH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Trust: {trustScore.score}% ({trustScore.confidenceLevel})
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-base">{res.resource_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Last verified: {new Date(res.last_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {res.update_source || 'FACILITY_STAFF'}
                    </p>
                  </div>

                  {/* Status Control Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateResource(res.id, ResourceStatus.AVAILABLE)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                          isAvail
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateResource(res.id, ResourceStatus.UNAVAILABLE)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                          !isAvail
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Unavailable
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpdateResource(res.id, res.status)}
                      className="text-[11px] font-bold text-teal-700 hover:underline flex items-center space-x-1"
                      title="Refresh verification timestamp"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Re-verify</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: RECORD DIAGNOSTIC RESULT                              */}
      {/* ============================================================ */}
      {selectedDiagnostic && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Upload Diagnostic Result
              </h3>
              <button
                onClick={() => setSelectedDiagnostic(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDiagnostic} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Test Name</label>
                <input
                  type="text"
                  disabled
                  value={selectedDiagnostic.diagnostic_name}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Findings Summary *</label>
                <textarea
                  required
                  rows={3}
                  value={diagSummary}
                  onChange={(e) => setDiagSummary(e.target.value)}
                  placeholder="Summarize key scan / investigation findings..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">Scan Findings are Normal:</span>
                <input
                  type="checkbox"
                  checked={diagIsNormal}
                  onChange={(e) => setDiagIsNormal(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDiagnostic(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  {actionLoading ? 'Saving...' : 'Submit Result & Advance Journey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DISPENSE MEDICINE                                      */}
      {/* ============================================================ */}
      {isDispenseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                <Pill className="w-5 h-5 text-emerald-600" />
                <span>Dispense Prescription Item</span>
              </h3>
              <button
                onClick={() => setIsDispenseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispenseMedicine} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={dispensePatientId}
                  onChange={(e) => setDispensePatientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white outline-none"
                >
                  {referrals.map((r: any) => (
                    <option key={r.patient_id} value={r.patient_id}>
                      {r.patient_name} ({r.patient_village})
                    </option>
                  ))}
                  <option value="pat-01">Sundaramoorthy (Valparai)</option>
                  <option value="pat-02">Lakshmi (Thenkarai)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Medicine *</label>
                <select
                  required
                  value={dispenseMedId}
                  onChange={(e) => setDispenseMedId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white outline-none"
                >
                  {medicines.map((m: any) => (
                    <option key={m.medicine_id} value={m.medicine_id}>
                      {m.medicine_name} ({m.current_stock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(parseInt(e.target.value, 10))}
                  className="w-full border border-slate-300 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pharmacist Notes</label>
                <input
                  type="text"
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  placeholder="e.g. 14 days supply, counselled on twice-daily regimen"
                  className="w-full border border-slate-300 rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDispenseModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  {actionLoading ? 'Dispensing...' : 'Confirm Dispensation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: REPORT REFERRAL FAILURE / CARE BREAK                  */}
      {/* ============================================================ */}
      {isFailureModalOpen && selectedReferral && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-rose-900 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Report Referral Disruption / Care Break</span>
              </h3>
              <button
                onClick={() => setIsFailureModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Reporting a failure will transition patient <strong>{selectedReferral.patient_name}</strong>'s Care Journey to <strong>CARE_BREAK</strong> and trigger automated frontline health worker recovery intervention.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Failure *</label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white outline-none"
                >
                  <option value="Patient lacked transport to district hospital">Patient lacked transport to district hospital</option>
                  <option value="Patient could not afford out-of-pocket costs">Patient could not afford out-of-pocket costs</option>
                  <option value="Specialist was unavailable on arrival">Specialist was unavailable on arrival</option>
                  <option value="Patient decided to seek alternative care">Patient decided to seek alternative care</option>
                  <option value="Family caregiver unable to accompany patient">Family caregiver unable to accompany patient</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFailureModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateReferral(selectedReferral.id, ReferralStatus.FAILED, failureReason)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm"
                >
                  {actionLoading ? 'Logging...' : 'Log Disruption & Trigger Recovery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
