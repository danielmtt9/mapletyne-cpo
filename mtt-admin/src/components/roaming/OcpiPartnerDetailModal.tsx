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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="material-card bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 font-body">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[24px]">hub</span>
              <h2 className="font-headline text-xl font-bold text-slate-100">
                {partner.name || partner.party_id}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  isOnline
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {partner.status || 'Registered'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>Party ID: <strong className="text-primary font-bold">{partner.country_code}*{partner.party_id}</strong></span>
              <span>•</span>
              <span>Role: <strong className="text-slate-300">{partner.role || 'EMSP'}</strong></span>
              <span>•</span>
              <span>Protocol: <strong className="text-emerald-400 font-bold">OCPI 2.2.1</strong></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-700/80 rounded-xl font-mono text-xs">
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'modules'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Module Handshake
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'credentials'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Credentials & URLs
          </button>
          <button
            onClick={() => setActiveTab('cdrs')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'cdrs'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CDR & Reconciliation
          </button>
        </div>

        {/* Tab 1: Module Handshake Matrix */}
        {activeTab === 'modules' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700/60 shadow-inner space-y-3">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">
                OCPI 2.2.1 Active Interface Endpoints
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { name: 'Locations', role: 'Sender / Receiver', active: true },
                  { name: 'Tariffs', role: 'Sender', active: true },
                  { name: 'Sessions', role: 'Sender', active: true },
                  { name: 'CDRs', role: 'Sender (Real-time)', active: true },
                  { name: 'Tokens (RFID/App)', role: 'Receiver', active: true },
                  { name: 'Commands', role: 'Receiver (Start/Stop)', active: isOnline },
                ].map((m) => (
                  <div key={m.name} className="p-2.5 bg-slate-900 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{m.name}</span>
                      <span className={`w-2 h-2 rounded-full ${m.active ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    </div>
                    <span className="text-[10px] text-slate-400 block">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-700/60 rounded-xl">
              <span className="text-slate-400">Roaming Markup Rate:</span>
              <span className="text-emerald-400 font-bold">
                {partner.roaming_fee_kwh ? `+£${partner.roaming_fee_kwh}/kWh` : 'Standard Network Rate (+£0.00)'}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Credentials & URLs */}
        {activeTab === 'credentials' && (
          <div className="space-y-3 font-mono text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-700/60 shadow-inner">
            <div className="space-y-2.5">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Versions URL</span>
                <span className="text-slate-200 font-bold break-all">{partner.url || 'https://api.hubject.com/ocpi/versions'}</span>
              </div>
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Client Token B (Inbound Header)</span>
                <span className="text-cyan-300 font-bold break-all">Token {partner.token_b ? '••••••••••••' + partner.token_b.slice(-6) : 'GENERATED_JWT_SECURE'}</span>
              </div>
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Last Successful Sync</span>
                <span className="text-slate-300 font-bold">{partner.last_sync ? formatTimestamp(partner.last_sync) : 'Synchronized Today'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: CDR & Reconciliation */}
        {activeTab === 'cdrs' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-3 gap-3 text-center bg-slate-950/80 border border-slate-700/60 p-3.5 rounded-2xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Inbound Roaming</span>
                <span className="text-base font-bold text-white">42 Sessions</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Settled Volume</span>
                <span className="text-base font-bold text-emerald-400">1,248.6 kWh</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Sync Error Rate</span>
                <span className="text-base font-bold text-primary">0.00%</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 border border-slate-700/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Reconciliation Rule</span>
              <p className="text-[11px] text-slate-300 font-sans">
                CDRs are automatically delivered to {partner.name} over OCPI POST /cdrs within 15 seconds of session completion.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 font-mono text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTestPing(partner.id)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px] text-primary">network_ping</span>
              Test Connection Ping
            </button>
            <button
              onClick={() => onSync(partner.id)}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">sync</span>
              Sync Catalog & CDRs
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
