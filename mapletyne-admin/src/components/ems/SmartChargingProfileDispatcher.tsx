import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';

export interface SmartChargingProfileDispatcherProps {
  onSuccessMessage?: (msg: string) => void;
}

export const SmartChargingProfileDispatcher: React.FC<SmartChargingProfileDispatcherProps> = ({
  onSuccessMessage,
}) => {
  const queryClient = useQueryClient();
  const [selectedChargerId, setSelectedChargerId] = useState<string>('all');
  const [limitKw, setLimitKw] = useState<string>('22.0');
  const [durationSeconds, setDurationSeconds] = useState<number>(3600); // 1 hour default
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const { data: rawChargers } = useQuery({
    queryKey: ['chargers'],
    queryFn: () => api.get<any>('/chargers'),
  });

  const chargers = ensureArray<any>(rawChargers, 'chargers');

  // Mutation to dispatch SetChargingProfile via REST endpoint
  const profileMutation = useMutation({
    mutationFn: async ({
      cpId,
      limit,
      duration,
    }: {
      cpId: string;
      limit: number;
      duration: number;
    }) => {
      if (cpId === 'all') {
        // Dispatch to all online chargers concurrently
        const onlineChargers = chargers.filter(
          (c) => c.status === 'online' || c.status === 'Available' || c.status === 'Charging'
        );
        const promises = onlineChargers.map((c) =>
          api.post(`/chargers/${c.id}/profile`, {
            connector_id: 1,
            limit_kw: limit,
            duration_seconds: duration > 0 ? duration : undefined,
          }).catch((err) => ({ error: err.message, cpId: c.id }))
        );
        return Promise.all(promises);
      } else {
        return api.post(`/chargers/${cpId}/profile`, {
          connector_id: 1,
          limit_kw: limit,
          duration_seconds: duration > 0 ? duration : undefined,
        });
      }
    },
    onSuccess: (_, vars) => {
      const msg =
        vars.cpId === 'all'
          ? `Dispatched ${vars.limit} kW profile across all active site chargers.`
          : `Dispatched ${vars.limit} kW profile to ${vars.cpId}.`;
      setStatusFeedback(msg);
      if (onSuccessMessage) onSuccessMessage(msg);
      queryClient.invalidateQueries({ queryKey: ['chargers'] });
      setTimeout(() => setStatusFeedback(null), 4000);
    },
    onError: (err: any) => {
      setStatusFeedback(`Dispatch failed: ${err.message}`);
      setTimeout(() => setStatusFeedback(null), 5000);
    },
  });

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limitKw);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setStatusFeedback('Please specify a valid positive power limit in kW.');
      return;
    }
    profileMutation.mutate({
      cpId: selectedChargerId,
      limit: parsedLimit,
      duration: durationSeconds,
    });
  };

  const handleReleaseOverride = () => {
    // Release profile by dispatching default maximum rating (e.g. 150 kW)
    profileMutation.mutate({
      cpId: selectedChargerId,
      limit: 150.0,
      duration: 0, // 0 indicates release / clear profile
    });
  };

  return (
    <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-3xl space-y-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0">electric_bolt</span>
          <h3 className="font-headline text-base font-bold uppercase tracking-wider text-on-surface truncate">
            Smart Charging Profile Dispatcher
          </h3>
        </div>
        <span className="text-[11px] font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/30 font-bold uppercase shrink-0">
          OCPP 1.6 / 2.0.1
        </span>
      </div>

      <p className="text-sm text-on-surface-variant font-body">
        Directly dispatch dynamic power ceilings (<code className="font-mono text-primary font-bold">SetChargingProfile</code>) to manage peak demand and prevent breaker overloads.
      </p>

      {statusFeedback && (
        <div className="p-3 bg-surface-container-high/90 border border-primary/40 text-on-surface font-mono text-xs rounded-xl flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
          <span className="truncate">{statusFeedback}</span>
        </div>
      )}

      <form onSubmit={handleDispatch} className="space-y-4 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Target Charger Dropdown */}
          <div>
            <label className="text-xs text-on-surface-variant uppercase font-medium block mb-1.5 font-sans">
              Target Charger
            </label>
            <select
              value={selectedChargerId}
              onChange={(e) => setSelectedChargerId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-xl h-11 px-3 text-base text-on-surface font-mono focus:outline-none focus:border-primary transition-all"
            >
              <option value="all">⚡ All Site Hardware Chargers ({chargers.length})</option>
              {chargers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} ({c.vendor || 'Generic'} {c.model || ''} - {c.status || 'offline'})
                </option>
              ))}
            </select>
          </div>

          {/* Power Ceiling Input */}
          <div>
            <label className="text-xs text-on-surface-variant uppercase font-medium block mb-1.5 font-sans">
              Power Ceiling (kW)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="3.7"
                max="350.0"
                required
                value={limitKw}
                onChange={(e) => setLimitKw(e.target.value)}
                placeholder="22.0"
                className="w-full bg-surface-container-lowest border border-white/10 rounded-xl h-11 px-3 pr-10 text-base text-on-surface font-mono focus:outline-none focus:border-primary transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">
                kW
              </span>
            </div>
          </div>

          {/* Duration Dropdown */}
          <div>
            <label className="text-xs text-on-surface-variant uppercase font-medium block mb-1.5 font-sans">
              Profile Duration
            </label>
            <select
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-xl h-11 px-3 text-base text-on-surface font-mono focus:outline-none focus:border-primary transition-all"
            >
              <option value={900}>15 Minutes</option>
              <option value={1800}>30 Minutes</option>
              <option value={3600}>1 Hour (Standard)</option>
              <option value={7200}>2 Hours (Peak Window)</option>
              <option value={14400}>4 Hours</option>
              <option value={0}>Permanent / Until Released</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={handleReleaseOverride}
            disabled={profileMutation.isPending}
            className="px-4 py-2.5 bg-surface-container-high rounded-xl border border-white/10 text-on-surface-variant hover:text-on-surface hover:border-secondary transition-all font-sans text-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            Release Cap (150 kW)
          </button>
          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all font-sans text-sm flex items-center gap-2 shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            {profileMutation.isPending ? 'Dispatching...' : 'Dispatch SetChargingProfile'}
          </button>
        </div>
      </form>
    </div>
  );
};
