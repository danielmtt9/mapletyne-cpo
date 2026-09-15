import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';

export interface PeakShavingGuardrailsProps {
  onSuccessMessage?: (msg: string) => void;
}

export const PeakShavingGuardrails: React.FC<PeakShavingGuardrailsProps> = ({
  onSuccessMessage,
}) => {
  const queryClient = useQueryClient();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('default');
  const [gridLimitKw, setGridLimitKw] = useState<string>('250.0');
  const [bufferPct, setBufferPct] = useState<number>(10); // 10% safety buffer
  const [strategy, setStrategy] = useState<string>('peak_shaving');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Fetch configured sites
  const { data: rawSites } = useQuery({
    queryKey: ['ems', 'sites'],
    queryFn: () => api.get<any>('/ems/sites').catch(() => ({ sites: [] })),
  });

  const sites = ensureArray<any>(rawSites, 'sites');

  // Load selected site parameters
  useEffect(() => {
    if (sites.length > 0) {
      const activeSite = sites.find((s) => s.id === selectedSiteId) || sites[0];
      if (activeSite) {
        setSelectedSiteId(activeSite.id);
        if (activeSite.grid_connection_kw) {
          setGridLimitKw(String(activeSite.grid_connection_kw));
        }
        if (activeSite.strategy) {
          setStrategy(activeSite.strategy);
        }
      }
    }
  }, [sites, selectedSiteId]);

  // Calculated peak shaving trigger threshold
  const numericLimit = parseFloat(gridLimitKw) || 250.0;
  const triggerThresholdKw = Number((numericLimit * (1 - bufferPct / 100)).toFixed(1));

  // Mutation to update site peak shaving config
  const updateSiteMutation = useMutation({
    mutationFn: (body: any) => api.post('/ems/sites', body),
    onSuccess: () => {
      const msg = `Peak shaving guardrails deployed. Grid Cap: ${numericLimit} kW (Trigger: ${triggerThresholdKw} kW).`;
      setStatusFeedback(msg);
      if (onSuccessMessage) onSuccessMessage(msg);
      queryClient.invalidateQueries({ queryKey: ['ems', 'sites'] });
      queryClient.invalidateQueries({ queryKey: ['ems', 'live'] });
      setTimeout(() => setStatusFeedback(null), 4000);
    },
    onError: (err: any) => {
      setStatusFeedback(`Failed to update site guardrails: ${err.message}`);
      setTimeout(() => setStatusFeedback(null), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteMutation.mutate({
      id: selectedSiteId || 'default',
      name: selectedSiteId === 'default' ? 'Primary Charging Hub' : selectedSiteId,
      grid_connection_kw: numericLimit,
      grid_phases: 3,
      strategy: strategy,
      strategy_params: {
        safety_buffer_pct: bufferPct,
        trigger_threshold_kw: triggerThresholdKw,
      },
      status: 'active',
    });
  };

  return (
    <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-3xl space-y-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">shield</span>
          <h3 className="font-headline text-base font-bold uppercase tracking-wider text-on-surface truncate">
            Autonomous Peak Shaving Guardrails
          </h3>
        </div>
        <span className="text-[11px] font-mono text-secondary bg-secondary/10 px-2.5 py-1 rounded-full border border-secondary/30 font-bold uppercase shrink-0">
          Dynamic Load Governor
        </span>
      </div>

      <p className="text-sm text-on-surface-variant font-body">
        Protects facility transformers from exceeding maximum demand limits. The governor automatically calculates site headroom and throttles EV charging output before surcharges occur.
      </p>

      {statusFeedback && (
        <div className="p-3 bg-surface-container-high/90 border border-secondary/40 text-on-surface font-mono text-xs rounded-xl flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shrink-0" />
          <span className="truncate">{statusFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Site Selector Dropdown */}
          <div>
            <label className="text-xs text-on-surface-variant uppercase font-medium block mb-1.5 font-sans">
              Select Site Location
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-xl h-11 px-3 text-base text-on-surface font-mono focus:outline-none focus:border-secondary transition-all"
            >
              <option value="default">🏢 Newcastle Primary Hub (Default)</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.id} ({s.grid_connection_kw || 250} kW)
                </option>
              ))}
            </select>
          </div>

          {/* Hard Grid Connection Cap Input */}
          <div>
            <label className="text-xs text-on-surface-variant uppercase font-medium block mb-1.5 font-sans">
              Grid Connection Cap (kW)
            </label>
            <div className="relative">
              <input
                type="number"
                step="5"
                min="50"
                max="2000"
                required
                value={gridLimitKw}
                onChange={(e) => setGridLimitKw(e.target.value)}
                placeholder="250"
                className="w-full bg-surface-container-lowest border border-white/10 rounded-xl h-11 px-3 pr-10 text-base text-on-surface font-mono focus:outline-none focus:border-secondary transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">
                kW
              </span>
            </div>
          </div>

          {/* Safety Buffer Dropdown */}
          <div>
            <label className="text-xs text-on-surface-variant uppercase font-medium block mb-1.5 font-sans">
              Safety Trigger Buffer
            </label>
            <select
              value={bufferPct}
              onChange={(e) => setBufferPct(Number(e.target.value))}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-xl h-11 px-3 text-base text-on-surface font-mono focus:outline-none focus:border-secondary transition-all"
            >
              <option value={5}>5% Buffer (Trigger at 95% load)</option>
              <option value={10}>10% Buffer (Trigger at 90% load) [Standard]</option>
              <option value={15}>15% Buffer (Trigger at 85% load)</option>
              <option value={20}>20% Buffer (Trigger at 80% load) [Strict]</option>
            </select>
          </div>

          {/* Curtailment Algorithm Dropdown */}
          <div>
            <label className="text-xs text-on-surface-variant uppercase font-medium block mb-1.5 font-sans">
              Curtailment Policy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-xl h-11 px-3 text-base text-on-surface font-mono focus:outline-none focus:border-secondary transition-all"
            >
              <option value="peak_shaving">Proportional Fair-Share</option>
              <option value="priority_fleet">Priority & Fleet First</option>
              <option value="fifo_taper">First-In Last-Out (FIFO)</option>
              <option value="min_floor_6a">Strict Minimum Floor (6A / 4.1 kW)</option>
            </select>
          </div>
        </div>

        {/* Live Setpoint Info Pill & Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-3 text-xs">
            <div className="px-3.5 py-1.5 bg-surface-container-lowest rounded-xl border border-white/10 flex items-center gap-2">
              <span className="text-on-surface-variant font-sans">Active Setpoint:</span>
              <span className="font-bold text-secondary tabular-nums">
                {triggerThresholdKw} kW ({100 - bufferPct}% of {numericLimit} kW)
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={updateSiteMutation.isPending}
            className="px-5 py-2.5 bg-secondary text-white font-bold rounded-xl hover:bg-secondary/90 transition-all font-sans text-sm flex items-center gap-2 shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {updateSiteMutation.isPending ? 'Saving...' : 'Save & Deploy Peak Shaving Guardrails'}
          </button>
        </div>
      </form>
    </div>
  );
};
