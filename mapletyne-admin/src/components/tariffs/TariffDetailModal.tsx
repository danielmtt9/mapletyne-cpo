import React, { useState } from 'react';
import type { TariffItem } from './TariffBreakdownChart';
import { BaseEChart } from '@/components/common/BaseEChart';
import type { EChartsOption } from 'echarts';

interface TariffDetailModalProps {
  tariff: TariffItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (tariff: TariffItem) => void;
  costBasis?: number;
}

export const TariffDetailModal: React.FC<TariffDetailModalProps> = ({
  tariff,
  isOpen,
  onClose,
  onEdit,
  costBasis = 0.220,
}) => {
  const [activeTab, setActiveTab] = useState<'anatomy' | 'calculator' | 'scope'>('anatomy');
  const [simKwh, setSimKwh] = useState(30);
  const [simMinutes, setSimMinutes] = useState(45);
  const [simIdleMinutes, setSimIdleMinutes] = useState(10);

  if (!isOpen || !tariff) return null;

  const energyRate = tariff.energy_rate ?? 0;
  const timeRate = tariff.time_rate ?? 0;
  const idleRate = tariff.idle_rate ?? 0;
  const flatFee = tariff.flat_fee ?? 0;
  const currency = tariff.currency || 'GBP';
  const currSym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';

  // Calculator computations
  const energyCost = simKwh * energyRate;
  const timeCost = simMinutes * timeRate;
  const idleCost = simIdleMinutes * idleRate;
  const totalCost = energyCost + timeCost + idleCost + flatFee;
  const effectivePerKwh = simKwh > 0 ? totalCost / simKwh : 0;
  const cpoGrossProfit = simKwh > 0 ? totalCost - simKwh * costBasis : 0;

  // Single Tariff Dimension Pie / Bar Chart Option
  const breakdownPieOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      padding: [8, 12],
      formatter: '{b}: ' + currSym + '{c} ({d}%)',
    },
    legend: {
      bottom: 0,
      textStyle: { fontFamily: 'monospace', fontSize: 12 },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        name: 'Dimension Share',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 'bold',
            formatter: '{b}\n' + currSym + '{c}',
          },
        },
        data: [
          { value: Number(energyRate.toFixed(3)), name: 'Energy (' + currSym + '/kWh)', itemStyle: { color: '#0284c7' } },
          { value: Number((timeRate * 60).toFixed(3)), name: 'Time (' + currSym + '/hr)', itemStyle: { color: '#06b6d4' } },
          { value: Number((idleRate * 60).toFixed(3)), name: 'Idle (' + currSym + '/hr)', itemStyle: { color: '#f59e0b' } },
          { value: Number(flatFee.toFixed(2)), name: 'Start Fee (' + currSym + ')', itemStyle: { color: '#10b981' } },
        ].filter(d => d.value > 0),
      },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in duration-150">
      <div className="tabler-card bg-surface-container border border-outline rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 font-body">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[24px]">payments</span>
              <h2 className="font-headline text-xl font-bold text-on-surface">{tariff.name || tariff.id}</h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-xs font-bold">
                {currSym}{energyRate.toFixed(3)} / kWh
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm font-mono text-on-surface-variant">
              <span>ID: <strong className="text-on-surface">{tariff.id}</strong></span>
              <span>•</span>
              <span>Currency: <strong className="text-on-surface">{currency}</strong></span>
              <span>•</span>
              <span>Type: <strong className="text-emerald-600 dark:text-emerald-400">OCPP / OCPI Dimensional</strong></span>
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
            onClick={() => setActiveTab('anatomy')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'anatomy'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Rate Anatomy & Dimensions
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Session Simulator
          </button>
          <button
            onClick={() => setActiveTab('scope')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'scope'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Scope & Applicability
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'anatomy' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Left: Dimension Breakdown Matrix */}
            <div className="space-y-2.5 font-sans text-sm bg-surface-container-high p-4 rounded-xl border border-outline shadow-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-outline">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  Base Energy Rate:
                </span>
                <span className={`font-bold tabular-nums font-mono ${energyRate > 0 ? 'text-on-surface' : 'text-on-surface-variant font-normal'}`}>
                  {currSym}{energyRate.toFixed(3)} / kWh
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-outline">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                  Time-Based Rate:
                </span>
                <span className={`font-bold tabular-nums font-mono ${timeRate > 0 ? 'text-blue-600 dark:text-cyan-400' : 'text-on-surface-variant font-normal'}`}>
                  {currSym}{timeRate.toFixed(3)} / min ({currSym}{(timeRate * 60).toFixed(2)}/hr)
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-outline">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  Idle Grace Penalty:
                </span>
                <span className={`font-bold tabular-nums font-mono ${idleRate > 0 ? 'text-amber-500' : 'text-on-surface-variant font-normal'}`}>
                  {currSym}{idleRate.toFixed(3)} / min ({currSym}{(idleRate * 60).toFixed(2)}/hr)
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-outline">
                <span className="text-on-surface-variant flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  Session Unlock Fee:
                </span>
                <span className={`font-bold tabular-nums font-mono ${flatFee > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-on-surface-variant font-normal'}`}>
                  {currSym}{flatFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 text-on-surface font-medium">
                <span>Baseline Cost Margin:</span>
                <span className="text-primary font-bold font-mono">
                  +{currSym}{Math.max(0, energyRate - costBasis).toFixed(3)} / kWh
                </span>
              </div>
            </div>

            {/* Right: Pie Chart Distribution */}
            <div className="h-52 w-full">
              <BaseEChart option={breakdownPieOption} />
            </div>
          </div>
        )}

        {activeTab === 'scope' && (
          <div className="space-y-4 font-sans text-sm bg-surface-container-high p-5 rounded-xl border border-outline shadow-xs">
            <div className="text-on-surface-variant text-sm font-medium mb-1">
              Assigned charging assets, connector ratings, and customer access tiers:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-surface-container p-4 rounded-xl border border-outline space-y-2">
                <span className="text-xs text-on-surface-variant uppercase tracking-wider block font-bold">Compatible Connectors</span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">CCS2 DC (150-350kW)</span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">Type 2 AC (22kW)</span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">CHAdeMO (50kW)</span>
                </div>
              </div>
              <div className="bg-surface-container p-4 rounded-xl border border-outline space-y-2">
                <span className="text-xs text-on-surface-variant uppercase tracking-wider block font-bold">Eligible User Groups</span>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">Standard Public</span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">OCPI eMSP Roaming</span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold">Fleet RFID Subscribed</span>
                </div>
              </div>
            </div>
            <div className="pt-3 flex items-center justify-between text-on-surface-variant text-sm border-t border-outline">
              <span>OCPI 2.2.1 Tariff ID:</span>
              <span className="text-on-surface font-bold font-mono">{tariff.id}</span>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1.5">Energy Dispensed (kWh)</label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={simKwh}
                  onChange={(e) => setSimKwh(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3 text-on-surface text-base font-bold focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1.5">Session Duration (min)</label>
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={simMinutes}
                  onChange={(e) => setSimMinutes(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3 text-on-surface text-base font-bold focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="block text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1.5">Idle Time Post-Charge (min)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={simIdleMinutes}
                  onChange={(e) => setSimIdleMinutes(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-3 text-on-surface text-base font-bold focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none"
                />
              </div>
            </div>

            <div className="bg-surface-container-high border border-outline rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shadow-xs">
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">Energy Subtotal</span>
                <span className="text-base font-bold text-on-surface font-mono">{currSym}{energyCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">Time + Idle Fee</span>
                <span className="text-base font-bold text-amber-500 font-mono">{currSym}{(timeCost + idleCost).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">Total Driver Bill</span>
                <span className="text-base font-bold text-primary font-mono">{currSym}{totalCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">CPO Gross Spread</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">+{currSym}{cpoGrossProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-outline font-sans text-sm">
          <div className="text-on-surface-variant">
            Effective Rate: <span className="text-on-surface font-bold font-mono">{currSym}{effectivePerKwh.toFixed(3)}/kWh</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline rounded-xl text-on-surface font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(tariff);
                }}
                className="px-5 py-2 bg-primary text-on-primary font-headline font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit Model
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
