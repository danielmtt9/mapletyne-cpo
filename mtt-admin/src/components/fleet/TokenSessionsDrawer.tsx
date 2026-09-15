import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';
import type { TokenItem } from './TokenIssueModal';

interface TokenSessionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenItem | null;
}

export const TokenSessionsDrawer: React.FC<TokenSessionsDrawerProps> = ({ isOpen, onClose, token }) => {
  const { data: rawSessions, isLoading } = useQuery({
    queryKey: ['tokens', token?.id || token?.uid, 'sessions'],
    queryFn: () => api.get<any>(`/tokens/${token?.id || token?.uid}/sessions`),
    enabled: Boolean(isOpen && (token?.id || token?.uid)),
  });

  const sessions = ensureArray<any>(rawSessions, 'sessions');

  if (!isOpen || !token) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-container-low border-l border-outline-variant/30 h-full p-6 space-y-5 shadow-2xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">ev_station</span>
              <h2 className="font-headline text-lg font-bold text-on-surface">Token Charging Sessions</h2>
            </div>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="bg-surface-container p-3 border border-outline-variant/20 space-y-1 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Token UID:</span>
              <span className="text-on-surface font-bold">{token.uid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Driver:</span>
              <span className="text-on-surface">{token.driver_name || '—'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
              Authorized Sessions ({sessions.length})
            </h3>

            {isLoading ? (
              <div className="p-6 text-center text-on-surface-variant font-mono text-xs">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant font-mono text-xs bg-surface-container border border-outline-variant/20">
                No charging sessions registered for this token.
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {sessions.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-3 bg-surface-container border border-outline-variant/20 space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">{s.charge_point || 'Charger'}</span>
                      <span className="text-primary font-bold">{Number(s.energy_kwh || 0).toFixed(2)} kWh</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant flex justify-between">
                      <span>Connector: #{s.connector_id ?? 1}</span>
                      <span>Status: {s.status || 'completed'}</span>
                    </div>
                    <div className="text-[10px] text-on-surface-variant pt-1 border-t border-outline-variant/20 flex justify-between">
                      <span>Started:</span>
                      <span>{s.start_time ? new Date(s.start_time).toLocaleString() : '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-outline-variant/20 pt-3">
          <button
            onClick={onClose}
            className="w-full py-2 bg-surface-container border border-outline-variant/30 text-on-surface font-mono text-xs hover:bg-surface-container-high transition-colors"
          >
            Close Sessions
          </button>
        </div>
      </div>
    </div>
  );
};
