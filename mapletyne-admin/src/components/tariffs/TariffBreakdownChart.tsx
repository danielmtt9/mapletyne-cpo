import React, { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

export interface TariffItem {
  id: string;
  name: string;
  currency?: string;
  energy_rate?: number;
  time_rate?: number;
  idle_rate?: number;
  flat_fee?: number;
  created_at?: string;
}

export interface TariffBreakdownChartProps {
  tariffs: TariffItem[];
}

export const TariffBreakdownChart: React.FC<TariffBreakdownChartProps> = ({ tariffs }) => {
  const chartOption = useMemo<EChartsOption>(() => {
    if (!tariffs || tariffs.length === 0) {
      return {
        title: {
          text: 'No Tariffs Configured',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#64748b', fontSize: 12, fontFamily: 'monospace' },
        },
      };
    }

    const categories = tariffs.map((t) => t.name || t.id);
    const energyRates = tariffs.map((t) => Number((t.energy_rate ?? 0).toFixed(3)));
    const timeRates = tariffs.map((t) => Number((t.time_rate ?? 0).toFixed(3)));
    const idleRates = tariffs.map((t) => Number((t.idle_rate ?? 0).toFixed(3)));
    const flatFees = tariffs.map((t) => Number((t.flat_fee ?? 0).toFixed(2)));

    return {
      backgroundColor: 'transparent',
      animation: true,
      legend: {
        data: ['Energy (£/kWh)', 'Time Rate (£/min)', 'Idle Fee (£/min)', 'Flat Fee (£)'],
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
        right: 16,
        bottom: tariffs.length > 4 ? 46 : 30,
        left: 48,
      },
      dataZoom: tariffs.length > 4 ? [
        {
          type: 'inside',
          start: 0,
          end: Math.min(100, (6 / tariffs.length) * 100),
        },
        {
          type: 'slider',
          height: 14,
          bottom: 4,
          borderColor: 'transparent',
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          fillerColor: 'rgba(0, 122, 255, 0.25)',
          handleStyle: {
            color: '#007AFF',
            borderColor: '#38bdf8',
          },
          moveHandleStyle: {
            color: '#007AFF',
          },
          textStyle: {
            color: '#94a3b8',
            fontFamily: 'monospace',
            fontSize: 9,
          },
          start: 0,
          end: Math.min(100, (6 / tariffs.length) * 100),
        },
      ] : undefined,
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 10,
          interval: 0,
          rotate: tariffs.length > 3 ? 20 : 0,
          formatter: (value: string) => (value.length > 14 ? `${value.substring(0, 12)}…` : value),
        },
      },
      yAxis: {
        type: 'value',
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
          name: 'Energy (£/kWh)',
          type: 'bar',
          barMaxWidth: 24,
          itemStyle: { color: '#007AFF', borderRadius: [4, 4, 0, 0] },
          data: energyRates,
        },
        {
          name: 'Time Rate (£/min)',
          type: 'bar',
          barMaxWidth: 24,
          itemStyle: { color: '#06B6D4', borderRadius: [4, 4, 0, 0] },
          data: timeRates,
        },
        {
          name: 'Idle Fee (£/min)',
          type: 'bar',
          barMaxWidth: 24,
          itemStyle: { color: '#F59E0B', borderRadius: [4, 4, 0, 0] },
          data: idleRates,
        },
        {
          name: 'Flat Fee (£)',
          type: 'bar',
          barMaxWidth: 24,
          itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] },
          data: flatFees,
        },
      ],
    };
  }, [tariffs]);

  return (
    <div className="w-full h-56">
      <BaseEChart option={chartOption} />
    </div>
  );
};
