import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatTimestamp, ensureArray } from '@/lib/utils';
import { useSiteContext } from '@/context/SiteContext';
import { ChargerDetailDrawer } from '@/components/chargers/ChargerDetailDrawer';

export const ChargersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedSite, setSelectedSite, availableSites } = useSiteContext();
  const [selectedCharger, setSelectedCharger] = useState<any | null>(null);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Provisioning
  const [newId, setNewId] = useState('');
  const [newVendor, setNewVendor] = useState('Otaski');
  const [newModel, setNewModel] = useState('HyperCharge 350');
  const [newMaxKw, setNewMaxKw] = useState('150');
  const [newSite, setNewSite] = useState(selectedSite !== 'all' ? selectedSite : 'Newcastle');
  const [newTariff, setNewTariff] = useState('0.42');

  const { data: rawChargers, isLoading } = useQuery({
    queryKey: ['chargers'],
    queryFn: () => api.get<any>('/chargers'),
  });

  const chargers = ensureArray<any>(rawChargers, 'chargers');

  // Provision Mutation
  const provisionMutation = useMutation({
    mutationFn: (body: any) => api.post('/chargers', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chargers'] });
      setIsProvisionOpen(false);
      setToastMessage('Charger provisioned successfully.');
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  // Remote Command Mutation
  const remoteCommandMutation = useMutation({
    mutationFn: ({ cpId, action, params, body }: { cpId: string; action: string; params?: any; body?: any }) => {
      if (action === 'start' || action === 'profile') {
        return api.post(`/chargers/${cpId}/${action}`, body || params || {});
      }
      const queryString = params
        ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
        : '';
      return api.post(`/chargers/${cpId}/${action}${queryString}`, body || {});
    },
    onSuccess: (_, vars) => {
      setToastMessage(`Command '${vars.action}' dispatched to ${vars.cpId}.`);
      queryClient.invalidateQueries({ queryKey: ['chargers'] });
      setTimeout(() => setToastMessage(null), 3000);
    },
    onError: (err: any) => {
      setToastMessage(`Command failed: ${err.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  const filteredChargers = chargers.filter((c) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'online' && (c.status === 'online' || c.status === 'Available' || c.status === 'Charging')) ||
      (statusFilter === 'faulted' && c.status === 'Faulted') ||
      (statusFilter === 'offline' && (c.status === 'offline' || c.status === 'Unavailable'));
    const chargerSite = (c.site || c.city || c.metadata?.city || '').toLowerCase();
    const matchesSite =
      selectedSite === 'all' ||
      chargerSite === selectedSite.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      c.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chargerSite.includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSite && matchesSearch;
  });

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    provisionMutation.mutate({
      id: newId,
      vendor: newVendor,
      model: newModel,
      max_power_kw: parseFloat(newMaxKw),
      site: newSite,
      tariff_kwh: parseFloat(newTariff),
      ocpp_version: '2.0.1',
    });
  };

  return (
    <div className="space-y-6 font-body">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 material-card bg-surface-container-highest/90 backdrop-blur-xl border border-primary/40 text-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-mono text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
            Hardware Chargers
          </h1>
          <p className="text-sm text-on-surface-variant font-body mt-1">
            Real-time status, telemetry inspection, and OCPP 2.0.1 remote operational controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProvisionOpen(true)}
            className="px-4 py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-xl shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Provision New Station
          </button>
        </div>
      </div>

      {/* Standard Top KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Total Charging Assets
          </span>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {isLoading ? '...' : chargers.length}
          </div>
        </div>

        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Active Dispensing Load
          </span>
          <div className="text-2xl font-bold font-mono text-primary tracking-tight">
            {isLoading ? '...' : chargers.filter(c => c.status === 'Charging').length} <span className="text-xs font-mono font-normal text-slate-400">Charging</span>
          </div>
        </div>

        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Online & Ready
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            {isLoading ? '...' : chargers.filter(c => c.status === 'Available' || c.status === 'online').length}
          </div>
        </div>

        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Station Faults / Alerts
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
            {isLoading ? '...' : chargers.filter(c => c.status === 'Faulted').length}
          </div>
        </div>
      </div>

      {/* Multi-Facet Filter Bar & View Switcher */}
      <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Status & Location Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pill Filters */}
          <div className="flex items-center gap-1.5 font-mono text-xs bg-surface-container-lowest/60 p-1 rounded-xl border border-white/5">
            {[
              { id: 'all', label: 'All Stations' },
              { id: 'online', label: 'Online / Available' },
              { id: 'faulted', label: 'Faulted' },
              { id: 'offline', label: 'Offline' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === pill.id
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Location Dropdown Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest/60 border border-white/10 rounded-xl text-xs font-mono text-slate-300">
            <span className="material-symbols-outlined text-[16px] text-blue-400">location_on</span>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Locations</option>
              {availableSites.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Query & View Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ID, site, model..."
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-9 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-400 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 font-mono transition-all shadow-xs"
            />
          </div>

          {/* Segmented View Switcher */}
          <div className="flex items-center bg-surface-container-lowest/60 p-1 rounded-xl border border-white/5 text-on-surface-variant">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid Cards"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-surface-container-high text-on-surface shadow-sm' : 'hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Data Ledger"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-surface-container-high text-on-surface shadow-sm' : 'hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode or Ledger Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full material-card bg-surface-container/60 p-12 text-center text-on-surface-variant rounded-2xl border border-white/5">
              <span className="material-symbols-outlined text-4xl animate-spin mb-2 block text-primary">sync</span>
              Streaming hardware inventory...
            </div>
          ) : filteredChargers.length === 0 ? (
            <div className="col-span-full material-card bg-surface-container/60 p-12 text-center text-on-surface-variant rounded-2xl border border-white/5">
              <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">ev_station</span>
              No charging stations found matching the filter criteria.
            </div>
          ) : (
            filteredChargers.map((c) => {
              const isOnline = c.status === 'online' || c.status === 'Available' || c.status === 'Charging';
              const isCharging = c.status === 'Charging';
              const isFaulted = c.status === 'Faulted';

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCharger(c)}
                  className="group relative material-card bg-surface-container border border-white/5 hover:border-white/20 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-2.5 rounded-xl bg-surface-container-lowest/80 border border-white/5 text-primary group-hover:text-primary transition-colors shrink-0">
                          <span className="material-symbols-outlined text-[20px]">ev_station</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-headline text-base font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                            {c.id}
                          </h3>
                          <span className="text-xs font-mono text-on-surface-variant block truncate">
                            {c.vendor || 'Generic'} {c.model || ''}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 text-xs font-mono font-bold uppercase rounded-full border flex items-center gap-1.5 shrink-0 ${
                          isCharging
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : isOnline
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isFaulted
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isCharging ? 'bg-blue-400 animate-pulse' : isOnline ? 'bg-emerald-400' : isFaulted ? 'bg-rose-400' : 'bg-zinc-500'
                          }`}
                        />
                        {c.status || 'Offline'}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs font-mono">
                      <div className="bg-surface-container-lowest/50 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[11px] text-on-surface-variant uppercase block">Max Output</span>
                        <span className="font-bold text-on-surface text-sm">{c.max_power_kw ? `${c.max_power_kw} kW` : '150 kW'}</span>
                      </div>
                      <div className="bg-surface-container-lowest/50 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[11px] text-on-surface-variant uppercase block">Tariff Rate</span>
                        <span className="font-bold text-on-surface text-sm">£{c.tariff_kwh || '0.42'}<span className="text-[11px] font-normal text-on-surface-variant">/kWh</span></span>
                      </div>
                    </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1 min-w-0 truncate">
                      <span className="material-symbols-outlined text-[14px] shrink-0">location_on</span>
                      <span className="truncate">{c.site || 'Newcastle'}</span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCharger(c)}
                        className="px-3 py-1 bg-surface-container-highest/80 hover:bg-primary hover:text-on-primary text-on-surface rounded-lg font-bold text-xs transition-all"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => remoteCommandMutation.mutate({ cpId: c.id, action: 'reset', params: { reset_type: 'Soft' } })}
                        title="Soft Reboot"
                        className="p-1.5 text-on-surface-variant hover:text-rose-400 hover:bg-surface-container-highest rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* High-Density Virtualized Table */
        <div className="material-card bg-surface-container border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse font-body text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-surface-container-lowest/60 text-xs font-mono text-on-surface-variant uppercase tracking-wider h-11">
                  <th className="px-5 min-w-[150px]">Station ID</th>
                  <th className="px-4 min-w-[120px]">Status</th>
                  <th className="px-4 min-w-[180px]">Vendor / Model</th>
                  <th className="px-4 min-w-[140px]">Site Location</th>
                  <th className="px-4 min-w-[110px] text-right">Max Power</th>
                  <th className="px-4 min-w-[120px] text-right">Default Tariff</th>
                  <th className="px-4 min-w-[150px]">Last Heartbeat</th>
                  <th className="px-5 min-w-[110px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-on-surface-variant">
                      Streaming hardware inventory...
                    </td>
                  </tr>
                ) : filteredChargers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-on-surface-variant">
                      No charging stations found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredChargers.map((c) => {
                    const isOnline = c.status === 'online' || c.status === 'Available' || c.status === 'Charging';
                    const isFaulted = c.status === 'Faulted';

                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCharger(c)}
                        className="h-11 hover:bg-surface-container-high/60 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 font-bold text-on-surface flex items-center gap-2.5 h-11">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isOnline ? 'bg-emerald-400' : isFaulted ? 'bg-rose-400' : 'bg-zinc-500'
                            }`}
                          />
                          <span className="group-hover:text-primary transition-colors truncate">{c.id}</span>
                        </td>
                        <td className="px-4">
                          <span
                            className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full border shrink-0 ${
                              isOnline
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : isFaulted
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                            }`}
                          >
                            {c.status || 'Offline'}
                          </span>
                        </td>
                        <td className="px-4 text-on-surface-variant font-body truncate">
                          {c.vendor || 'Generic'} {c.model || ''}
                        </td>
                        <td className="px-4 text-on-surface-variant truncate">{c.site || 'Newcastle'}</td>
                        <td className="px-4 text-right font-bold text-on-surface">
                          {c.max_power_kw ? `${c.max_power_kw} kW` : '150 kW'}
                        </td>
                        <td className="px-4 text-right text-on-surface-variant">
                          £{c.tariff_kwh || '0.42'}/kWh
                        </td>
                        <td className="px-4 text-on-surface-variant">
                          {formatTimestamp(c.last_heartbeat || c.updated_at)}
                        </td>
                        <td className="px-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedCharger(c)}
                              className="px-2.5 py-1 bg-surface-container-highest/80 hover:bg-primary hover:text-on-primary text-on-surface text-xs rounded-lg font-bold transition-all"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => remoteCommandMutation.mutate({ cpId: c.id, action: 'reset', params: { reset_type: 'Soft' } })}
                              title="Soft Reboot"
                              className="p-1.5 text-on-surface-variant hover:text-rose-400 hover:bg-surface-container-highest rounded-lg transition-all"
                            >
                              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
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
      )}

      {/* Hardware & Diagnostics Deep Dive Drawer */}
      <ChargerDetailDrawer
        charger={selectedCharger}
        isOpen={Boolean(selectedCharger)}
        onClose={() => setSelectedCharger(null)}
        onRemoteCommand={(action, params, body) =>
          remoteCommandMutation.mutate({
            cpId: selectedCharger.id,
            action,
            params,
            body,
          })
        }
      />

      {/* Provision New Charger Modal (`register_charger_modal_state`) */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl material-card bg-surface-container-low/95 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Provision New Charge Point
              </h2>
              <button
                onClick={() => setIsProvisionOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4 font-body text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Station ID (ChargePointId)</label>
                  <input
                    type="text"
                    required
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="otaskicharger2"
                    className="w-full bg-surface-container-lowest/80 border border-white/10 rounded-xl h-10 px-3 text-on-surface font-mono focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Vendor / Make</label>
                  <input
                    type="text"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    className="w-full bg-surface-container-lowest/80 border border-white/10 rounded-xl h-10 px-3 text-on-surface font-mono focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Model Name</label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full bg-surface-container-lowest/80 border border-white/10 rounded-xl h-10 px-3 text-on-surface font-mono focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Max Power (kW)</label>
                  <input
                    type="number"
                    value={newMaxKw}
                    onChange={(e) => setNewMaxKw(e.target.value)}
                    className="w-full bg-surface-container-lowest/80 border border-white/10 rounded-xl h-10 px-3 text-on-surface font-mono focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Site Location</label>
                  <input
                    type="text"
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    className="w-full bg-surface-container-lowest/80 border border-white/10 rounded-xl h-10 px-3 text-on-surface font-mono focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Tariff (£/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTariff}
                    onChange={(e) => setNewTariff(e.target.value)}
                    className="w-full bg-surface-container-lowest/80 border border-white/10 rounded-xl h-10 px-3 text-on-surface font-mono focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsProvisionOpen(false)}
                  className="px-4 py-2.5 material-card bg-surface-container border border-white/10 text-on-surface-variant rounded-xl font-mono hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisionMutation.isPending}
                  className="px-5 py-2.5 bg-primary text-on-primary font-bold font-mono rounded-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {provisionMutation.isPending ? 'Provisioning...' : 'Provision Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
