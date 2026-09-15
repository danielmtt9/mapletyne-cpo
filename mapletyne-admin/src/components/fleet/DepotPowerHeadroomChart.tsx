import React from 'react';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

interface DepotPowerHeadroomChartProps {
  gridLimitKw: number;
  effectiveLimitKw: number;
  activeChargingKw: number;
  headroomKw: number;
  emsMode: string;
}

export const DepotPowerHeadroomChart: React.FC<DepotPowerHeadroomChartProps> = ({
  gridLimitKw,
  effectiveLimitKw,
  activeChargingKw,
  headroomKw,
  emsMode,
}) => {
  const isOverride = emsMode === 'EXTERNAL_OVERRIDE';

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#F8FAFC', fontSize: 12, fontFamily: 'monospace' },
      extraCssText: 'backdrop-filter: blur(16px); box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.5); border-radius: 12px;',
    },
    legend: {
      data: ['Active Charging Load', 'Available Headroom', 'Site Power Ceiling'],
      top: 0,
      textStyle: { color: '#94A3B8', fontSize: 11, fontFamily: 'monospace' },
    },
    grid: {
      top: 36,
      left: 10,
      right: 15,
      bottom: 10,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['Current Depot Load'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94A3B8', fontSize: 11, fontFamily: 'monospace' },
    },
    yAxis: {
      type: 'value',
      name: 'Power (kW)',
      max: Math.max(gridLimitKw, effectiveLimitKw) * 1.15,
      splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } },
      axisLabel: { color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
      nameTextStyle: { color: '#64748B', fontSize: 10, fontFamily: 'monospace' },
    },
    series: [
      {
        name: 'Active Charging Load',
        type: 'bar',
        stack: 'total',
        data: [activeChargingKw],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#007AFF' },
              { offset: 1, color: '#0051A8' },
            ],
          },
          borderRadius: [0, 0, 4, 4],
        },
        label: {
          show: activeChargingKw > 0,
          position: 'inside',
          formatter: '{c} kW',
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 'bold',
          fontFamily: 'monospace',
        },
      },
      {
        name: 'Available Headroom',
        type: 'bar',
        stack: 'total',
        data: [headroomKw],
        itemStyle: {
          color: 'rgba(16, 185, 129, 0.20)',
          borderColor: '#10B981',
          borderWidth: 1.5,
          borderType: 'dashed',
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          formatter: `Headroom: ${headroomKw.toFixed(1)} kW`,
          color: '#10B981',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'monospace',
        },
      },
      {
        name: 'Site Power Ceiling',
        type: 'line',
        data: [effectiveLimitKw],
        markLine: {
          symbol: 'none',
          data: [
            {
              yAxis: effectiveLimitKw,
              lineStyle: {
                color: isOverride ? '#EF4444' : '#F59E0B',
                width: 2,
                type: isOverride ? 'solid' : 'dashed',
              },
              label: {
                position: 'end',
                formatter: isOverride ? `SCADA Override: ${effectiveLimitKw} kW` : `Grid Cap: ${gridLimitKw} kW`,
                color: isOverride ? '#EF4444' : '#F59E0B',
                fontSize: 11,
                fontWeight: 'bold',
                fontFamily: 'monospace',
              },
            },
          ],
        },
      },
    ],
  };

  return (
    <div className="h-[240px] w-full bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col shadow-inner">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <span className="material-symbols-outlined text-primary text-[16px]">speed</span> Depot Power Stack & Headroom
        </span>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-lg font-mono font-semibold ${
            isOverride
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}
        >
          {isOverride ? `EXTERNAL SCADA OVERRIDE (${effectiveLimitKw} kW)` : 'EMS AUTO OPTIMIZED'}
        </span>
      </div>
      <div className="flex-1 w-full min-h-0">
        <BaseEChart option={option} />
      </div>
    </div>
  );
};
