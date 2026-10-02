import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock3, Filter, MapPin, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { safeFetchJson } from '../../services/apiClient';
import { useAuthStore } from '../../stores/authStore';

const API_BASE = '/api/admin';

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchDistrictDashboard() {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/dashboard`,
    { headers: getAuthHeaders() }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch district dashboard');
  return data.data;
}

export default function DistrictDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadDashboard = () => {
    setIsLoading(true);
    fetchDistrictDashboard()
      .then(setData)
      .catch((err) => console.error('Failed to load district dashboard:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const district = data?.district || {};
  const facilities = data?.facilities || [];
  const referrals = data?.referrals || [];
  const emergencyBreaks = data?.emergencyBreaks || [];
  const monthlyPerformance = data?.monthlyPerformance || [];

  const filteredFacilities = useMemo(() => {
    if (!search.trim()) return facilities;
    const q = search.toLowerCase();
    return facilities.filter((facility: any) =>
      (facility.name || '').toLowerCase().includes(q) ||
      (facility.district || '').toLowerCase().includes(q) ||
      (facility.address || '').toLowerCase().includes(q)
    );
  }, [facilities, search]);

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-700">Loading district dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-900">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                District Oversight
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Kaveri Health District
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">District Performance Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">Care access coverage, referral continuity, and operational risk monitoring</p>
          </div>
        </div>

        <button
          onClick={loadDashboard}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
        >
          Refresh data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <MetricCard icon={<Building2 className="w-5 h-5" />} label="Facilities" value={district.totalFacilities || 0} hint="Active service sites" tone="emerald" />
        <MetricCard icon={<Users className="w-5 h-5" />} label="Patients" value={district.totalPatients || 0} hint="Tracked in the district" tone="sky" />
        <MetricCard icon={<TrendingUp className="w-5 h-5" />} label="Active journeys" value={district.activeCareJourneys || 0} hint="Currently in care" tone="amber" />
        <MetricCard icon={<ArrowRight className="w-5 h-5" />} label="Active referrals" value={district.activeReferrals || 0} hint="In-clinic to facility flow" tone="violet" />
        <MetricCard icon={<AlertTriangle className="w-5 h-5" />} label="Open breaks" value={district.openBreaks || 0} hint="Recovery actions needed" tone="rose" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Facility Coverage</h2>
              <p className="text-xs text-slate-500">Operational load and patient footprint by site</p>
            </div>
            <div className="relative w-full max-w-xs">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search facility"
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filteredFacilities.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">No facilities match your filter.</div>
            ) : (
              filteredFacilities.map((facility: any) => (
                <div key={facility.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="font-black text-slate-900 text-base">{facility.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{facility.address}</span>
                        <span>•</span>
                        <span>{facility.type || 'Primary/Secondary Care'}</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
                      {facility.status || 'Operational'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                    <StatTile label="Patients" value={facility.patient_count || 0} />
                    <StatTile label="Referrals" value={facility.referral_count || 0} />
                    <StatTile label="Care reqs" value={facility.care_requirement_count || 0} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Teleconsultation Load</h2>
            <p className="text-xs text-slate-500">Current queue pressure across the district</p>
          </div>

          <div className="mt-4 space-y-4">
            <MiniStat label="Active teleconsults" value={district.activeTeleconsultations || 0} icon={<Clock3 className="w-4 h-4" />} />
            <MiniStat label="Open care breaks" value={district.openBreaks || 0} icon={<AlertTriangle className="w-4 h-4" />} />
            <MiniStat label="Referrals in motion" value={district.activeReferrals || 0} icon={<ArrowRight className="w-4 h-4" />} />
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                Safety status
              </div>
              <p className="text-xs text-emerald-800 mt-1">District coordination workflow is operating within expected coverage and escalation thresholds.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Recent Referral Activity</h2>
            <p className="text-xs text-slate-500">Most recent patient referrals routed across the network</p>
          </div>

          <div className="mt-4 space-y-3">
            {referrals.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">No recent referral activity found.</div>
            ) : (
              referrals.map((referral: any) => (
                <div key={referral.id} className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{referral.patient_name}</div>
                      <div className="text-[11px] text-slate-500">{referral.target_facility_name}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black uppercase">
                      {referral.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                    <span>{referral.reason || 'Referral created'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Care Break Watchlist</h2>
            <p className="text-xs text-slate-500">Escalations and disruption alerts needing attention</p>
          </div>

          <div className="mt-4 space-y-3">
            {emergencyBreaks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">No active care breaks recorded.</div>
            ) : (
              emergencyBreaks.map((breakItem: any) => (
                <div key={breakItem.id} className="border border-rose-200 rounded-2xl p-3 bg-rose-50/60">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-slate-900 text-sm">{breakItem.patient_name}</div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 uppercase">
                      {breakItem.severity || 'HIGH'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">{breakItem.notes || 'Patient experienced care disruption'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Monthly Referral Momentum</h2>
          <p className="text-xs text-slate-500">Trend of referred care requests to determine service demand</p>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
          {monthlyPerformance.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 col-span-full">No monthly performance data available.</div>
          ) : (
            monthlyPerformance.map((item: any) => (
              <div key={item.month} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{item.month}</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{item.total_referrals}</div>
                <div className="text-[10px] text-slate-500">referrals</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  tone: 'emerald' | 'sky' | 'amber' | 'violet' | 'rose';
}) {
  const palette: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    sky: 'bg-sky-50 text-sky-800 border-sky-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    violet: 'bg-violet-50 text-violet-800 border-violet-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  return (
    <div className={`rounded-3xl border p-4 ${palette[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-xl bg-white/60">{icon}</div>
      </div>
      <div className="text-3xl font-black mt-3">{value}</div>
      <div className="text-[10px] opacity-80 mt-1">{hint}</div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 border border-slate-200">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
      <div className="text-xl font-black text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
        <div className="text-2xl font-black text-slate-900 mt-1">{value}</div>
      </div>
      <div className="p-2 rounded-xl bg-white text-slate-700">{icon}</div>
    </div>
  );
}
