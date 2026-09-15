import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray, formatTimestamp } from '@/lib/utils';
import { OcpiPartnerDetailModal } from '@/components/roaming/OcpiPartnerDetailModal';

export const RoamingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Connect Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [partyId, setPartyId] = useState('');
  const [countryCode, setCountryCode] = useState('NL');
  const [role, setRole] = useState<'EMSP' | 'CPO' | 'HUB'>('EMSP');
  const [url, setUrl] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [roamingFeeKwh, setRoamingFeeKwh] = useState('');
  const [roamingFeeFlat, setRoamingFeeFlat] = useState('');

  // Generated Token Display Modal
  const [generatedTokenModal, setGeneratedTokenModal] = useState<{ name: string; token_a: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Queries
  const { data: rawPartners, isLoading: isPartnersLoading } = useQuery({
    queryKey: ['ocpi', 'partners'],
    queryFn: () => api.get<any>('/ocpi/partners').catch(() => ({ partners: [] })),
  });

  const { data: ocpiStatus } = useQuery({
    queryKey: ['ocpi', 'status'],
    queryFn: () => api.get<any>('/ocpi/status').catch(() => null),
  });

  const partners = ensureArray<any>(rawPartners, 'partners');

  // Mutations
  const createPartnerMutation = useMutation({
    mutationFn: async () => {
      return api.post<any>('/ocpi/partners', {
        name,
        party_id: partyId,
        country_code: countryCode,
        role,
        url,
        token_b: tokenB.trim() || undefined,
        roaming_fee_kwh: roamingFeeKwh ? parseFloat(roamingFeeKwh) : undefined,
        roaming_fee_flat: roamingFeeFlat ? parseFloat(roamingFeeFlat) : undefined,
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['ocpi'] });
      setIsConnectModalOpen(false);
      setName('');
      setPartyId('');
      setUrl('');
      setTokenB('');
      setRoamingFeeKwh('');
      setRoamingFeeFlat('');
      if (res?.token_a) {
        setGeneratedTokenModal({ name: res.partner?.name || name, token_a: res.token_a });
      } else {
        showToast('Partner registered successfully.');
      }
    },
    onError: (err: any) => {
      showToast(`Registration failed: ${err.message}`);
    },
  });

  const testPartnerMutation = useMutation({
    mutationFn: async (partnerId: number) => {
      return api.post<any>(`/ocpi/partners/${partnerId}/test`, {});
    },
    onSuccess: (res: any) => {
      if (res.ok) {
        showToast(`Connection to ${res.partner_name} OK (${res.elapsed_ms}ms, HTTP ${res.status_code})`);
      } else {
        showToast(`Connection test warning: ${res.error || res.ocpi_message || 'Unreachable'}`);
      }
    },
    onError: (err: any) => {
      showToast(`Test failed: ${err.message}`);
    },
  });

  const syncPartnerMutation = useMutation({
    mutationFn: async (partnerId: number) => {
      return api.post<any>(`/ocpi/partners/${partnerId}/sync`, {});
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['ocpi'] });
      showToast(`Sync triggered for ${res.partner_name || 'partner'}.`);
    },
    onError: (err: any) => {
      showToast(`Sync failed: ${err.message}`);
    },
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async (partnerId: number) => {
      return api.delete(`/ocpi/partners/${partnerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocpi'] });
      showToast('Roaming partner disconnected.');
    },
    onError: (err: any) => {
      showToast(`Delete failed: ${err.message}`);
    },
  });

  return (
    <div className="space-y-6 font-body">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 material-card bg-surface-container-highest/90 backdrop-blur-xl border border-primary/40 text-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-mono text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
            OCPI 2.2.1 Roaming Hub
          </h1>
          <p className="text-sm text-on-surface-variant font-body mt-1">
            eMSP partner connectivity (Hubject, Gireve, Shell Recharge) and bi-directional CDR / Location sync.
          </p>
        </div>
        <button
          onClick={() => setIsConnectModalOpen(true)}
          className="px-4 py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-xl shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add_link</span>
          Connect Partner
        </button>
      </div>

      {/* Standard Top KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Connected Partners
          </span>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {isPartnersLoading ? '...' : partners.length} <span className="text-xs font-mono font-normal text-slate-400">eMSPs</span>
          </div>
        </div>

        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Protocol Dialect
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            OCPI 2.2.1
          </div>
        </div>

        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Local Node Identifier
          </span>
          <div className="text-xl font-bold font-mono text-primary tracking-tight truncate">
            {ocpiStatus?.identity?.country_code || 'NL'}*{ocpiStatus?.identity?.party_id || 'OCP'}
          </div>
        </div>

        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Bi-directional Sync
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-300 tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active</span>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isPartnersLoading ? (
          <div className="col-span-3 material-card bg-slate-900/80 border border-slate-700 p-8 text-center text-slate-400 font-mono text-xs rounded-2xl">
            <span className="material-symbols-outlined text-3xl animate-spin mb-2 block text-primary">sync</span>
            Loading roaming partner catalog...
          </div>
        ) : partners.length === 0 ? (
          <div className="col-span-3 material-card bg-slate-900/80 border border-slate-700 p-8 text-center space-y-2 rounded-2xl shadow-md">
            <span className="material-symbols-outlined text-slate-400 text-[36px]">hub</span>
            <h3 className="font-headline text-base font-bold text-slate-100">No OCPI Roaming Partners Connected</h3>
            <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
              The CSMS platform supports bi-directional OCPI 2.2.1 protocol for Hubject, Gireve, and independent eMSPs. Click &apos;Connect Partner&apos; to register your first roaming credential handshake.
            </p>
          </div>
        ) : (
          partners.map((p: any) => {
            const isOnline = p.status === 'active' || p.status === 'connected';

            return (
              <div
                key={p.id || p.party_id}
                onClick={() => setSelectedPartner(p)}
                className="material-card bg-slate-900/90 border border-slate-700/80 p-5 space-y-4 rounded-2xl flex flex-col justify-between shadow-md hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-headline font-bold text-base text-slate-100 group-hover:text-primary transition-colors">
                        {p.name || p.party_id}
                      </h3>
                      <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">
                        OCPI 2.2.1 • {p.role || 'EMSP'}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                        isOnline
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {p.status || 'Registered'}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs text-slate-400 border-t border-white/5 pt-3">
                    <div className="flex justify-between">
                      <span>Party Identifier:</span>
                      <span className="text-slate-100 font-bold">{p.country_code}*{p.party_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Versions URL:</span>
                      <span className="text-slate-300 max-w-[180px] truncate" title={p.url}>
                        {p.url || '—'}
                      </span>
                    </div>
                    {p.roaming_fee_kwh !== undefined && p.roaming_fee_kwh !== null && (
                      <div className="flex justify-between">
                        <span>Roaming Markup:</span>
                        <span className="text-emerald-400 font-bold">+{p.roaming_fee_kwh} £/kWh</span>
                      </div>
                    )}
                    {p.last_sync && (
                      <div className="flex justify-between">
                        <span>Last Sync:</span>
                        <span className="text-slate-300">{formatTimestamp(p.last_sync)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="border-t border-white/5 pt-3 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    disabled={testPartnerMutation.isPending}
                    onClick={() => testPartnerMutation.mutate(p.id)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px] text-primary">network_ping</span>
                    Test Ping
                  </button>
                  <button
                    disabled={syncPartnerMutation.isPending || p.status !== 'active'}
                    onClick={() => syncPartnerMutation.mutate(p.id)}
                    title={p.status !== 'active' ? 'Partner must be active to sync' : 'Sync Catalog & CDRs'}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-slate-200 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px] text-cyan-400">sync</span>
                    Sync
                  </button>
                  <button
                    onClick={() => setSelectedPartner(p)}
                    className="p-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
                    title="Deep-Dive Inspector"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Disconnect and remove partner ${p.name}?`)) {
                        deletePartnerMutation.mutate(p.id);
                      }
                    }}
                    title="Remove Partner"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* OCPI Partner Detail Inspector Modal */}
      <OcpiPartnerDetailModal
        partner={selectedPartner}
        isOpen={Boolean(selectedPartner)}
        onClose={() => setSelectedPartner(null)}
        onTestPing={(id) => testPartnerMutation.mutate(id)}
        onSync={(id) => syncPartnerMutation.mutate(id)}
      />

      {/* Connect Partner Modal */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="material-card bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-headline text-lg font-bold text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_link</span>
                Connect OCPI Roaming Partner
              </h3>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPartnerMutation.mutate();
              }}
              className="space-y-4 text-xs font-mono"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 mb-1 font-bold uppercase text-[10px]">
                    Partner Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hubject Intercharge, Gireve, Shell"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold uppercase text-[10px]">
                    Country Code (ISO 2) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="e.g. DE, FR, NL"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none uppercase transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold uppercase text-[10px]">
                    Party ID (3 chars) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="e.g. HUB, GIR"
                    value={partyId}
                    onChange={(e) => setPartyId(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none uppercase transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold uppercase text-[10px]">
                    Partner Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                  >
                    <option value="EMSP" className="bg-slate-900 text-slate-100">eMSP (Mobility Service Provider)</option>
                    <option value="CPO" className="bg-slate-900 text-slate-100">CPO (Charge Point Operator)</option>
                    <option value="HUB" className="bg-slate-900 text-slate-100">Roaming Clearinghouse / HUB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-bold uppercase text-[10px]">
                    Roaming Markup (£/kWh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.05"
                    value={roamingFeeKwh}
                    onChange={(e) => setRoamingFeeKwh(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-300 mb-1 font-bold uppercase text-[10px]">
                    Partner OCPI Versions URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.partner.com/ocpi/versions"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-300 mb-1 font-bold uppercase text-[10px]">
                    Token B (Partner Auth Token - Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank if handshake will be initiated by partner"
                    value={tokenB}
                    onChange={(e) => setTokenB(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none font-mono text-[11px] transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPartnerMutation.isPending}
                  className="px-5 py-2 bg-primary text-slate-950 font-bold rounded-xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {createPartnerMutation.isPending && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                  Save & Generate Token A
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Token A Modal */}
      {generatedTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="material-card bg-slate-900/95 backdrop-blur-2xl border border-primary/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-primary font-bold">
              <span className="material-symbols-outlined">key</span>
              <span>Credentials Created for {generatedTokenModal.name}</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Provide this generated <span className="text-slate-100 font-bold">Token A</span> to the roaming partner. This will allow their system to authenticate with your CSMS endpoints.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-700 rounded-xl select-all break-all text-primary font-bold">
              {generatedTokenModal.token_a}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setGeneratedTokenModal(null)}
                className="px-5 py-2 bg-primary text-slate-950 font-bold rounded-xl hover:brightness-110 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

