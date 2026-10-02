import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DemoRoleSwitcher } from './components/auth/DemoRoleSwitcher';
import LoginPage from './routes/login/LoginPage';
import { Role } from '@sethu/shared';
import { LogOut, UserCheck, Stethoscope, Building2, ShieldAlert, User } from 'lucide-react';
import PatientPortal from './routes/patient/PatientPortal';
import WorkerDashboard from './routes/worker/WorkerDashboard';
import PatientDetailView from './routes/worker/PatientDetailView';
import DoctorDashboard from './routes/doctor/DoctorDashboard';
import ConsultationWorkspace from './routes/doctor/ConsultationWorkspace';
import TeleconsultationRoom from './routes/doctor/TeleconsultationRoom';
import CareRouteAssuranceView from './routes/doctor/CareRouteAssuranceView';
import UniversalTeleconsultRoom from './routes/teleconsult/UniversalTeleconsultRoom';
import FacilityDashboard from './routes/facility/FacilityDashboard';
import DistrictDashboard from './routes/admin/DistrictDashboard';
import { LanguageProvider } from './components/common/LanguageSelector';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.MODE !== 'production';

function NavigationHeader() {
  const { user, activeRole, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded text-xl tracking-wider">
              SETHU
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Rural Healthcare Access & Continuity
            </span>
          </Link>
          {DEMO_MODE && (
            <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
              DEMO MODE
            </span>
          )}
        </div>

        {/* Demo Role Switcher in Header for hackathon testing */}
        <div className="flex items-center space-x-3">
          {DEMO_MODE && <DemoRoleSwitcher compact />}

          {isAuthenticated && user && (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-700">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white">{user.fullName}</div>
                <div className="text-[10px] text-emerald-400 font-mono uppercase">{activeRole}</div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function RoleDashboardPlaceholder({
  roleName,
  roleCode,
  description,
  icon,
}: {
  roleName: string;
  roleCode: Role;
  description: string;
  icon: React.ReactNode;
}) {
  const { user } = useAuthStore();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
              {icon}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900">{roleName} Portal</h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase">Logged In User</span>
            <div className="text-lg font-bold text-slate-800 mt-1">{user?.fullName || 'Demo User'}</div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">{user?.phone}</div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Role</span>
            <div className="text-lg font-bold text-emerald-700 mt-1">{roleCode}</div>
            <div className="text-xs text-slate-500 mt-0.5">Least-privilege RBAC active</div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase">Facility Context</span>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {user?.roles.find((r) => r.roleName === roleCode)?.facilityId ? 'Assigned Facility' : 'District Wide'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Kaveri Health District</div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm">
          <strong>Phase 2 Authentication Success:</strong> Session context loaded, JWT verified, and role guards active. Ready for Phase 3 (Patient & Worker Journey).
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <NavigationHeader />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/worker" replace />} />

          {/* Patient Experience */}
          <Route
            path="/patient/*"
            element={
              <ProtectedRoute allowedRoles={[Role.PATIENT]}>
                <LanguageProvider>
                  <PatientPortal />
                </LanguageProvider>
              </ProtectedRoute>
            }
          />

          {/* Frontline Worker Experience */}
          <Route
            path="/worker"
            element={
              <ProtectedRoute allowedRoles={[Role.WORKER]}>
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/patients/:id"
            element={
              <ProtectedRoute allowedRoles={[Role.WORKER]}>
                <PatientDetailView />
              </ProtectedRoute>
            }
          />

          {/* Doctor Experience */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={[Role.DOCTOR]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/consult/:patientId"
            element={
              <ProtectedRoute allowedRoles={[Role.DOCTOR]}>
                <ConsultationWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/teleconsult/:id"
            element={
              <ProtectedRoute allowedRoles={[Role.DOCTOR]}>
                <TeleconsultationRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/care-route/:careReqId"
            element={
              <ProtectedRoute allowedRoles={[Role.DOCTOR]}>
                <CareRouteAssuranceView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teleconsult/:id"
            element={
              <ProtectedRoute allowedRoles={[Role.WORKER, Role.PATIENT, Role.DOCTOR, Role.FACILITY_STAFF, Role.ADMIN]}>
                <UniversalTeleconsultRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/facility/*"
            element={
              <ProtectedRoute allowedRoles={[Role.FACILITY_STAFF]}>
                <FacilityDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <DistrictDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
