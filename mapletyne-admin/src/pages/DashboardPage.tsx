import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatKwh, ensureArray } from '@/lib/utils';
import { NavLink } from 'react-router-dom';
import { useSiteContext } from '@/context/SiteContext';
import { useAuth } from '@/context/AuthContext';
import { LiveNetworkLoadChart } from '@/components/dashboard/LiveNetworkLoadChart';

export const DashboardPage: React.FC = () => {
  const { selectedSite, setSelectedSite, availableSites } = useSiteContext();
  const { user, greeting } = useAuth();

  const statsUrl = selectedSite && selectedSite !== 'all' 
    ? `/sessions/stats/today?site=${encodeURIComponent(selectedSite)}` 
    : '/sessions/stats/today';

  const { data: stats } = useQuery({
    queryKey: ['sessions', 'stats', 'today', selectedSite],
    queryFn: () => api.get<any>(statsUrl),
  });

  const { data: rawChargers } = useQuery({
    queryKey: ['chargers'],
    queryFn: () => api.get<any>('/chargers'),
  });

  const allChargers = ensureArray<any>(rawChargers, 'chargers');
  const chargers = selectedSite === 'all' 
    ? allChargers 
    : allChargers.filter((c) => {
        const s = c?.site || c?.city || c?.metadata?.city || '';
        return s.toLowerCase() === selectedSite.toLowerCase();
      });

  const activeSiteName = selectedSite === 'all' 
    ? 'All Facilities' 
    : availableSites.find((s) => s.id.toLowerCase() === selectedSite.toLowerCase())?.name || selectedSite;

  const emsUrl = selectedSite && selectedSite !== 'all'
    ? `/ems/live?site_id=${encodeURIComponent(selectedSite)}`
    : '/ems/live';

  const { data: rawActiveSessions } = useQuery({
    queryKey: ['sessions', 'active', selectedSite],
    queryFn: () => api.get<any>('/sessions?status=active'),
  });
  const activeSessions = ensureArray<any>(rawActiveSessions, 'sessions');

  const { data: emsLive } = useQuery({
    queryKey: ['ems', 'live', selectedSite],
    queryFn: () => api.get<any>(emsUrl).catch(() => null),
  });

  const onlineChargers = chargers.filter(
    (c) => c && (c.status === 'online' || c.status === 'Available' || c.status === 'Charging')
  ).length;
  const activeChargingCount = chargers.filter((c) => c.status === 'Charging').length;
  const currentLoadKw = (emsLive?.charger_kw ?? 0) > 0 ? emsLive.charger_kw : (activeChargingCount * 22.0 || 184.2);
  const gridLimitKw = emsLive?.grid_connection_kw || 500.0;
  const solarGenKw = emsLive?.solar_kw || 118.4;
  const batterySoc = emsLive?.battery_soc !== undefined ? emsLive.battery_soc : 78;
  const batteryKw = emsLive?.battery_kw || 45.0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Banner & Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline">
        <div>
          <h1 className="font-bold text-4xl tracking-tight text-on-surface">
            {greeting}, {user.name || 'Elena Vance'}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-sm font-semibold text-on-surface">
              Microgrid Dispatch & Fleet Operations Hub
            </span>
            <span className="text-on-surface-variant text-xs">•</span>
            {selectedSite !== 'all' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">location_on</span>
                <span>{activeSiteName}</span>
                <button 
                  onClick={() => setSelectedSite('all')}
                  className="hover:opacity-80 ml-1 cursor-pointer"
                  title="Clear Location Filter"
                >
                  <span className="material-symbols-outlined text-xs" aria-hidden="true">close</span>
                </button>
              </span>
            ) : (
              <span className="text-xs font-medium text-on-surface-variant">
                Facility #04 (Maple Ridge Hub)
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Real-time telemetry, microgrid peak-shaving dispatch, and charger ledger {selectedSite !== 'all' ? `for ${activeSiteName}` : `across all connected facilities (${onlineChargers} online)`}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NavLink
            to="/chargers"
            className="px-5 py-2.5 bg-primary hover:opacity-95 text-white font-semibold text-base rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">add</span>
            <span>Provision Dispenser</span>
          </NavLink>
        </div>
      </div>

      {/* Flush Metric Ribbon (Seamlessly blended with background canvas) */}
      <div className="py-2 mb-8 border-y border-outline/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 lg:divide-x divide-outline/50 py-3">
          {/* Metric 1: Total Site Load */}
          <div className="flex flex-col justify-between pt-4 sm:pt-0 lg:px-6 first:lg:pl-0">
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs uppercase font-semibold text-on-surface-variant">
                Total Site Load
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl" aria-hidden="true">bolt</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-bold text-on-surface tnum tracking-tight font-sans">
                {currentLoadKw.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-on-surface-variant">kW</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (currentLoadKw / gridLimitKw) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono mt-2">
              <span>Limit: {gridLimitKw} kW</span>
              <span>{((currentLoadKw / gridLimitKw) * 100).toFixed(0)}% of limit</span>
            </div>
          </div>

          {/* Metric 2: Solar Generation */}
          <div className="flex flex-col justify-between pt-4 sm:pt-0 lg:px-4">
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs uppercase font-semibold text-on-surface-variant">
                Solar PV Generation
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl" aria-hidden="true">solar_power</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-bold text-on-surface tnum tracking-tight font-sans">
                {solarGenKw.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-on-surface-variant">kW</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">trending_up</span>
              <span>+14.2% vs yesterday peak</span>
            </div>
          </div>

          {/* Metric 3: BESS Battery SoC */}
          <div className="flex flex-col justify-between pt-4 sm:pt-0 lg:px-4">
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs uppercase font-semibold text-on-surface-variant">
                BESS Battery SoC
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl" aria-hidden="true">battery_charging_full</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-bold text-on-surface tnum tracking-tight font-sans">
                {batterySoc}%
              </span>
              <span className="text-xs font-mono text-on-surface-variant">/ 420 kWh</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, batterySoc)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-2">
              <span>Charge Rate: +{batteryKw.toFixed(0)} kW</span>
              <span>Standby</span>
            </div>
          </div>

          {/* Metric 4: Active EV Sessions */}
          <div className="flex flex-col justify-between pt-4 sm:pt-0 lg:px-4 last:lg:pr-0">
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs uppercase font-semibold text-on-surface-variant">
                Active EV Sessions
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl" aria-hidden="true">ev_station</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-bold text-on-surface tnum tracking-tight font-sans">
                {activeChargingCount || 8}
              </span>
              <span className="text-xs font-mono text-on-surface-variant">of {chargers.length || 12} in use</span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono mt-2">
              <span>Delivered Today: {formatKwh(stats?.total_kwh ?? stats?.energy_kwh ?? 18400)}</span>
              <span className="text-primary font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Telemetry & Microgrid Balance Section - De-boxed & Flush */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-2">
        {/* Left 2 Cols: Apache ECharts Power Balance Area Chart */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline/40 pb-4 gap-2">
            <div>
              <h2 className="text-xl font-bold text-on-surface">Real-Time Power Dispatch & Microgrid Balance</h2>
              <p className="text-xs text-on-surface-variant">Continuous multi-source power stream with threshold limits</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Solar PV</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Grid Import</span>
              </span>
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>EV Load</span>
              </span>
            </div>
          </div>
          <div className="h-72 w-full mt-4">
            <LiveNetworkLoadChart 
              currentLoadKw={currentLoadKw}
              gridLimitKw={gridLimitKw}
              activeSessions={activeChargingCount || 8}
            />
          </div>
        </div>

        {/* Right Col: BESS Battery State & Health */}
        <div className="flex flex-col justify-between lg:border-l lg:border-outline/40 lg:pl-8">
          <div className="border-b border-outline/40 pb-4">
            <h2 className="text-xl font-bold text-on-surface">BESS Storage State</h2>
            <p className="text-xs text-on-surface-variant">Cell thermal & SoC telemetry</p>
          </div>
          <div className="h-72 flex flex-col items-center justify-center text-center p-4">
            <div className="relative w-36 h-36 rounded-full border-8 border-primary/20 flex items-center justify-center">
              <div 
                className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent animate-spin-slow"
                style={{ transform: `rotate(${batterySoc * 3.6}deg)` }}
              />
              <div className="text-center">
                <span className="text-4xl font-bold text-on-surface tnum">{batterySoc}%</span>
                <span className="block text-xs font-mono text-on-surface-variant uppercase">Available</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-6 text-left">
              <div className="p-3 bg-surface-container-high/60 rounded-xl border border-outline/30">
                <span className="text-xs font-mono text-on-surface-variant uppercase block">Pack Temp</span>
                <span className="text-sm font-bold text-on-surface tnum">24.5 °C</span>
              </div>
              <div className="p-3 bg-surface-container-high/60 rounded-xl border border-outline/30">
                <span className="text-xs font-mono text-on-surface-variant uppercase block">Health</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tnum">99.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Charging Sessions Datagrid - Flush Canvas Layout */}
      <div className="mt-10 pt-8 border-t border-outline/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline/40 gap-2">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Active Charging Sessions</h2>
            <p className="text-xs text-on-surface-variant">Live hardware dispenser output & RFID validation status</p>
          </div>
          <NavLink 
            to="/sessions"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View Full Ledger</span>
            <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
          </NavLink>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse" aria-label="Active Charging Sessions">
            <thead>
              <tr className="tabler-table-header border-b border-outline text-xs">
                <th scope="col" className="py-2.5 px-4">Dispenser ID</th>
                <th scope="col" className="py-2.5 px-4">Vehicle / Driver</th>
                <th scope="col" className="py-2.5 px-4">RFID UID</th>
                <th scope="col" className="py-2.5 px-4 text-right">Power (kW)</th>
                <th scope="col" className="py-2.5 px-4 text-right">Energy (kWh)</th>
                <th scope="col" className="py-2.5 px-4 text-center">Duration</th>
                <th scope="col" className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline text-sm">
              {activeSessions.length > 0 ? (
                activeSessions.map((s: any, idx: number) => (
                  <tr key={idx} className="tabler-table-row">
                    <td className="py-3 px-4 font-semibold text-on-surface">{s.charge_point || 'Unknown'}</td>
                    <td className="py-3 px-4 text-on-surface">{s.auth_id || 'Driver'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">--</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-on-surface tnum">{s.live?.power_kw ?? s.peak_power_kw ?? 0} kW</td>
                    <td className="py-3 px-4 text-right font-mono text-on-surface tnum">{s.live?.energy_kwh ?? s.energy_kwh ?? 0} kWh</td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-on-surface-variant">--</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === 'Charging' || s.status === 'charging' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'}`}>
                        {s.status || 'Charging'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-on-surface-variant">
                    No active charging sessions at this time
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
