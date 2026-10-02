import React from 'react';
import { Role } from '@sethu/shared';
import { useAuthStore } from '../../stores/authStore';
import { UserCheck, Stethoscope, User, Building2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROLE_CONFIG: Array<{ role: Role; label: string; buttonLabel: string; icon: React.ReactNode; path: string }> = [
  { role: Role.PATIENT, label: 'Patient', buttonLabel: 'Continue as Patient', icon: <User className="w-4 h-4" />, path: '/patient' },
  { role: Role.WORKER, label: 'Frontline Worker', buttonLabel: 'Continue as Frontline Worker', icon: <UserCheck className="w-4 h-4" />, path: '/worker' },
  { role: Role.DOCTOR, label: 'Doctor', buttonLabel: 'Continue as Doctor', icon: <Stethoscope className="w-4 h-4" />, path: '/doctor' },
  { role: Role.FACILITY_STAFF, label: 'Facility Staff', buttonLabel: 'Continue as Facility Staff', icon: <Building2 className="w-4 h-4" />, path: '/facility' },
  { role: Role.ADMIN, label: 'District Admin', buttonLabel: 'Continue as District Admin', icon: <ShieldAlert className="w-4 h-4" />, path: '/admin' },
];

export function DemoRoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { activeRole, demoLogin, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.MODE !== 'production';

  if (!DEMO_MODE) return null;

  const handleRoleSwitch = async (role: Role, path: string) => {
    try {
      await demoLogin(role);
      navigate(path);
    } catch (err) {
      console.error('Failed to switch demo role:', err);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
        <span className="text-xs text-slate-400 font-medium px-2 hidden lg:inline">Demo Switch:</span>
        {ROLE_CONFIG.map(({ role, label, buttonLabel, icon, path }) => (
          <button
            key={role}
            onClick={() => handleRoleSwitch(role, path)}
            disabled={isLoading}
            title={buttonLabel}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeRole === role
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {icon}
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Hackathon Demo Role Switcher</h3>
          <p className="text-sm text-slate-500">Instant one-click authentication as any of the 5 core platform roles.</p>
        </div>
        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
          Demo Mode
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ROLE_CONFIG.map(({ role, label, buttonLabel, icon, path }) => (
          <button
            key={role}
            onClick={() => handleRoleSwitch(role, path)}
            disabled={isLoading}
            title={buttonLabel}
            className={`flex flex-col items-center p-4 rounded-lg border text-center transition-all ${
              activeRole === role
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
            }`}
          >
            <div className={`p-2.5 rounded-full mb-2 ${activeRole === role ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {icon}
            </div>
            <span className="text-sm font-semibold mb-1">{label}</span>
            <span className="text-xs text-slate-500 font-mono">
              {role === Role.PATIENT && 'Rajesh Kumar'}
              {role === Role.WORKER && 'Asha Devi (ASHA)'}
              {role === Role.DOCTOR && 'Dr. Anand Sharma'}
              {role === Role.FACILITY_STAFF && 'Ravi Kumar'}
              {role === Role.ADMIN && 'Collector S. Murugan'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
