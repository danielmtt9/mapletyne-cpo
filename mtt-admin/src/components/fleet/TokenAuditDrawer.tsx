import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';
import type { TokenItem } from './TokenIssueModal';

interface TokenAuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenItem | null;
}

export const TokenAuditDrawer: React.FC<TokenAuditDrawerProps> = ({ isOpen, onClose, token }) => {
  const { data: rawEvents, isLoading } = useQuery({
    queryKey: ['tokens', token?.id || token?.uid, 'events'],
    queryFn: () => api.get<any>(`/tokens/${token?.id || token?.uid}/events`),
    enabled: Boolean(isOpen && (token?.id || token?.uid)),
  });

  const events = ensureArray<any>(rawEvents, 'events');

  if (!isOpen || !token) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-container-low border-l border-outline-variant/30 h-full p-6 space-y-5 shadow-2xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">history</span>
              <h2 className="font-headline text-lg font-bold text-on-surface">Token Audit Trail</h2>
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
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Status:</span>
              <span className="text-primary font-bold">{token.status || 'active'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
              Chronological Events
            </h3>

            {isLoading ? (
              <div className="p-6 text-center text-on-surface-variant font-mono text-xs">
                Loading audit trail...
              </div>
            ) : events.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant font-mono text-xs bg-surface-container border border-outline-variant/20">
                No audit events recorded for this token.
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {events.map((ev: any, idx: number) => (
                  <div
                    key={ev.id || idx}
                    className="p-3 bg-surface-container border border-outline-variant/20 space-y-1 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary uppercase text-[11px]">{ev.event}</span>
                      <span className="text-[10px] text-on-surface-variant">
                        {ev.created_at ? new Date(ev.created_at).toLocaleString() : '—'}
                      </span>
                    </div>
                    {ev.details && <div className="text-on-surface text-[11px]">{ev.details}</div>}
                    <div className="text-[10px] text-on-surface-variant flex justify-between pt-1">
                      <span>Actor:</span>
                      <span className="text-on-surface">{ev.actor || 'system'}</span>
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
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
