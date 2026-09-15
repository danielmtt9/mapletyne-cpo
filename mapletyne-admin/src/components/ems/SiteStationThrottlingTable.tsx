import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';

export interface SiteStationThrottlingTableProps {
  onStatusChange?: (msg: string) => void;
}

export const SiteStationThrottlingTable: React.FC<SiteStationThrottlingTableProps> = ({
  onStatusChange,
}) => {
  const queryClient = useQueryClient();

  const { data: rawChargers, isLoading } = useQuery({
    queryKey: ['chargers'],
    queryFn: () => api.get<any>('/chargers'),
    refetchInterval: 5000,
  });

  const chargers = ensureArray<any>(rawChargers, 'chargers');

  const throttleMutation = useMutation({
    mutationFn: ({ cpId, limit }: { cpId: string; limit: number }) =>
      api.post(`/chargers/${cpId}/profile`, {
        connector_id: 1,
        limit_kw: limit,
        duration_seconds: 3600,
      }),
    onSuccess: (_, vars) => {
      const msg = `Set ${vars.limit} kW profile on ${vars.cpId}.`;
      if (onStatusChange) onStatusChange(msg);
      queryClient.invalidateQueries({ queryKey: ['chargers'] });
    },
  });

  return (
    <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-headline text-base font-bold uppercase tracking-wider text-on-surface flex items-center gap-2.5 truncate">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">table_chart</span>
            <span className="truncate">Hardware Station Power Allocation & Throttling Status</span>
          </h3>
          <p className="text-xs text-on-surface-variant font-mono mt-1">
            Real-time OCPP 1.6 / 2.0.1 power ceilings allocated per physical endpoint.
          </p>
        </div>
        <span className="text-xs font-mono text-on-surface-variant px-3 py-1 bg-surface-container-lowest rounded-full border border-white/10 shrink-0">
          {chargers.length} Registered Endpoints
        </span>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[720px] text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-white/5 bg-surface-container-low/60 text-[11px] text-on-surface-variant uppercase tracking-wider h-11">
              <th className="px-6 min-w-[150px]">Station ID</th>
              <th className="px-4 min-w-[110px]">Status</th>
              <th className="px-4 min-w-[120px]">Hardware Rating</th>
              <th className="px-4 min-w-[120px] text-right">Actual Draw</th>
              <th className="px-4 min-w-[130px] text-right">OCPP Profile Cap</th>
              <th className="px-4 min-w-[140px] text-center">Governor State</th>
              <th className="px-6 min-w-[160px] text-center">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                  Loading site hardware inventory...
                </td>
              </tr>
            ) : chargers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                  No chargers registered at this site.
                </td>
              </tr>
            ) : (
              chargers.map((c) => {
                const isOnline = c.status === 'online' || c.status === 'Available' || c.status === 'Charging';
                const isCharging = c.status === 'Charging';
                const maxPower = c.max_power_kw || 150.0;
                const actualKw = isCharging ? (c.power_kw ?? 0.0) : 0.0;
                const activeCap = c.profile_limit_kw || maxPower;
                const isThrottled = activeCap < maxPower;

                return (
                  <tr key={c.id} className="h-12 hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 font-bold text-on-surface">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isOnline ? 'bg-status-online shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-status-offline'
                          }`}
                        />
                        <span className="truncate">{c.id}</span>
                      </div>
                    </td>
                    <td className="px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isCharging
                            ? 'bg-secondary/10 text-secondary border border-secondary/30'
                            : isOnline
                            ? 'bg-status-online/10 text-status-online border border-status-online/30'
                            : 'bg-status-offline/10 text-status-offline border border-status-offline/30'
                        }`}
                      >
                        {c.status || 'Offline'}
                      </span>
                    </td>
                    <td className="px-4 text-on-surface-variant">{maxPower.toFixed(1)} kW</td>
                    <td className="px-4 text-right font-bold text-primary tabular-nums">
                      {actualKw.toFixed(1)} kW
                    </td>
                    <td className="px-4 text-right font-bold text-on-surface tabular-nums">
                      {activeCap.toFixed(1)} kW
                    </td>
                    <td className="px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          isThrottled
                            ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                            : 'bg-primary/10 text-primary border-primary/30'
                        }`}
                      >
                        {isThrottled ? 'EMS THROTTLED' : 'FULL CAPACITY'}
                      </span>
                    </td>
                    <td className="px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => throttleMutation.mutate({ cpId: c.id, limit: 22.0 })}
                          disabled={throttleMutation.isPending}
                          className="px-2.5 py-1 rounded-lg bg-surface-container-high border border-white/10 text-[10px] hover:border-amber-400 hover:text-amber-400 transition-all font-sans"
                        >
                          Throttle 22kW
                        </button>
                        <button
                          onClick={() => throttleMutation.mutate({ cpId: c.id, limit: maxPower })}
                          disabled={throttleMutation.isPending}
                          className="px-2.5 py-1 rounded-lg bg-surface-container-high border border-white/10 text-[10px] hover:border-primary hover:text-primary transition-all font-sans"
                        >
                          Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
