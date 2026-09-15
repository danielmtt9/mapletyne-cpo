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
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      textStyle: { color: '#f8fafc', fontFamily: 'monospace', fontSize: 11 },
      formatter: '{b}: ' + currSym + '{c} ({d}%)',
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 },
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
          borderColor: '#0f172a',
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
            color: '#f8fafc',
            formatter: '{b}\n' + currSym + '{c}',
          },
        },
        data: [
          { value: Number(energyRate.toFixed(3)), name: 'Energy (' + currSym + '/kWh)', itemStyle: { color: '#007AFF' } },
          { value: Number((timeRate * 60).toFixed(3)), name: 'Time (' + currSym + '/hr)', itemStyle: { color: '#06B6D4' } },
          { value: Number((idleRate * 60).toFixed(3)), name: 'Idle (' + currSym + '/hr)', itemStyle: { color: '#F59E0B' } },
          { value: Number(flatFee.toFixed(2)), name: 'Start Fee (' + currSym + ')', itemStyle: { color: '#10B981' } },
        ].filter(d => d.value > 0),
      },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="material-card bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[24px]">payments</span>
              <h2 className="font-headline text-xl font-bold text-slate-100">{tariff.name || tariff.id}</h2>
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-[11px] font-bold">
                {currSym}{energyRate.toFixed(3)} / kWh
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>ID: <strong className="text-slate-300">{tariff.id}</strong></span>
              <span>•</span>
              <span>Currency: <strong className="text-slate-300">{currency}</strong></span>
              <span>•</span>
              <span>Type: <strong className="text-emerald-400">OCPP / OCPI Dimensional</strong></span>
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
            onClick={() => setActiveTab('anatomy')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'anatomy'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Rate Anatomy & Dimensions
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'calculator'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Session Simulator
          </button>
          <button
            onClick={() => setActiveTab('scope')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'scope'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Scope & Applicability
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'anatomy' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Left: Dimension Breakdown Matrix */}
            <div className="space-y-2.5 font-mono text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-700/60 shadow-inner">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Base Energy Rate:
                </span>
                <span className={`font-bold tabular-nums ${energyRate > 0 ? 'text-slate-100' : 'text-slate-500'}`}>
                  {currSym}{energyRate.toFixed(3)} / kWh
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Time-Based Rate:
                </span>
                <span className={`font-bold tabular-nums ${timeRate > 0 ? 'text-cyan-300' : 'text-slate-500 font-normal'}`}>
                  {currSym}{timeRate.toFixed(3)} / min ({currSym}{(timeRate * 60).toFixed(2)}/hr)
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Idle Grace Penalty:
                </span>
                <span className={`font-bold tabular-nums ${idleRate > 0 ? 'text-amber-400' : 'text-slate-500 font-normal'}`}>
                  {currSym}{idleRate.toFixed(3)} / min ({currSym}{(idleRate * 60).toFixed(2)}/hr)
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Session Unlock Fee:
                </span>
                <span className={`font-bold tabular-nums ${flatFee > 0 ? 'text-emerald-400' : 'text-slate-500 font-normal'}`}>
                  {currSym}{flatFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 text-slate-300">
                <span>Baseline Cost Margin:</span>
                <span className="text-primary font-bold">
                  +{currSym}{Math.max(0, energyRate - costBasis).toFixed(3)} / kWh
                </span>
              </div>
            </div>

            {/* Right: Pie Chart Distribution */}
            <div className="h-48 w-full">
              <BaseEChart option={breakdownPieOption} />
            </div>
          </div>
        )}

        {activeTab === 'scope' && (
          <div className="space-y-3 font-mono text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-700/60 shadow-inner">
            <div className="text-slate-400 text-[11px] mb-2">
              Assigned charging assets, connector ratings, and customer access tiers:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Compatible Connectors</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">CCS2 DC (150-350kW)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">Type 2 AC (22kW)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">CHAdeMO (50kW)</span>
                </div>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Eligible User Groups</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">Standard Public</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">OCPI eMSP Roaming</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">Fleet RFID Subscribed</span>
                </div>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-slate-400 text-[11px] border-t border-white/5">
              <span>OCPI 2.2.1 Tariff ID:</span>
              <span className="text-slate-200 font-bold">{tariff.id}</span>
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Energy Dispensed (kWh)</label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={simKwh}
                  onChange={(e) => setSimKwh(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl h-9 px-3 text-slate-100 text-xs font-bold focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Session Duration (min)</label>
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={simMinutes}
                  onChange={(e) => setSimMinutes(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl h-9 px-3 text-slate-100 text-xs font-bold focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Idle Time Post-Charge (min)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={simIdleMinutes}
                  onChange={(e) => setSimIdleMinutes(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl h-9 px-3 text-slate-100 text-xs font-bold focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-700/80 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shadow-inner">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Energy Subtotal</span>
                <span className="text-sm font-bold text-slate-100">{currSym}{energyCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Time + Idle Fee</span>
                <span className="text-sm font-bold text-amber-400">{currSym}{(timeCost + idleCost).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Total Driver Bill</span>
                <span className="text-base font-bold text-primary">{currSym}{totalCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">CPO Gross Spread</span>
                <span className="text-sm font-bold text-emerald-400">+{currSym}{cpoGrossProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 font-mono text-xs">
          <div className="text-slate-400 text-[11px]">
            Effective Rate: <span className="text-slate-100 font-bold">{currSym}{effectivePerKwh.toFixed(3)}/kWh</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
            >
              Close
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(tariff);
                }}
                className="px-4 py-2 bg-primary text-slate-950 font-bold rounded-xl hover:brightness-110 transition-all flex items-center gap-1.5 shadow-apple-sm"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Edit Model
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
