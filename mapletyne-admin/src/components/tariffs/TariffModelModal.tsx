import React, { useState, useEffect } from 'react';
import type { TariffItem } from './TariffBreakdownChart';

interface TariffModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tariff: Partial<TariffItem>) => void;
  initialTariff?: TariffItem | null;
  initialData?: TariffItem | null;
  existingIds?: string[];
  isLoading?: boolean;
}

const SUPPORTED_CURRENCIES = [
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
];

export const TariffModelModal: React.FC<TariffModelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTariff,
  initialData,
  existingIds = [],
  isLoading = false,
}) => {
  const activeTariff = initialData || initialTariff;
  const isEdit = Boolean(activeTariff);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [energyRate, setEnergyRate] = useState('');
  const [timeRate, setTimeRate] = useState('');
  const [idleRate, setIdleRate] = useState('');
  const [flatFee, setFlatFee] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeTariff) {
      setId(activeTariff.id);
      setName(activeTariff.name || activeTariff.id);
      setCurrency(activeTariff.currency || 'GBP');
      setEnergyRate(activeTariff.energy_rate !== undefined ? String(activeTariff.energy_rate) : '');
      setTimeRate(activeTariff.time_rate !== undefined ? String(activeTariff.time_rate) : '');
      setIdleRate(activeTariff.idle_rate !== undefined ? String(activeTariff.idle_rate) : '');
      setFlatFee(activeTariff.flat_fee !== undefined ? String(activeTariff.flat_fee) : '');
    } else {
      setId('');
      setName('');
      setCurrency('GBP');
      setEnergyRate('0.42');
      setTimeRate('0.00');
      setIdleRate('0.05');
      setFlatFee('0.00');
    }
    setErrors({});
  }, [activeTariff, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!id.trim()) {
      newErrors.id = 'Tariff ID is required';
    } else if (!isEdit && existingIds.includes(id.trim())) {
      newErrors.id = 'A tariff with this ID already exists';
    }

    if (!name.trim()) {
      newErrors.name = 'Model name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg tabler-card bg-surface-container border border-outline p-6 rounded-xl space-y-5 shadow-2xl animate-in zoom-in-95 font-body">
        <div className="flex items-center justify-between border-b border-outline pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">payments</span>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              {isEdit ? 'Edit Tariff Billing Model' : 'Create New Tariff Model'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-body text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5 font-sans">
                Tariff Unique ID *
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={isEdit}
                placeholder="e.g. TRF-RAPID-01"
                className={`w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3.5 text-on-surface placeholder:text-on-surface-variant font-mono text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all ${
                  isEdit ? 'opacity-60 cursor-not-allowed' : ''
                } ${errors.id ? 'border-rose-500' : ''}`}
              />
              {errors.id && <span className="text-xs text-rose-500 mt-1 block">{errors.id}</span>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5 font-sans">
                Billing Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3 text-on-surface font-sans text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-surface-container text-on-surface">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5 font-sans">
              Display Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Peak Commercial"
              className={`w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3.5 text-on-surface placeholder:text-on-surface-variant text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all ${
                errors.name ? 'border-rose-500' : ''
              }`}
            />
            {errors.name && <span className="text-xs text-rose-500 mt-1 block">{errors.name}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-sm text-on-surface-variant font-semibold mb-1 font-sans">
                Energy Rate (/kWh)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={energyRate}
                onChange={(e) => setEnergyRate(e.target.value)}
                placeholder="0.420"
                className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3 text-on-surface font-mono text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-on-surface-variant font-semibold mb-1 font-sans">
                Time Rate (/min)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={timeRate}
                onChange={(e) => setTimeRate(e.target.value)}
                placeholder="0.000"
                className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3 text-on-surface font-mono text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-on-surface-variant font-semibold mb-1 font-sans">
                Idle Penalty Rate (/min)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={idleRate}
                onChange={(e) => setIdleRate(e.target.value)}
                placeholder="0.050"
                className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3 text-on-surface font-mono text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-on-surface-variant font-semibold mb-1 font-sans">
                Session Unlock Fee
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={flatFee}
                onChange={(e) => setFlatFee(e.target.value)}
                placeholder="0.00"
                className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3 text-on-surface font-mono text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline rounded-xl text-on-surface font-semibold text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-primary text-on-primary font-headline font-bold text-base rounded-xl hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isLoading ? 'progress_activity' : 'check'}
              </span>
              {isLoading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
