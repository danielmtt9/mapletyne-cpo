import React, { useState, useEffect } from 'react';
import type { PricingTierItem } from './TierMarginChart';

interface PricingTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id: string;
    name: string;
    margin_kwh: number;
    description?: string;
  }) => void;
  initialData?: PricingTierItem | null;
  isLoading?: boolean;
}

export const PricingTierModal: React.FC<PricingTierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [marginKwh, setMarginKwh] = useState('0.080');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setId(initialData.id || '');
      setName(initialData.name || '');
      setMarginKwh(String(initialData.margin_kwh ?? 0.08));
      setDescription(initialData.description || '');
    } else {
      setId('');
      setName('');
      setMarginKwh('0.080');
      setDescription('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: id.trim().toLowerCase().replace(/\s+/g, '_'),
      name: name.trim(),
      margin_kwh: parseFloat(marginKwh) || 0,
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-md material-card bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 p-6 rounded-3xl space-y-5 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">loyalty</span>
            <h2 className="font-headline text-lg font-bold text-slate-100">
              {isEdit ? 'Edit Customer Pricing Tier' : 'Add Customer Pricing Tier'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-body text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 uppercase font-mono tracking-wide">
              Tier Identifier (Code)
            </label>
            <input
              type="text"
              required
              disabled={isEdit}
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. vip_corporate_fleet"
              className={`w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 placeholder:text-slate-400 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all ${
                isEdit ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 uppercase font-mono tracking-wide">
              Tier Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIP Corporate Priority"
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 placeholder:text-slate-400 text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 uppercase font-mono tracking-wide">
              CPO Profit Margin Adder (£/kWh)
            </label>
            <input
              type="number"
              step="0.001"
              required
              value={marginKwh}
              onChange={(e) => setMarginKwh(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 placeholder:text-slate-400 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
            />
            <span className="text-xs text-slate-400 font-mono mt-1 block">
              Added directly to the baseline cost basis (£/kWh) to determine retail rate.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 uppercase font-mono tracking-wide">
              Description / Policy Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Commercial fleets with >500 sessions/mo"
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-10 px-3 text-slate-100 placeholder:text-slate-400 text-xs focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-secondary text-slate-950 font-bold font-mono text-xs rounded-xl hover:bg-secondary/90 transition-colors flex items-center gap-2 shadow-apple-sm"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>{isEdit ? 'Update Margin Tier' : 'Save Pricing Tier'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
