import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSiteContext } from '@/context/SiteContext';
import { EmsMultiSourceBalanceChart } from '@/components/ems/EmsMultiSourceBalanceChart';
import { EmsSiteFlowSankey } from '@/components/ems/EmsSiteFlowSankey';
import { PeakShavingGuardrails } from '@/components/ems/PeakShavingGuardrails';
import { SmartChargingProfileDispatcher } from '@/components/ems/SmartChargingProfileDispatcher';
import { SiteStationThrottlingTable } from '@/components/ems/SiteStationThrottlingTable';

export const EmsPage: React.FC = () => {
  const { selectedSite } = useSiteContext();
  const [activeTab, setActiveTab] = useState<'balance' | 'sankey'>('balance');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const emsQueryUrl = selectedSite && selectedSite !== 'all' ? `/ems/live?site_id=${selectedSite}` : '/ems/live';

  const { data: emsLive } = useQuery({
    queryKey: ['ems', 'live', selectedSite],
    queryFn: () => api.get<any>(emsQueryUrl).catch(() => null),
    refetchInterval: 5000,
  });

  const gridKw = emsLive?.grid_kw ?? 0.0;
  const solarKw = emsLive?.solar_kw ?? 0.0;
  const chargerKw = emsLive?.charger_kw ?? 0.0;
  const buildingKw = emsLive?.building_kw ?? 0.0;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
            Energy Management System (EMS)
          </h1>
          <p className="text-sm text-on-surface-variant font-body mt-1">
            Real-time site energy balance, Autonomous Peak Shaving, and OCPP Smart Charging Profile dispatching.
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-1.5 material-card bg-surface-container/70 rounded-full border border-white/5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400 uppercase font-bold">
            {emsLive && (gridKw > 0 || solarKw > 0 || chargerKw > 0) ? 'Live Telemetry Active' : 'Zero Load / Standby'}
          </span>
        </div>
      </div>

      {/* 3 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-5 rounded-2xl">
          <span className="text-on-surface-variant uppercase tracking-wider block mb-1">Grid Import</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-headline font-bold text-on-surface tabular-nums">
              {gridKw.toFixed(1)}
            </span>
            <span className="text-sm text-on-surface-variant">kW</span>
          </div>
          <span className="text-[11px] text-on-surface-variant block mt-2">Grid Interconnection</span>
        </div>
        <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-5 rounded-2xl">
          <span className="text-amber-400 uppercase tracking-wider block mb-1">Solar PV Output</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-headline font-bold text-amber-400 tabular-nums">
              {solarKw.toFixed(1)}
            </span>
            <span className="text-sm text-on-surface-variant">kW</span>
          </div>
          <span className="text-[11px] text-on-surface-variant block mt-2">Clean Self-Gen</span>
        </div>
        <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-5 rounded-2xl">
          <span className="text-primary uppercase tracking-wider block mb-1">Total EV Load</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-headline font-bold text-primary tabular-nums">
              {chargerKw.toFixed(1)}
            </span>
            <span className="text-sm text-on-surface-variant">kW</span>
          </div>
          <span className="text-[11px] text-on-surface-variant block mt-2">Active Dispensing</span>
        </div>
      </div>

      {/* Full-Width Visual Telemetry: Multi-Source Power Curve & Flow Topology */}
      <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              {activeTab === 'balance' ? 'Site Power Balance Curve' : 'Site Energy Distribution Flow'}
            </h2>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              {activeTab === 'balance'
                ? 'Real-time multi-source generation and demand curves.'
                : 'Sankey topology tracking energy distribution across all endpoints.'}
            </p>
          </div>
          <div className="flex bg-surface-container-lowest/80 p-1 rounded-xl border border-white/5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('balance')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'balance' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Time Series
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sankey')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'sankey' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Flow Sankey
            </button>
          </div>
        </div>

        <div className="min-h-[300px] w-full">
          {activeTab === 'balance' ? (
            <EmsMultiSourceBalanceChart
              gridKw={gridKw}
              solarKw={solarKw}
              chargerKw={chargerKw}
              buildingKw={buildingKw}
            />
          ) : (
            <EmsSiteFlowSankey
              gridKw={gridKw}
              solarKw={solarKw}
              chargerKw={chargerKw}
              buildingKw={buildingKw}
            />
          )}
        </div>
      </div>

      {/* Autonomous Peak Shaving & Smart Charging Profile Command Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Autonomous Peak Shaving Guardrails */}
        <PeakShavingGuardrails onSuccessMessage={showToast} />

        {/* Panel 2: Direct Smart Charging Profile Dispatcher */}
        <SmartChargingProfileDispatcher onSuccessMessage={showToast} />
      </div>

      {/* Hardware Station Power Allocation & Curtailment Status Table */}
      <SiteStationThrottlingTable onStatusChange={showToast} />
    </div>
  );
};
