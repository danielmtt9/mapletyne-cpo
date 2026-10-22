import React, { useState, useEffect } from 'react';

interface PricingTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tier: any) => void;
  initialData?: any | null;
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
  const [marginKwh, setMarginKwh] = useState('0.150');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setId(initialData.id || '');
      setName(initialData.name || '');
      setMarginKwh(initialData.margin_kwh !== undefined ? String(initialData.margin_kwh) : '0.150');
      setDescription(initialData.description || '');
    } else {
      setId('');
      setName('');
      setMarginKwh('0.150');
      setDescription('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim()) return;

    onSave({
      id: id.trim().toLowerCase().replace(/\s+/g, '_'),
      name: name.trim(),
      margin_kwh: parseFloat(marginKwh) || 0,
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md tabler-card bg-surface-container border border-outline p-6 rounded-xl space-y-5 shadow-2xl animate-in zoom-in-95 font-body">
        <div className="flex items-center justify-between border-b border-outline pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">loyalty</span>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              {isEdit ? 'Edit Customer Pricing Tier' : 'Add Customer Pricing Tier'}
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
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5 font-sans">
              Tier Identifier (Code) *
            </label>
            <input
              type="text"
              required
              disabled={isEdit}
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. vip_corporate_fleet"
              className={`w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3.5 text-on-surface placeholder:text-on-surface-variant font-mono text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all ${
                isEdit ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5 font-sans">
              Tier Display Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VIP Corporate Priority"
              className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3.5 text-on-surface placeholder:text-on-surface-variant text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5 font-sans">
              CPO Profit Margin Adder (£/kWh) *
            </label>
            <input
              type="number"
              step="0.001"
              required
              value={marginKwh}
              onChange={(e) => setMarginKwh(e.target.value)}
              className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3.5 text-on-surface placeholder:text-on-surface-variant font-mono text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
            />
            <span className="text-xs text-on-surface-variant mt-1.5 block">
              Added directly to the baseline cost basis (£/kWh) to determine retail rate.
            </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5 font-sans">
              Description / Policy Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Commercial fleets with >500 sessions/mo"
              className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3.5 text-on-surface placeholder:text-on-surface-variant text-base focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline text-on-surface font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-primary text-on-primary font-headline font-bold text-base rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
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
