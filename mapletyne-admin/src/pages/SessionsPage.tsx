import React, { useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { api } from '@/lib/api-client';
import { formatKwh, formatCurrency, formatTimestamp, ensureArray } from '@/lib/utils';
import { useSiteContext } from '@/context/SiteContext';
import { SessionDetailModal } from '@/components/sessions/SessionDetailModal';

export const SessionsPage: React.FC = () => {
  const { selectedSite, setSelectedSite, availableSites } = useSiteContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const { data: rawSessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<any>('/sessions'),
  });

  const { data: rawChargers } = useQuery({
    queryKey: ['chargers'],
    queryFn: () => api.get<any>('/chargers'),
  });

  const sessions = ensureArray<any>(rawSessions, 'sessions');
  const chargers = ensureArray<any>(rawChargers, 'chargers');

  // Build a lookup map of chargerId -> site
  const chargerSiteMap = useMemo(() => {
    const map = new Map<string, string>();
    chargers.forEach((c) => {
      const siteVal = c?.site || c?.city || c?.metadata?.city;
      if (c && c.id && siteVal) {
        map.set(c.id.toLowerCase(), String(siteVal).toLowerCase());
      }
    });
    return map;
  }, [chargers]);

  const filteredSessions = sessions.filter((s) => {
    const cpId = (s.charge_point || s.charge_point_id || '').toLowerCase();
    const authId = (s.auth_id || s.driver_email || s.id_tag || '').toLowerCase();
    const sessionId = (s.id || '').toLowerCase();

    const matchesSearch =
      !searchQuery ||
      sessionId.includes(searchQuery.toLowerCase()) ||
      cpId.includes(searchQuery.toLowerCase()) ||
      authId.includes(searchQuery.toLowerCase());

    const sessionSite = s.site ? s.site.toLowerCase() : chargerSiteMap.get(cpId) || '';

    const matchesSite =
      selectedSite === 'all' ||
      (sessionSite && sessionSite === selectedSite.toLowerCase());

    return matchesSearch && matchesSite;
  });

  // Calculate high-level summary KPIs
  const totalEnergyKwh = useMemo(() => {
    return filteredSessions.reduce((acc, s) => acc + (s.energy_kwh ?? s.kwh_delivered ?? 0), 0);
  }, [filteredSessions]);

  const totalRevenue = useMemo(() => {
    return filteredSessions.reduce((acc, s) => acc + (s.total_cost ?? s.amount_total ?? ((s.energy_kwh || 0) * 0.42)), 0);
  }, [filteredSessions]);

  const avgEnergyKwh = filteredSessions.length > 0 ? totalEnergyKwh / filteredSessions.length : 0;

  const handleExportCsv = () => {
    if (!filteredSessions || filteredSessions.length === 0) {
      alert('No sessions available to export.');
      return;
    }
    const headers = [
      'Session ID',
      'Charge Point',
      'Connector',
      'Driver / Auth Tag',
      'Start Time',
      'Stop Time',
      'Energy (kWh)',
      'Total Cost (£)',
      'Status',
    ];
    const rows = filteredSessions.map((s) => [
      `"${s.id || s.transaction_id || ''}"`,
      `"${s.charge_point || s.charge_point_id || ''}"`,
      `"${s.connector_id || 1}"`,
      `"${s.auth_id || s.driver_email || s.id_tag || 'Guest'}"`,
      `"${s.start_time || ''}"`,
      `"${s.stop_time || ''}"`,
      `"${s.energy_kwh ?? 0}"`,
      `"${s.cost ?? s.total_cost ?? (s.energy_kwh ? (s.energy_kwh * 0.42).toFixed(2) : 0)}"`,
      `"${s.status || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sessions_cdr_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredSessions.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 40,
    overscan: 15,
  });
  void rowVirtualizer.getTotalSize();

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">
            Sessions & Billing Ledger
          </h1>
          <p className="text-xs text-on-surface-variant font-body mt-1">
            Chronological CDR transaction archive, energy metering curves, and automated VAT invoices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="px-5 py-2.5 bg-surface-container-high border border-outline text-on-surface font-sans text-base rounded-xl hover:bg-surface-container-highest transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Flush Metric Ribbon (Seamlessly blended with background canvas) */}
      <div className="py-2 mb-6 border-y border-outline/50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-outline/50 py-2">
          <div className="flex flex-col justify-between pt-2 sm:pt-0 sm:px-6 first:sm:pl-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Recorded Transactions
            </span>
            <div className="text-4xl font-bold font-mono text-on-surface tracking-tight mt-1">
              {isLoading ? '...' : filteredSessions.length}
            </div>
          </div>

          <div className="flex flex-col justify-between pt-2 sm:pt-0 sm:px-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Total Dispensed Energy
            </span>
            <div className="text-4xl font-bold font-mono text-emerald-400 tracking-tight mt-1">
              {isLoading ? '...' : formatKwh(totalEnergyKwh)}
            </div>
          </div>

          <div className="flex flex-col justify-between pt-2 sm:pt-0 sm:px-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Gross Settled Revenue
            </span>
            <div className="text-4xl font-bold font-mono text-primary tracking-tight mt-1">
              {isLoading ? '...' : formatCurrency(totalRevenue)}
            </div>
          </div>

          <div className="flex flex-col justify-between pt-2 sm:pt-0 sm:px-4 last:sm:pr-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Avg Session Energy
            </span>
            <div className="text-4xl font-bold font-mono text-cyan-300 tracking-tight mt-1">
              {isLoading ? '...' : formatKwh(avgEnergyKwh)}
            </div>
          </div>
        </div>
      </div>

      {/* Integrated Data Ledger Table - Flush Canvas */}
      <div className="mt-8 pt-4">
        {/* Flush Table Toolbar */}
        <div className="py-3 border-b border-outline/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Transaction ID, station, driver..."
                className="w-full bg-surface-container-high/60 border border-outline/30 rounded-xl h-10 pl-9 pr-3 text-base text-on-surface placeholder:text-on-surface-variant font-sans focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>

            {/* Location Dropdown Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high/60 border border-outline/30 rounded-xl text-sm font-sans text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-blue-400">location_on</span>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="bg-transparent text-sm text-on-surface focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-surface-container text-on-surface">All Locations</option>
                {availableSites.map((s) => (
                  <option key={s.id} value={s.id} className="bg-surface-container text-on-surface">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm text-on-surface-variant font-sans">
            Showing <strong className="text-on-surface font-bold">{filteredSessions.length}</strong> CDR records (click any row for deep-dive breakdown)
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse font-body text-sm">
            <thead>
              <tr className="border-b border-outline bg-surface-container-high text-xs font-sans text-on-surface-variant uppercase tracking-wider h-11">
                <th className="px-5 min-w-[140px] whitespace-nowrap">Session ID</th>
                <th className="px-4 min-w-[140px] whitespace-nowrap">Station ID</th>
                <th className="px-4 min-w-[170px] whitespace-nowrap">Driver / Tag / Plate</th>
                <th className="px-4 min-w-[160px] whitespace-nowrap">Start Time</th>
                <th className="px-4 min-w-[130px] text-right whitespace-nowrap">Energy Dispensed</th>
                <th className="px-4 min-w-[120px] text-right whitespace-nowrap">Total Amount</th>
                <th className="px-4 min-w-[120px] whitespace-nowrap">Status</th>
                <th className="px-5 min-w-[90px] text-center whitespace-nowrap">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline font-mono text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl animate-spin mb-2 block text-primary">sync</span>
                    Loading CDR records...
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-on-surface-variant">
                    No charging sessions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => {
                  const isCompleted = s.status === 'completed' || s.status === 'Stopped';

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSession(s)}
                      className="h-12 hover:bg-surface-container-high/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 font-bold text-on-surface whitespace-nowrap group-hover:text-primary transition-colors">
                        {s.id}
                      </td>
                      <td className="px-4 text-primary font-bold whitespace-nowrap truncate">{s.charge_point || s.charge_point_id || 'Unknown'}</td>
                      <td className="px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-surface-container-high border border-outline text-on-surface rounded font-medium text-sm">
                          {s.auth_id || s.driver_email || s.id_tag || 'Driver'}
                        </span>
                      </td>
                      <td className="px-4 text-on-surface-variant whitespace-nowrap">{formatTimestamp(s.start_time || s.created_at)}</td>
                      <td className="px-4 text-right font-bold text-on-surface whitespace-nowrap">{formatKwh(s.energy_kwh ?? s.kwh_delivered ?? 0)}</td>
                      <td className="px-4 text-right font-bold text-primary whitespace-nowrap">{formatCurrency(s.total_cost ?? s.amount_total ?? ((s.energy_kwh || 0) * 0.42))}</td>
                      <td className="px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 text-micro uppercase font-bold rounded-full border shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border-blue-500/30'
                          }`}
                        >
                          {s.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedSession(s)}
                          className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-blue-600/30 text-sm rounded-lg inline-block font-bold border border-blue-500/30 transition-colors cursor-pointer"
                        >
                          Deep Dive
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Audit & Itemized Billing Deep Dive Modal */}
      <SessionDetailModal
        session={selectedSession}
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
};

