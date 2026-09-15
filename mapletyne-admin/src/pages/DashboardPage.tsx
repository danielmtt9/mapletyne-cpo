import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { formatKwh, formatCurrency, ensureArray } from '@/lib/utils';
import { NavLink } from 'react-router-dom';
import { useSiteContext } from '@/context/SiteContext';
import { useAuth } from '@/context/AuthContext';
import { LiveNetworkLoadChart } from '@/components/dashboard/LiveNetworkLoadChart';
import { AppleActivityRings } from '@/components/dashboard/AppleActivityRings';
import { 
  Zap, 
  Activity, 
  Coins, 
  ShieldCheck, 
  Plus, 
  MapPin,
  X,
  ArrowUpRight
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { selectedSite, setSelectedSite, availableSites } = useSiteContext();
  const { user, greeting } = useAuth();

  const statsUrl = selectedSite && selectedSite !== 'all' 
    ? `/sessions/stats/today?site=${encodeURIComponent(selectedSite)}` 
    : '/sessions/stats/today';

  const { data: stats } = useQuery({
    queryKey: ['sessions', 'stats', 'today', selectedSite],
    queryFn: () => api.get<any>(statsUrl),
    refetchInterval: 10000,
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
    ? 'All Locations' 
    : availableSites.find((s) => s.id.toLowerCase() === selectedSite.toLowerCase())?.name || selectedSite;

  const emsUrl = selectedSite && selectedSite !== 'all'
    ? `/ems/live?site_id=${encodeURIComponent(selectedSite)}`
    : '/ems/live';

  const { data: emsLive } = useQuery({
    queryKey: ['ems', 'live', selectedSite],
    queryFn: () => api.get<any>(emsUrl).catch(() => null),
  });

  const onlineChargers = chargers.filter(
    (c) => c && (c.status === 'online' || c.status === 'Available' || c.status === 'Charging')
  ).length;
  const activeChargingCount = chargers.filter((c) => c.status === 'Charging').length;
  const healthPercent = chargers.length > 0 ? (onlineChargers / chargers.length) * 100 : 100.0;
  const occupancyPercent = chargers.length > 0 ? (activeChargingCount / chargers.length) * 100 : 0;
  const currentLoadKw = (emsLive?.charger_kw ?? 0) > 0 ? emsLive.charger_kw : activeChargingCount * 22.0;
  const gridLimitKw = emsLive?.grid_connection_kw || 250.0;
  const powerPercent = gridLimitKw > 0 ? (currentLoadKw / gridLimitKw) * 100 : 0;
  const headroomPercent = Math.max(0, 100 - powerPercent);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Banner & Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-[24pt] sm:text-4xl font-extrabold tracking-tight text-white">
            {greeting}, {user.name}
          </h1>
          <div className="flex items-center gap-2.5 mt-1">
            <span className="text-sm font-semibold text-slate-300">
              Charge Station Management System
            </span>
            {selectedSite !== 'all' && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <MapPin className="w-3 h-3" />
                <span>{activeSiteName}</span>
                <button 
                  onClick={() => setSelectedSite('all')}
                  className="hover:text-white ml-0.5 cursor-pointer"
                  title="Clear Location Filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, capacity management, and operational analytics {selectedSite !== 'all' ? `for ${activeSiteName}` : 'across all facilities'}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NavLink
            to="/chargers"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-apple-sm hover:shadow-apple-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provision Charger</span>
          </NavLink>
        </div>
      </div>

      {/* 4 Primary Apple HIG KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Energy */}
        <div className="material-card p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Today's Energy
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-white tabular-nums tracking-tight font-sans">
              {formatKwh(stats?.total_kwh ?? stats?.energy_kwh ?? 0).replace(' kWh', '')}
            </span>
            <span className="text-xs font-mono text-slate-400">kWh</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-time Telemetry Active</span>
          </div>
        </div>

        {/* Card 2: Active Sessions */}
        <div className="material-card p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Active Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-white tabular-nums tracking-tight font-sans">
              {activeChargingCount}
            </span>
            <span className="text-xs font-mono text-slate-400">dispensing power</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, occupancyPercent)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Today's Revenue */}
        <div className="material-card p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Today's Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-white tabular-nums tracking-tight font-sans">
              {formatCurrency(stats?.total_revenue ?? stats?.revenue ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2">
            <span>Avg {stats?.total_sessions ? formatCurrency((stats.total_revenue || 0) / stats.total_sessions) : '£0.00'}/session</span>
            <span className="text-emerald-400 flex items-center gap-0.5 shrink-0">
              <span>Settled</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Network Health */}
        <div className="material-card p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Fleet Health
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-white tabular-nums tracking-tight font-sans">
              {healthPercent.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-slate-400">online</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-2">
            <span>{onlineChargers} of {chargers.length} online</span>
          </div>
        </div>
      </div>

      {/* Main Visualizations Row: ECharts Telemetry + Apple Activity Rings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Telemetry Bezier Area Chart */}
        <div className="lg:col-span-2 material-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Live Site Telemetry</h2>
              <p className="text-xs text-slate-400 font-mono">24h Continuous Power Stream</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>EV Load (kW)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Capacity Ceiling</span>
              </span>
            </div>
          </div>
          <div className="h-64 w-full mt-4">
            <LiveNetworkLoadChart 
              currentLoadKw={currentLoadKw}
              gridLimitKw={gridLimitKw}
              activeSessions={activeChargingCount}
            />
          </div>
        </div>

        {/* Right Col: Apple Activity Rings */}
        <div className="material-card p-5 flex flex-col justify-between">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-sm font-semibold text-white">Site Utilization</h2>
            <p className="text-xs text-slate-400 font-mono">Power Headroom & Port Saturation</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            <AppleActivityRings
              powerPct={powerPercent}
              occupancyPct={occupancyPercent}
              headroomPct={headroomPercent}
              currentLoadKw={currentLoadKw}
              onlineCount={onlineChargers}
              totalCount={chargers.length}
            />
          </div>
        </div>
      </div>

      {/* Charger Status Live Ticker Grid */}
      <div className="material-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Charging Station Fleet Status</h2>
            <p className="text-xs text-slate-400 font-mono">Hardware health and connector status</p>
          </div>
          <NavLink 
            to="/chargers"
            className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 shrink-0"
          >
            <span>View All ({chargers.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {chargers.slice(0, 8).map((charger) => {
            const isOnline = charger.status === 'online' || charger.status === 'Available' || charger.status === 'Charging';
            const isCharging = charger.status === 'Charging';

            return (
              <div
                key={charger.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3 min-w-0 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isCharging ? 'bg-blue-500/15 text-blue-400' : isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-white block truncate">
                      {charger.id}
                    </span>
                    <span className="text-xs font-mono text-slate-400 block truncate">
                      {charger.model || charger.vendor || 'Standard EVSE'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    isCharging 
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' 
                      : isOnline 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-800 text-slate-400 border border-white/5'
                  }`}>
                    {charger.status || 'Offline'}
                  </span>
                  {charger.power_kw !== undefined && (
                    <span className="text-xs font-mono font-semibold text-slate-300 tabular-nums">
                      {charger.power_kw.toFixed(1)} kW
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
