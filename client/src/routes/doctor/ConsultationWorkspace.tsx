import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchClinicalSummary, saveConsultationApi } from '../../services/doctorService';
import { useAuthStore } from '../../stores/authStore';
import {
  ArrowLeft,
  Stethoscope,
  HeartPulse,
  AlertTriangle,
  FileText,
  Activity,
  Video,
  Send,
  Calendar,
  Pill,
  CheckCircle2,
  PhoneCall,
  Info,
  Printer,
  Plus,
  Trash2,
} from 'lucide-react';

export default function ConsultationWorkspace() {
  const { patientId } = useParams<{ patientId: string }>();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [assessment, setAssessment] = useState('');
  const [actionType, setActionType] = useState<'LOCAL_TREATMENT' | 'REQUEST_TELECONSULT' | 'ORDER_DIAGNOSTICS' | 'REFERRAL'>('REQUEST_TELECONSULT');
  const [medicines, setMedicines] = useState([
    { name: 'Amlodipine 5mg', dosage: '5mg', frequency: 'Once daily', durationDays: 14 },
    { name: 'Aspirin 75mg', dosage: '75mg', frequency: 'Once daily', durationDays: 14 },
  ]);
  const [specialtyRequired, setSpecialtyRequired] = useState('cardiology');
  const [reasonForTeleconsult, setReasonForTeleconsult] = useState('');
  const [selectedDiagnostics, setSelectedDiagnostics] = useState<string[]>(['ECG', 'X-ray']);
  const [referralFacility, setReferralFacility] = useState('fac-dh-01');
  const [referralReason, setReferralReason] = useState('');
  const [followUpDays, setFollowUpDays] = useState(7);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [prescriptionPreview, setPrescriptionPreview] = useState<any>(null);

  useEffect(() => {
    if (!patientId) return;
    setIsLoading(true);
    fetchClinicalSummary(patientId)
      .then((res) => {
        setData(res);
        if (res.journey?.primary_complaint) {
          setClinicalNotes(`Patient evaluated for ${res.journey.primary_complaint}. Vitals reviewed.`);
        }
      })
      .catch((err) => console.error('Error fetching clinical summary:', err))
      .finally(() => setIsLoading(false));
  }, [patientId]);

  const handleToggleDiagnostic = (diag: string) => {
    setSelectedDiagnostics((prev) =>
      prev.includes(diag) ? prev.filter((d) => d !== diag) : [...prev, diag]
    );
  };

  const updateMedicine = (index: number, field: string, value: string | number) => {
    setMedicines((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addMedicineRow = () => {
    setMedicines((prev) => [...prev, { name: '', dosage: '', frequency: 'Once daily', durationDays: 7 }]);
  };

  const removeMedicineRow = (index: number) => {
    setMedicines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    setIsSaving(true);

    try {
      const sanitizedMedicines = medicines
        .filter((medicine) => medicine.name?.trim())
        .map((medicine) => ({
          medicineId: medicine.name?.toLowerCase().includes('amlodipine') ? 'med-01' : medicine.name?.toLowerCase().includes('aspirin') ? 'med-07' : 'med-05',
          name: medicine.name,
          dosage: medicine.dosage || 'As directed',
          frequency: medicine.frequency || 'Once daily',
          durationDays: Number(medicine.durationDays || 7),
          instructions: 'Take as advised by doctor',
        }));

      await saveConsultationApi({
        patientId,
        encounterId: data?.encounters[0]?.id || null,
        careJourneyId: data?.journey?.id || null,
        clinicalNotes,
        assessment,
        actionType,
        specialtyRequired,
        reasonForTeleconsult: reasonForTeleconsult || assessment,
        diagnosticsToOrder: selectedDiagnostics,
        referralTargetFacilityId: referralFacility,
        referralReason: referralReason || assessment,
        followUpDays,
        medicines: sanitizedMedicines,
      });

      setPrescriptionPreview({
        patientName: patient?.full_name || 'Patient',
        doctorName: user?.fullName || 'Doctor',
        date: new Date().toLocaleDateString(),
        diagnosis: assessment || 'Clinical assessment',
        report: clinicalNotes || 'No report details provided.',
        medicines: sanitizedMedicines,
      });

      setSaveSuccess(true);
    } catch (err) {
      alert((err as Error).message || 'Failed to record consultation');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-slate-600">Loading patient clinical dossier...</p>
      </div>
    );
  }

  const patient = data?.patient;
  const journey = data?.journey;
  const triage = data?.triage;
  const analysis = triage?.analysis;
  const encounters = data?.encounters || [];
  const consultations = data?.consultations || [];
  const diagnostics = data?.diagnostics || [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/doctor"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clinical Queue</span>
        </Link>

        <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Doctor Workspace • Kaveri Primary Care
        </span>
      </div>

      {/* PATIENT BANNER */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-black text-xl">
            {patient?.full_name ? patient.full_name[0] : 'P'}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black text-slate-900">{patient?.full_name}</h1>
              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md uppercase">
                {patient?.gender}
              </span>
              {patient?.blood_group && (
                <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md">
                  {patient.blood_group}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Village: <strong>{patient?.village}</strong> • Phone: {patient?.phone || 'None'} • ABHA: {patient?.abha_id || 'Not linked'}
            </div>
          </div>
        </div>

        <div className="text-left md:text-right">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Care Journey State</span>
          <span className="inline-block mt-1 text-xs font-black px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl">
            {journey?.status ? journey.status.replace(/_/g, ' ') : 'ACTIVE'}
          </span>
          <div className="text-xs text-slate-600 mt-1">
            Complaint: <strong>"{journey?.primary_complaint || 'General consult'}"</strong>
          </div>
        </div>
      </div>

      {/* EMERGENCY ESCALATION BANNER (IF DETECTED) */}
      {analysis?.isEmergencyEscalation && (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-3xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wider">
                Emergency Escalation Protocol Triggered
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                Red flags detected by digital triage: <strong>{analysis.redFlags.join('; ')}</strong>
              </p>
              <p className="text-xs text-rose-700 mt-1">
                Receiving facility identified: <strong>Kaveri District Hospital (Emergency Dept)</strong>
              </p>
            </div>
          </div>

          <a
            href="tel:108"
            className="self-start md:self-auto flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-transform active:scale-95"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 108 Ambulance</span>
          </a>
        </div>
      )}

      {/* MAIN 3-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1: PATIENT MEDICAL DOSSIER (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Vitals History */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Current & Past Vitals</span>
            </h3>

            {triage?.vitals && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Blood Pressure</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {triage.vitals.bloodPressureSystolic ? `${triage.vitals.bloodPressureSystolic}/${triage.vitals.bloodPressureDiastolic}` : '—'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Oxygen Saturation</span>
                  <span className={`font-bold text-sm ${
                    triage.vitals.oxygenSaturation && triage.vitals.oxygenSaturation < 94 ? 'text-amber-700' : 'text-slate-900'
                  }`}>
                    {triage.vitals.oxygenSaturation ? `${triage.vitals.oxygenSaturation}%` : '—'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Pulse Rate</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {triage.vitals.heartRate ? `${triage.vitals.heartRate} bpm` : '—'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">Temperature</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {triage.vitals.temperature ? `${triage.vitals.temperature}°C` : '—'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Past Consultations */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Previous Encounters ({encounters.length})</span>
            </h3>

            {encounters.length === 0 ? (
              <p className="text-xs text-slate-400">First encounter recorded today.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {encounters.slice(0, 3).map((enc: any) => (
                  <div key={enc.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800">{enc.chief_complaint}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(enc.started_at).toLocaleDateString()} • {enc.clinician_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnostics Test Results */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Diagnostic Results</h3>
            {diagnostics.length === 0 ? (
              <p className="text-xs text-slate-400">No diagnostic reports uploaded yet.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {diagnostics.map((d: any, idx: number) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800">{d.diagnostic_name}</span>
                    <p className="text-[11px] text-slate-600">{d.result_summary || 'Pending results'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: DIGITAL TRIAGE DECISION SUPPORT (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
            {/* Disclaimer pill */}
            <div className="flex items-center space-x-2 bg-blue-50 text-blue-800 p-2.5 rounded-2xl border border-blue-200 text-[11px]">
              <Info className="w-4 h-4 shrink-0 text-blue-600" />
              <span>
                <strong>Decision Support / Triage Assistance:</strong> Deterministic rule-based evaluation. Never used as an AI diagnosis.
              </span>
            </div>

            {/* Triage Level Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Assigned Triage Tier
              </span>
              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-xl shadow-sm ${
                  analysis?.triageLevel === 'EMERGENCY'
                    ? 'bg-rose-600 text-white'
                    : analysis?.triageLevel === 'URGENT'
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {analysis?.triageLevel || triage?.triageLevel || 'ROUTINE'}
              </span>
            </div>

            {/* Red Flags / Warning Signs */}
            {analysis?.redFlags && analysis.redFlags.length > 0 && (
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs space-y-1">
                <span className="font-bold text-rose-900 block">Critical Red Flags:</span>
                <ul className="list-disc list-inside text-rose-800 space-y-0.5">
                  {analysis.redFlags.map((flag: string, i: number) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evaluation Reasons */}
            {analysis?.reasons && analysis.reasons.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">Rule Evaluation Criteria:</span>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  {analysis.reasons.map((reason: string, i: number) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Action */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1">
              <span className="font-bold text-emerald-900 block">Suggested Clinical Route:</span>
              <p className="text-emerald-800 leading-relaxed">
                {analysis?.recommendedAction || 'Perform routine clinical examination.'}
              </p>
            </div>

            {/* Symptoms Reported */}
            {triage?.symptoms && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700 block">Reported Symptoms:</span>
                <div className="flex flex-wrap gap-1.5">
                  {triage.symptoms.map((s: any, idx: number) => (
                    <span key={idx} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700">
                      {s.symptom} ({s.severity}, {s.duration})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: CLINICAL ASSESSMENT & ACTION ROUTING FORM (4 COLS) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              Doctor Assessment & Routing
            </h2>
            <p className="text-xs text-slate-500">Record clinical assessment and select care journey pathway</p>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-2xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Assessment saved! Prescription prepared and care journey advanced.</span>
            </div>
          )}

          {prescriptionPreview && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 print-preview">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-600">Prescription Preview</div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 text-white px-2.5 py-1.5 font-bold text-[10px]"
                >
                  <Printer className="w-3 h-3" />
                  Print / PDF
                </button>
              </div>

              <div id="prescription-print" className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <div>
                    <div className="text-xs font-black uppercase text-slate-500">SETHU Rural Healthcare</div>
                    <div className="text-sm font-black">Prescription</div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div>Doctor: {prescriptionPreview.doctorName}</div>
                    <div>Date: {prescriptionPreview.date}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px] mb-3">
                  <div><span className="font-bold">Patient:</span> {prescriptionPreview.patientName}</div>
                  <div><span className="font-bold">Diagnosis:</span> {prescriptionPreview.diagnosis}</div>
                </div>

                <div className="text-[11px] font-bold mb-2">Medicines</div>
                <div className="space-y-1.5 text-[11px]">
                  {prescriptionPreview.medicines.map((medicine: any, index: number) => (
                    <div key={`${medicine.name}-${index}`} className="flex items-center justify-between border-b border-slate-100 py-1">
                      <span>{medicine.name}</span>
                      <span>{medicine.dosage} • {medicine.frequency} • {medicine.durationDays} days</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-[11px]">
                  <span className="font-bold">Clinical report:</span> {prescriptionPreview.report}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Clinical Examination Notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Notes *</label>
              <textarea
                required
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Findings upon examination, cardiac auscultation, respiratory sounds..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              ></textarea>
            </div>

            {/* Assessment / Impression */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Impression / Assessment *</label>
              <input
                type="text"
                required
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="e.g. Suspected cardiac angina, uncontrolled hypertension"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Prescription Medicine list */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Prescription Medicines</span>
                <button type="button" onClick={addMedicineRow} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2 py-1.5 font-bold text-[10px]">
                  <Plus className="w-3 h-3" />
                  Add medicine
                </button>
              </div>

              {medicines.map((medicine, index) => (
                <div key={`med-${index}`} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={medicine.name}
                    onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                    placeholder="Medicine"
                    className="col-span-4 px-2 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    value={medicine.dosage}
                    onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                    placeholder="Dose"
                    className="col-span-2 px-2 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    value={medicine.frequency}
                    onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                    placeholder="Freq"
                    className="col-span-3 px-2 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    value={medicine.durationDays}
                    onChange={(e) => updateMedicine(index, 'durationDays', Number(e.target.value))}
                    placeholder="Days"
                    className="col-span-2 px-2 py-1.5 border border-slate-300 rounded-lg outline-none"
                  />
                  <button type="button" onClick={() => removeMedicineRow(index)} className="col-span-1 text-rose-600 hover:text-rose-800 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* PATHWAY SELECTOR */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Next Clinical Action Pathway *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType('REQUEST_TELECONSULT')}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                    actionType === 'REQUEST_TELECONSULT'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold ring-1 ring-teal-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Video className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-[11px]">Specialist Teleconsult</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('ORDER_DIAGNOSTICS')}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                    actionType === 'ORDER_DIAGNOSTICS'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">Order Diagnostics</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('REFERRAL')}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                    actionType === 'REFERRAL'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold ring-1 ring-amber-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Send className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px]">Hospital Referral</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionType('LOCAL_TREATMENT')}
                  className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                    actionType === 'LOCAL_TREATMENT'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px]">Local Prescription</span>
                </button>
              </div>
            </div>

            {/* CONDITIONAL SUB-FORM: TELECONSULT */}
            {actionType === 'REQUEST_TELECONSULT' && (
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
                <span className="font-bold text-teal-900 block">Virtual Specialist Consultation</span>
                <select
                  value={specialtyRequired}
                  onChange={(e) => setSpecialtyRequired(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-teal-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="cardiology">Cardiology (Dr. Venkat Reddy - District Hospital)</option>
                  <option value="general_surgery">General Surgery (Mettur CHC)</option>
                  <option value="orthopedics">Orthopedics (District Hospital)</option>
                  <option value="gynecology">Gynecology (District Hospital)</option>
                </select>
                <input
                  type="text"
                  value={reasonForTeleconsult}
                  onChange={(e) => setReasonForTeleconsult(e.target.value)}
                  placeholder="Reason for specialist teleconsultation..."
                  className="w-full px-2.5 py-1.5 border border-teal-300 rounded-xl text-xs outline-none"
                />
              </div>
            )}

            {/* CONDITIONAL SUB-FORM: ORDER DIAGNOSTICS */}
            {actionType === 'ORDER_DIAGNOSTICS' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <span className="font-bold text-emerald-900 block">Required Tests:</span>
                <div className="grid grid-cols-2 gap-2">
                  {['ECG', 'X-ray', 'Blood Test', 'Ultrasound'].map((d) => (
                    <label key={d} className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDiagnostics.includes(d)}
                        onChange={() => handleToggleDiagnostic(d)}
                        className="rounded text-emerald-600"
                      />
                      <span className="font-medium text-slate-800">{d}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* CONDITIONAL SUB-FORM: REFERRAL */}
            {actionType === 'REFERRAL' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <span className="font-bold text-amber-900 block">Target Receiving Facility:</span>
                <select
                  value={referralFacility}
                  onChange={(e) => setReferralFacility(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl text-xs bg-white outline-none"
                >
                  <option value="fac-dh-01">Kaveri District Hospital (32 km - Fresh data)</option>
                  <option value="fac-chc-01">Mettur Community Health Centre (14 km)</option>
                </select>
                <input
                  type="text"
                  value={referralReason}
                  onChange={(e) => setReferralReason(e.target.value)}
                  placeholder="Specific referral purpose..."
                  className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl text-xs outline-none"
                />
              </div>
            )}

            {/* Follow-up Days */}
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-slate-700">Follow-up Window:</span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(parseInt(e.target.value, 10))}
                  className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center font-bold text-xs"
                />
                <span className="text-slate-500 font-medium">days</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold rounded-2xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isSaving ? 'Submitting Assessment...' : 'Commit Clinical Assessment'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
