import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

export interface TariffSpotCurveChartProps {
  baseSpot?: number;
  markupPct?: number;
  fixedMargin?: number;
  peakSurge?: number;
}

export const TariffSpotCurveChart: React.FC<TariffSpotCurveChartProps> = ({
  baseSpot = 0.192,
  markupPct = 18,
  fixedMargin = 0.09,
  peakSurge = 0.06,
}) => {
  const hourlyFactors = [
    0.65, 0.58, 0.52, 0.50, 0.55, 0.72, 0.95, 1.15,
    1.22, 1.10, 0.98, 0.92, 0.88, 0.85, 0.90, 1.05,
    1.25, 1.45, 1.50, 1.40, 1.20, 1.02, 0.85, 0.70
  ];

  const chartOption = useMemo<EChartsOption>(() => {
    const hours = hourlyFactors.map((_, idx) => `${idx.toString().padStart(2, '0')}:00`);
    const wholesaleData = hourlyFactors.map((f) => Number((baseSpot * f).toFixed(3)));
    const retailData = hourlyFactors.map((f, idx) => {
      const wholesale = baseSpot * f;
      const isPeak = idx >= 17 && idx <= 21;
      return Number((wholesale * (1 + markupPct / 100) + fixedMargin + (isPeak ? peakSurge : 0)).toFixed(3));
    });

    const maxRate = Math.max(0.6, Math.ceil(Math.max(...retailData, 0.4) * 1.2 * 10) / 10);

    return {
      backgroundColor: 'transparent',
      animation: true,
      legend: {
        data: ['Wholesale Spot (ENTSO-E)', 'Dynamic Retail Rate'],
        top: 0,
        right: 10,
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 11,
        },
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: {
        top: 36,
        right: 16,
        bottom: 30,
        left: 48,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: {
          color: '#f8fafc',
          fontFamily: 'monospace',
          fontSize: 11,
        },
        extraCssText: 'backdrop-filter: blur(16px); box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.5); border-radius: 12px;',
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const hour = params[0].axisValue;
          const wholesale = params.find((p: any) => p.seriesName.includes('Wholesale'))?.value ?? 0;
          const retail = params.find((p: any) => p.seriesName.includes('Retail'))?.value ?? 0;
          const margin = (retail - wholesale).toFixed(3);
          return `
            <div class="font-bold font-mono border-b border-white/10 pb-1 mb-1 text-xs text-slate-400">${hour}</div>
            <div class="flex items-center justify-between gap-4 text-xs font-mono">
              <span class="text-slate-400">Wholesale Spot:</span>
              <span class="font-bold text-white">£${wholesale}/kWh</span>
            </div>
            <div class="flex items-center justify-between gap-4 text-xs my-0.5 font-mono">
              <span class="text-blue-400">Dynamic Retail:</span>
              <span class="font-bold text-blue-400">£${retail}/kWh</span>
            </div>
            <div class="flex items-center justify-between gap-4 text-xs font-bold font-mono text-emerald-400 border-t border-white/10 pt-1 mt-1">
              <span>CPO Margin Spread:</span>
              <span>+£${margin}/kWh</span>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hours,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontFamily: 'monospace',
          fontSize: 10,
          interval: 2,
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: maxRate,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } },
        axisLabel: {
          color: '#64748b',
          fontFamily: 'monospace',
          fontSize: 10,
          formatter: '£{value}',
        },
      },
      series: [
        {
          name: 'Wholesale Spot (ENTSO-E)',
          type: 'line',
          smooth: 0.3,
          showSymbol: false,
          lineStyle: { color: '#64748b', width: 2, type: 'dashed' },
          data: wholesaleData,
        },
        {
          name: 'Dynamic Retail Rate',
          type: 'line',
          smooth: 0.25,
          showSymbol: false,
          lineStyle: {
            color: '#007AFF',
            width: 3,
            shadowColor: 'rgba(0, 122, 255, 0.6)',
            shadowBlur: 10,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 122, 255, 0.35)' },
              { offset: 0.8, color: 'rgba(16, 185, 129, 0.10)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.0)' },
            ]),
          },
          markArea: {
            itemStyle: {
              color: 'rgba(239, 68, 68, 0.12)',
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.25)',
              borderType: 'dashed',
            },
            label: {
              color: '#f87171',
              fontFamily: 'monospace',
              fontSize: 10,
              position: 'insideTop',
            },
            data: [
              [
                { name: 'Peak Surge (17-21h)', xAxis: '17:00' },
                { xAxis: '21:00' },
              ],
            ],
          },
          data: retailData,
        },
      ],
    };
  }, [baseSpot, markupPct, fixedMargin, peakSurge]);

  return (
    <div className="w-full h-52">
      <BaseEChart option={chartOption} />
    </div>
  );
};
