import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { DemoRoleSwitcher } from '../../components/auth/DemoRoleSwitcher';
import { Shield, Lock, Phone, ArrowRight } from 'lucide-react';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.MODE !== 'production';

export default function LoginPage() {
  const [username, setUsername] = useState('asha.devi@sethu.demo');
  const [password, setPassword] = useState('sethu123');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/worker';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center bg-slate-900 text-emerald-400 font-extrabold text-3xl px-4 py-2 rounded-xl shadow-lg mb-3 tracking-wider">
          SETHU
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Public Healthcare Care Access Platform
        </h2>
        <p className="mt-1 text-sm text-slate-600 max-w-sm mx-auto">
          Keeping the patient's care journey moving from <strong>NEED</strong> to <strong>COMPLETION</strong>.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4 sm:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Login Column */}
          <div className="lg:col-span-5 bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              User Login
            </h3>
            {DEMO_MODE && (
              <div className="mb-4 inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                DEMO MODE
              </div>
            )}
            <p className="text-xs text-slate-500 mb-6">Enter phone number or registered email to sign in.</p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="9876500001 or asha.devi"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-center text-slate-400">
              Demo credentials pre-filled. Default password: <code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">sethu123</code>
            </div>
          </div>

          {/* Quick Demo Role Switcher Column */}
          <div className="lg:col-span-7">
            <DemoRoleSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
