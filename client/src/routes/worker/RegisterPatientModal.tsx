import React, { useState } from 'react';
import { createPatientApi } from '../../services/patientService';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterPatientModal({ isOpen, onClose, onSuccess }: RegisterPatientModalProps) {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('FEMALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [approxAge, setApproxAge] = useState('');
  const [village, setVillage] = useState('Nilgiri');
  const [phone, setPhone] = useState('');
  const [abhaId, setAbhaId] = useState('');
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [caregiverRelationship, setCaregiverRelationship] = useState('Son');
  const [initialComplaint, setInitialComplaint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Approximate DOB if age provided
      let computedDob = dateOfBirth;
      if (!computedDob && approxAge) {
        const year = new Date().getFullYear() - parseInt(approxAge, 10);
        computedDob = `${year}-01-01`;
      }

      await createPatientApi({
        fullName,
        gender,
        dateOfBirth: computedDob || null,
        village,
        phone: phone || null,
        abhaId: abhaId || null,
        caregiverName: caregiverName || null,
        caregiverPhone: caregiverPhone || null,
        caregiverRelationship,
        initialComplaint: initialComplaint || null,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to register patient');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Assisted Patient Registration</h3>
              <p className="text-xs text-slate-500">Quick frontline enrollment for rural community members</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Basic Demographics */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Meenakshi S."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Gender *</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Approx. Age (Years)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={approxAge}
                onChange={(e) => setApproxAge(e.target.value)}
                placeholder="e.g. 45"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Village *</label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Nilgiri">Nilgiri</option>
                <option value="Thenkarai">Thenkarai</option>
                <option value="Vazhapadi">Vazhapadi</option>
                <option value="Mettur">Mettur</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ABHA Health ID (Optional)</label>
            <input
              type="text"
              value={abhaId}
              onChange={(e) => setAbhaId(e.target.value)}
              placeholder="e.g. 91-1234-5678-9012"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
            />
          </div>

          {/* 2. Caregiver Contact */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">Primary Caregiver (Family Contact)</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={caregiverName}
                onChange={(e) => setCaregiverName(e.target.value)}
                placeholder="Caregiver Name"
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <input
                type="tel"
                value={caregiverPhone}
                onChange={(e) => setCaregiverPhone(e.target.value)}
                placeholder="Caregiver Phone"
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* 3. Initial Chief Complaint (to start active journey) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Presenting Problem / Chief Complaint</label>
            <textarea
              rows={2}
              value={initialComplaint}
              onChange={(e) => setInitialComplaint(e.target.value)}
              placeholder="Describe primary symptom or reason for visit to start active care journey..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Registering...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
