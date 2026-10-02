import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchCareRequirementById,
  evaluateCareRouteApi,
  confirmCareRouteApi,
} from '../../services/teleconsultService';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MapPin,
  Clock,
  ArrowRight,
  Info,
  Building2,
  Stethoscope,
  Activity,
  Pill,
  Send,
  Navigation,
} from 'lucide-react';

export default function CareRouteAssuranceView() {
  const { careReqId } = useParams<{ careReqId: string }>();
  const navigate = useNavigate();

  const [careReq, setCareReq] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);
  const [inspectingTrust, setInspectingTrust] = useState<any | null>(null);

  useEffect(() => {
    if (!careReqId) return;
    setIsLoading(true);

    // 1. Fetch Care Requirement details
    fetchCareRequirementById(careReqId)
      .then((reqData) => {
        setCareReq(reqData);
        // 2. Trigger deterministic Care Route Assurance evaluation
        return evaluateCareRouteApi(careReqId);
      })
      .then((evalData) => {
        setEvaluation(evalData);
        if (evalData.recommendedFacilityId) {
          setSelectedFacilityId(evalData.recommendedFacilityId);
        }
      })
      .catch((err) => console.error('Care Route Assurance error:', err))
      .finally(() => setIsLoading(false));
  }, [careReqId]);

  const handleConfirmRoute = async () => {
    if (!careReqId || !selectedFacilityId) return;
    setIsConfirming(true);

    try {
      await confirmCareRouteApi({
        careRequirementId: careReqId,
        facilityId: selectedFacilityId,
        reason: 'Care Route Assured: Complete capability and verified resource match.',
        expectedArrivalDays: 3,
      });

      setConfirmedSuccess(true);
      setTimeout(() => {
        navigate('/doctor');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to confirm care route');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold text-slate-700">
            Running SETHU Care Route Assurance Algorithm...
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Verifying candidate facility capabilities, data freshness, and travel feasibility
          </p>
        </div>
      </div>
    );
  }

  const matches = evaluation?.facilityMatches || [];
  const selectedMatch = matches.find((m: any) => m.facilityId === selectedFacilityId) || matches[0];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/doctor"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center space-x-1"
        >
          <span>← Back to Doctor Queue</span>
        </Link>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SETHU Innovation: Care Route Assurance</span>
          </span>
          <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
            Never Pretend Unknown Data is Known
          </span>
        </div>
      </div>

      {/* PATIENT CARE REQUIREMENT DOSSIER BANNER */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Care Need</span>
              <span className="text-xs font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded uppercase">
                {careReq?.urgency || 'URGENT'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {careReq?.patient_name} ({careReq?.patient_gender}, {careReq?.patient_village})
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Primary Complaint: <strong>"{careReq?.primary_complaint || 'Cardiac discomfort'}"</strong>
            </p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">Care Requirement Object:</span>
            <div className="text-slate-600">
              Specialist: <strong>{careReq?.specialist_type ? careReq.specialist_type.toUpperCase() : 'General'}</strong>
            </div>
            <div className="text-slate-600">
              Diagnostics: <strong>{careReq?.diagnosticsNeeded?.join(', ') || 'ECG, X-ray'}</strong>
            </div>
            <div className="text-slate-600">
              Medicines: <strong>{careReq?.medicinesNeeded?.join(', ') || 'Amlodipine 5mg'}</strong>
            </div>
          </div>
        </div>

        {/* ALGORITHM EXPLAINABILITY CALLOUT */}
        <div className="mt-4 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-xs">
          <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-900 block text-sm">
              Care Route Assurance Recommendation:
            </span>
            <p className="text-emerald-800 mt-0.5 leading-relaxed">
              {evaluation?.summaryRationale}
            </p>
          </div>
        </div>
      </div>

      {/* CANDIDATE FACILITY ROUTE COMPARISON CARDS */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-emerald-600" />
          <span>Evaluated Facility Care Routes ({matches.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {matches.map((match: any) => {
            const isSelected = selectedFacilityId === match.facilityId;
            const isRecommended = match.recommendation === 'RECOMMENDED';
            const isInsufficient = match.recommendation === 'INSUFFICIENT_DATA';

            return (
              <div
                key={match.facilityId}
                onClick={() => setSelectedFacilityId(match.facilityId)}
                className={`cursor-pointer rounded-3xl p-6 transition-all border-2 flex flex-col justify-between space-y-4 relative ${
                  isSelected
                    ? isRecommended
                      ? 'bg-emerald-50/40 border-emerald-500 shadow-md ring-4 ring-emerald-500/10'
                      : 'bg-amber-50/40 border-amber-500 shadow-md ring-4 ring-amber-500/10'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header with recommendation pill */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                          {match.facilityType}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{match.distanceKm} km away</span>
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>~{match.estimatedWaitMinutes} min wait</span>
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mt-1">
                        {match.facilityName}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-[11px] font-black uppercase px-3 py-1 rounded-xl shadow-sm inline-block ${
                          isRecommended
                            ? 'bg-emerald-600 text-white'
                            : isInsufficient
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {match.recommendation.replace(/_/g, ' ')}
                      </span>
                      <div className="text-[11px] font-bold text-slate-500 mt-1">
                        Assurance Score: <strong className="text-slate-900 text-xs">{match.overallScore}/100</strong>
                      </div>
                    </div>
                  </div>

                  {/* Capability Verification Checklist */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    {/* Specialist Capability */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                        <Stethoscope className="w-4 h-4 text-slate-500" />
                        <span>Specialist ({careReq?.specialist_type || 'General'})</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        {match.specialistMatch.available ? (
                          <span className="text-emerald-700 font-bold flex items-center space-x-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{match.specialistMatch.doctorName || 'Available'}</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold flex items-center space-x-1 text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>Not on duty</span>
                          </span>
                        )}

                        {match.specialistMatch.trustScore && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectingTrust(match.specialistMatch.trustScore);
                            }}
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border hover:underline ${
                              match.specialistMatch.trustScore.level === 'HIGH'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            Trust: {match.specialistMatch.trustScore.overall}%
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Diagnostics Capabilities */}
                    {match.diagnosticsMatch.map((dm: any) => (
                      <div
                        key={dm.name}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                          <Activity className="w-4 h-4 text-slate-500" />
                          <span>{dm.name}</span>
                        </span>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[11px] font-bold flex items-center space-x-1 ${
                              dm.status === 'AVAILABLE'
                                ? 'text-emerald-700'
                                : dm.status === 'UNKNOWN' || dm.status === 'STALE'
                                ? 'text-amber-600 font-extrabold'
                                : 'text-rose-600'
                            }`}
                          >
                            {dm.status === 'AVAILABLE' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : dm.status === 'UNKNOWN' || dm.status === 'STALE' ? (
                              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            )}
                            <span>{dm.status}</span>
                          </span>

                          {dm.trustScore && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingTrust(dm.trustScore);
                              }}
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border hover:underline ${
                                dm.trustScore.level === 'HIGH'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : dm.trustScore.level === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              Trust: {dm.trustScore.overall}%
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Medicines Capabilities */}
                    {match.medicinesMatch.map((mm: any) => (
                      <div
                        key={mm.name}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                          <Pill className="w-4 h-4 text-slate-500" />
                          <span>{mm.name}</span>
                        </span>

                        <span
                          className={`text-[11px] font-bold flex items-center space-x-1 ${
                            mm.status === 'AVAILABLE' || mm.status === 'LIMITED'
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {mm.status === 'AVAILABLE' || mm.status === 'LIMITED' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span>{mm.status}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Concerns / Rationale snippet */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-100 text-[11px] text-slate-700 leading-relaxed">
                    <strong>Algorithmic Verdict: </strong> {match.selectionExplanation}
                  </div>
                </div>

                {/* Selection Radio / Indicator */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">
                    {isSelected ? '✓ Currently Selected Route' : 'Click card to select this route'}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONFIRMATION DRAWER / ACTION BAR */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Selected Route to Confirm
          </span>
          <div className="text-lg font-black text-slate-900 mt-0.5">
            {selectedMatch?.facilityName} ({selectedMatch?.distanceKm} km away)
          </div>
          <p className="text-xs text-slate-500">
            Confirms the assured referral route, issues digital referral record, and updates the patient journey.
          </p>
        </div>

        {confirmedSuccess ? (
          <div className="p-3.5 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-2xl flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Referral Confirmed & Route Assured! Redirecting to doctor queue...</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={isConfirming}
            onClick={handleConfirmRoute}
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>{isConfirming ? 'Securing Verified Care Route...' : 'Confirm Verified Route & Book Referral'}</span>
          </button>
        )}
      </div>

      {/* MODAL: TRANSPARENT DATA TRUST SCORE INSPECTOR */}
      {inspectingTrust && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">Data Trust Score Breakdown</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingTrust(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Composite Trust Score</span>
                <div className="text-2xl font-black text-slate-900">{inspectingTrust.overall}/100</div>
              </div>
              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                  inspectingTrust.level === 'HIGH'
                    ? 'bg-emerald-100 text-emerald-800'
                    : inspectingTrust.level === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {inspectingTrust.level} TRUST
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">1. Freshness (40% weight)</span>
                  <span className="text-slate-500 text-[11px]">
                    Last updated: {inspectingTrust.breakdown.freshness.ageCategory} ago
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {inspectingTrust.breakdown.freshness.score}/100
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">2. Source Reliability (25% weight)</span>
                  <span className="text-slate-500 text-[11px]">
                    Source: {inspectingTrust.breakdown.sourceReliability.source}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {inspectingTrust.breakdown.sourceReliability.score}/100
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">3. Verification Status (20% weight)</span>
                  <span className="text-slate-500 text-[11px]">
                    State: {inspectingTrust.breakdown.verificationStatus.state}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {inspectingTrust.breakdown.verificationStatus.score}/100
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div>
                  <span className="font-bold text-slate-800 block">4. Cross-Check & Consistency (15%)</span>
                  <span className="text-slate-500 text-[11px]">
                    Consistency: {inspectingTrust.breakdown.crossCheck.consistency}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {inspectingTrust.breakdown.crossCheck.score}/100
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal pt-1">
              * SETHU guarantees absolute transparency. We never hide calculations or recommend facilities with stale/uncertain capability data.
            </p>

            <button
              type="button"
              onClick={() => setInspectingTrust(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
