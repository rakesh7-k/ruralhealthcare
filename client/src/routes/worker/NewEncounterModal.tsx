import React, { useState } from 'react';
import { createEncounterApi } from '../../services/workerService';
import { X, Activity, AlertCircle, Heart } from 'lucide-react';

interface NewEncounterModalProps {
  isOpen: boolean;
  patient: { id: string; fullName: string; village: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewEncounterModal({ isOpen, patient, onClose, onSuccess }: NewEncounterModalProps) {
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [spO2, setSpO2] = useState('');
  const [temperature, setTemperature] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [severity, setSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE'>('MODERATE');
  const [duration, setDuration] = useState('2 days');
  const [hasChestPain, setHasChestPain] = useState(false);
  const [hasDyspnea, setHasDyspnea] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const vitals = {
        bloodPressureSystolic: systolic ? parseInt(systolic, 10) : null,
        bloodPressureDiastolic: diastolic ? parseInt(diastolic, 10) : null,
        heartRate: heartRate ? parseInt(heartRate, 10) : null,
        oxygenSaturation: spO2 ? parseInt(spO2, 10) : null,
        temperature: temperature ? parseFloat(temperature) : null,
      };

      const symptoms = symptomText
        ? [{ symptom: symptomText, duration, severity, notes: null }]
        : [];

      const warningSigns = [
        { sign: 'Chest pain', present: hasChestPain },
        { sign: 'Difficulty breathing', present: hasDyspnea },
      ];

      await createEncounterApi({
        patientId: patient.id,
        encounterType: 'HOME_VISIT',
        chiefComplaint,
        vitals,
        symptoms,
        warningSigns,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to record encounter');
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
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Encounter & Vitals</h3>
              <p className="text-xs text-slate-500">
                Patient: <strong className="text-slate-800">{patient.fullName}</strong> ({patient.village})
              </p>
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
          {/* Chief Complaint */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Chief Complaint *</label>
            <input
              type="text"
              required
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Chest tightness on exertion, dizziness"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Vitals Grid */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Vital Signs</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Blood Pressure (Systolic / Diastolic)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    placeholder="Sys (120)"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <span className="text-slate-400">/</span>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    placeholder="Dia (80)"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Pulse / Heart Rate (BPM)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  placeholder="e.g. 78"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Oxygen SpO2 (%)</label>
                <input
                  type="number"
                  value={spO2}
                  onChange={(e) => setSpO2(e.target.value)}
                  placeholder="e.g. 98"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="e.g. 37.0"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Primary Symptom */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block font-bold text-slate-700 mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 3 days"
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="col-span-1">
              <label className="block font-bold text-slate-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="MILD">Mild</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block font-bold text-slate-700 mb-1">Symptom</label>
              <input
                type="text"
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                placeholder="e.g. Cough"
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Warning Signs Check */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <span className="font-bold text-amber-900 block mb-1">Warning Signs (Red Flags)</span>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasChestPain}
                  onChange={(e) => setHasChestPain(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-amber-900 font-medium">Chest Pain</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDyspnea}
                  onChange={(e) => setHasDyspnea(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="text-amber-900 font-medium">Shortness of Breath</span>
              </label>
            </div>
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
              {isLoading ? 'Saving...' : 'Save Encounter & Initiate Triage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
