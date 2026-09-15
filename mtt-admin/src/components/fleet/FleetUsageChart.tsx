import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

export interface GroupUsageItem {
  id: string;
  name: string;
  month_kwh?: number;
  month_cost?: number;
  token_count?: number;
  active_count?: number;
}

interface FleetUsageChartProps {
  groups: GroupUsageItem[];
}

export const FleetUsageChart: React.FC<FleetUsageChartProps> = ({ groups }) => {
  const chartOption = useMemo<EChartsOption>(() => {
    if (!groups || groups.length === 0) {
      return {
        title: {
          text: 'No Fleet Groups Configured',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#64748b', fontSize: 12, fontFamily: 'monospace' },
        },
      };
    }

    const categories = groups.map((g) => g.name);
    const kwhData = groups.map((g) => Number((g.month_kwh ?? 0).toFixed(1)));
    const tokenCounts = groups.map((g) => g.token_count ?? 0);

    return {
      backgroundColor: 'transparent',
      animation: true,
      legend: {
        data: ['Monthly Energy (kWh)', 'Assigned Tokens'],
        top: 0,
        right: 10,
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 10,
        },
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: {
        top: 36,
        right: 48,
        bottom: 28,
        left: 48,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
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
          const name = params[0].axisValue;
          const kwh = params.find((p: any) => p.seriesName.includes('Energy'))?.value ?? 0;
          const tokens = params.find((p: any) => p.seriesName.includes('Tokens'))?.value ?? 0;
          return `
            <div class="font-bold font-mono border-b border-white/10 pb-1 mb-1 text-xs text-slate-400">${name}</div>
            <div class="flex items-center justify-between gap-4 text-xs font-mono">
              <span class="text-blue-400">Monthly Energy:</span>
              <span class="font-bold text-white">${Number(kwh).toLocaleString()} kWh</span>
            </div>
            <div class="flex items-center justify-between gap-4 text-xs my-0.5 font-mono">
              <span class="text-emerald-400">Assigned Tokens:</span>
              <span class="font-bold text-emerald-400">${tokens} badges</span>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontFamily: 'monospace',
          fontSize: 10,
          interval: 0,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: 'kWh',
          nameTextStyle: { color: '#007AFF', fontFamily: 'monospace', fontSize: 10 },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' } },
          axisLabel: {
            color: '#64748b',
            fontFamily: 'monospace',
            fontSize: 10,
          },
        },
        {
          type: 'value',
          name: 'Cards',
          nameTextStyle: { color: '#10B981', fontFamily: 'monospace', fontSize: 10 },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: {
            color: '#64748b',
            fontFamily: 'monospace',
            fontSize: 10,
          },
        },
      ],
      series: [
        {
          name: 'Monthly Energy (kWh)',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#007AFF' },
              { offset: 1, color: '#0051A8' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          data: kwhData,
        },
        {
          name: 'Assigned Tokens',
          type: 'line',
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#10B981' },
          lineStyle: {
            color: '#10B981',
            width: 2.5,
            shadowColor: 'rgba(16, 185, 129, 0.5)',
            shadowBlur: 8,
          },
          data: tokenCounts,
        },
      ],
    };
  }, [groups]);

  return (
    <div className="w-full h-56">
      <BaseEChart option={chartOption} />
    </div>
  );
};
