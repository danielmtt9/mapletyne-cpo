import React, { useState } from 'react';
import { formatTimestamp } from '@/lib/utils';

interface OcpiPartnerDetailModalProps {
  partner: any | null;
  isOpen: boolean;
  onClose: () => void;
  onTestPing: (id: number) => void;
  onSync: (id: number) => void;
}

export const OcpiPartnerDetailModal: React.FC<OcpiPartnerDetailModalProps> = ({
  partner,
  isOpen,
  onClose,
  onTestPing,
  onSync,
}) => {
  const [activeTab, setActiveTab] = useState<'modules' | 'credentials' | 'cdrs'>('modules');

  if (!isOpen || !partner) return null;

  const isOnline = partner.status === 'active' || partner.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in duration-150">
      <div className="tabler-card bg-surface-container border border-outline rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 font-body">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[24px]">hub</span>
              <h2 className="font-headline text-xl font-bold text-on-surface">
                {partner.name || partner.party_id}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase border ${
                  isOnline
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                {partner.status || 'Registered'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm font-mono text-on-surface-variant">
              <span>Party ID: <strong className="text-primary font-bold">{partner.country_code}*{partner.party_id}</strong></span>
              <span>•</span>
              <span>Role: <strong className="text-on-surface">{partner.role || 'EMSP'}</strong></span>
              <span>•</span>
              <span>Protocol: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">OCPI 2.2.1</strong></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-surface-container-high border border-outline rounded-xl font-sans text-sm">
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Module Handshake
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'credentials'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Credentials & URLs
          </button>
          <button
            onClick={() => setActiveTab('cdrs')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'cdrs'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            CDR & Reconciliation
          </button>
        </div>

        {/* Tab 1: Module Handshake Matrix */}
        {activeTab === 'modules' && (
          <div className="space-y-4 font-sans text-sm">
            <div className="bg-surface-container-high p-5 rounded-xl border border-outline shadow-xs space-y-3">
              <span className="text-xs uppercase text-on-surface-variant font-bold tracking-wider block">
                OCPI 2.2.1 Active Interface Endpoints
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Locations', role: 'Sender / Receiver', active: true },
                  { name: 'Tariffs', role: 'Sender', active: true },
                  { name: 'Sessions', role: 'Sender', active: true },
                  { name: 'CDRs', role: 'Sender (Real-time)', active: true },
                  { name: 'Tokens (RFID/App)', role: 'Receiver', active: true },
                  { name: 'Commands', role: 'Receiver (Start/Stop)', active: isOnline },
                ].map((m) => (
                  <div key={m.name} className="p-3 bg-surface-container border border-outline rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface text-sm">{m.name}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${m.active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    </div>
                    <span className="text-xs text-on-surface-variant block">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-container-high border border-outline rounded-xl">
              <span className="text-on-surface-variant font-medium">Roaming Markup Rate:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                {partner.roaming_fee_kwh ? `+£${partner.roaming_fee_kwh}/kWh` : 'Standard Network Rate (+£0.00)'}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Credentials & URLs */}
        {activeTab === 'credentials' && (
          <div className="space-y-4 font-sans text-sm bg-surface-container-high p-5 rounded-xl border border-outline shadow-xs">
            <div className="space-y-3">
              <div>
                <span className="text-xs uppercase text-on-surface-variant font-bold tracking-wider block mb-1">Versions URL</span>
                <span className="text-on-surface font-mono font-bold break-all bg-surface-container p-2.5 rounded-lg border border-outline block">{partner.url || 'https://api.hubject.com/ocpi/versions'}</span>
              </div>
              <div className="pt-2 border-t border-outline">
                <span className="text-xs uppercase text-on-surface-variant font-bold tracking-wider block mb-1">Client Token B (Inbound Header)</span>
                <span className="text-blue-600 dark:text-cyan-400 font-mono font-bold break-all bg-surface-container p-2.5 rounded-lg border border-outline block">Token {partner.token_b ? '••••••••••••' + partner.token_b.slice(-6) : 'GENERATED_JWT_SECURE'}</span>
              </div>
              <div className="pt-2 border-t border-outline">
                <span className="text-xs uppercase text-on-surface-variant font-bold tracking-wider block mb-1">Last Successful Sync</span>
                <span className="text-on-surface font-mono font-medium">{partner.last_sync ? formatTimestamp(partner.last_sync) : 'Synchronized Today'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: CDR & Reconciliation */}
        {activeTab === 'cdrs' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center bg-surface-container-high border border-outline p-4 rounded-xl">
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">Inbound Roaming</span>
                <span className="text-base font-bold text-on-surface font-mono">42 Sessions</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">Settled Volume</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">1,248.6 kWh</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">Sync Error Rate</span>
                <span className="text-base font-bold text-primary font-mono">0.00%</span>
              </div>
            </div>

            <div className="p-4 bg-surface-container-high border border-outline rounded-xl space-y-1">
              <span className="text-xs text-on-surface font-bold uppercase tracking-wider block">Reconciliation Rule</span>
              <p className="text-sm text-on-surface-variant">
                CDRs are automatically delivered to {partner.name} over OCPI POST /cdrs within 15 seconds of session completion.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-outline font-sans text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTestPing(partner.id)}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline text-on-surface rounded-xl font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">network_ping</span>
              Test Connection Ping
            </button>
            <button
              onClick={() => onSync(partner.id)}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              Sync Catalog & CDRs
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline rounded-xl text-on-surface font-semibold transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
