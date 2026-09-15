import React, { useState, useEffect } from 'react';
import type { TariffItem } from './TariffBreakdownChart';

interface TariffModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id: string;
    name: string;
    currency: string;
    energy_rate: number;
    time_rate: number;
    idle_rate: number;
    flat_fee: number;
  }) => void;
  initialData?: TariffItem | null;
  isLoading?: boolean;
}

const CURRENCIES = [
  { code: 'GBP', label: 'GBP (£) - British Pound' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'USD', label: 'USD ($) - US Dollar' },
  { code: 'CHF', label: 'CHF (Fr) - Swiss Franc' },
  { code: 'CAD', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', label: 'AUD ($) - Australian Dollar' },
];

export const TariffModelModal: React.FC<TariffModelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [energyRate, setEnergyRate] = useState('0.44');
  const [timeRate, setTimeRate] = useState('0.00');
  const [idleRate, setIdleRate] = useState('0.05');
  const [flatFee, setFlatFee] = useState('0.00');

  useEffect(() => {
    if (initialData) {
      setId(initialData.id || '');
      setName(initialData.name || '');
      setCurrency(initialData.currency || 'GBP');
      setEnergyRate(String(initialData.energy_rate ?? 0.44));
      setTimeRate(String(initialData.time_rate ?? 0.00));
      setIdleRate(String(initialData.idle_rate ?? 0.05));
      setFlatFee(String(initialData.flat_fee ?? 0.00));
    } else {
      setId(`tariff_${Date.now().toString(36)}`);
      setName('');
      setCurrency('GBP');
      setEnergyRate('0.44');
      setTimeRate('0.00');
      setIdleRate('0.05');
      setFlatFee('0.00');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: id.trim(),
      name: name.trim(),
      currency,
      energy_rate: parseFloat(energyRate) || 0,
      time_rate: parseFloat(timeRate) || 0,
      idle_rate: parseFloat(idleRate) || 0,
      flat_fee: parseFloat(flatFee) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg material-card bg-surface-container-low/95 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">payments</span>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              {isEdit ? 'Edit Tariff Billing Model' : 'Create New Tariff Model'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-body text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 uppercase tracking-wide font-mono">
                Tariff Identifier (ID)
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. tariff_fast_fleet"
                className={`w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 placeholder:text-slate-400 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all ${
                  isEdit ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 uppercase tracking-wide font-mono">
                Billing Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 uppercase tracking-wide font-mono">
              Tariff Plan Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Public AC Charging"
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 placeholder:text-slate-400 text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-slate-300 uppercase text-[11px] mb-1 font-semibold">
                Energy Rate ({currency}/kWh)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                required
                value={energyRate}
                onChange={(e) => setEnergyRate(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block font-mono text-slate-300 uppercase text-[11px] mb-1 font-semibold">
                Time Rate ({currency}/min)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                required
                value={timeRate}
                onChange={(e) => setTimeRate(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-slate-300 uppercase text-[11px] mb-1 font-semibold">
                Idle Penalty ({currency}/min)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                required
                value={idleRate}
                onChange={(e) => setIdleRate(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block font-mono text-slate-300 uppercase text-[11px] mb-1 font-semibold">
                Session Flat Start Fee ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={flatFee}
                onChange={(e) => setFlatFee(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white font-mono transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-primary text-slate-950 font-bold font-mono rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-apple-sm"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isEdit ? 'Update Tariff' : 'Register Tariff Model'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
