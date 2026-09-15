import React, { useState, useEffect } from 'react';

export interface CostComponent {
  key: string;
  value: number;
  description?: string;
  updated_at?: string;
  updated_by?: string;
}

interface CostBasisCardProps {
  components: CostComponent[];
  totalCostBasis: number;
  onSave: (updates: Record<string, number>) => void;
  isLoading?: boolean;
}

// Allowed pricing keys with human-friendly labels
const PRICING_COMPONENT_LABELS: Record<string, string> = {
  grid_fee: 'Grid Transport & Distribution Fee',
  balancing_fee: 'Ancillary Balancing Charge',
  wholesale_base: 'Wholesale Base Energy Rate',
  tax_rate: 'Standard VAT / Tax Rate',
  btw_rate: 'Standard VAT / BTW Rate',
  green_certificate: 'Renewable Guarantees of Origin (GoO)',
  network_access: 'Substation Network Access Fee',
};

export const CostBasisCard: React.FC<CostBasisCardProps> = ({
  components,
  totalCostBasis,
  onSave,
  isLoading = false,
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isModified, setIsModified] = useState(false);

  // Filter out any non-pricing or sensitive keys (e.g. smtp, credentials, legacy source toggles)
  const validComponents = components.filter((c) => {
    const k = c.key.toLowerCase();
    if (k.startsWith('smtp.') || k.startsWith('org.') || k.startsWith('branding.') || k.includes('password') || k.includes('source') || k.includes('manual')) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (validComponents.length > 0) {
      const initial: Record<string, string> = {};
      validComponents.forEach((c) => {
        initial[c.key] = String(c.value);
      });
      setFormValues(initial);
      setIsModified(false);
    }
  }, [components]);

  const handleChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
    setIsModified(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Record<string, number> = {};
    Object.entries(formValues).forEach(([k, v]) => {
      updates[k] = parseFloat(v) || 0;
    });
    onSave(updates);
    setIsModified(false);
  };

  return (
    <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
          <h3 className="font-headline text-base font-bold text-on-surface">
            Network Cost Basis & Tax Parameters
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-on-surface-variant block uppercase">Total Cost Basis</span>
          <span className="text-sm font-headline font-bold text-primary">
            £{totalCostBasis.toFixed(3)} / kWh
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3 font-mono text-xs">
        {validComponents.length === 0 ? (
          <div className="text-center py-6 text-on-surface-variant font-mono text-xs">
            No dynamic cost components configured.
          </div>
        ) : (
          <div className="space-y-3">
            {validComponents.map((c) => {
              const isTax = c.key.includes('tax') || c.key.includes('btw');
              const label = PRICING_COMPONENT_LABELS[c.key] || c.key.replace(/_/g, ' ');

              return (
                <div
                  key={c.key}
                  className="flex items-center justify-between gap-4 bg-slate-900/90 p-3 rounded-xl border border-slate-700/70"
                >
                  <div className="flex-1">
                    <div className="font-bold text-slate-100 text-xs uppercase tracking-wide">
                      {label}
                    </div>
                    {c.description && (
                      <div className="text-xs text-slate-400 mt-0.5">{c.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={isTax ? '0.01' : '0.001'}
                      min="0"
                      value={formValues[c.key] ?? c.value}
                      onChange={(e) => handleChange(c.key, e.target.value)}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-lg h-8 px-2 text-right text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                    />
                    <span className="text-slate-300 text-xs w-12 font-mono">
                      {isTax ? '(rate)' : '£/kWh'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={!isModified || isLoading}
            className={`px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 transition-colors ${
              isModified && !isLoading
                ? 'bg-primary text-on-primary hover:bg-primary/90 cursor-pointer shadow-lg'
                : 'bg-surface-container-highest text-on-surface-variant opacity-60 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Save Cost Basis Config</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
