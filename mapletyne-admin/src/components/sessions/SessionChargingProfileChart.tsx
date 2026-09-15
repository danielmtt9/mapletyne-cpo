import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

export interface SessionChargingProfileChartProps {
  energyKwh?: number;
  peakPowerKw?: number;
  durationMinutes?: number;
  meterValues?: { time: string; powerKw: number; soc?: number }[];
}

export const SessionChargingProfileChart: React.FC<SessionChargingProfileChartProps> = ({
  energyKwh = 0,
  peakPowerKw = 0,
  durationMinutes = 30,
  meterValues,
}) => {
  const chartOption = useMemo<EChartsOption>(() => {
    let timeLabels: string[] = [];
    let powerData: number[] = [];
    let socData: number[] = [];

    if (meterValues && meterValues.length > 0) {
      timeLabels = meterValues.map((m) => m.time);
      powerData = meterValues.map((m) => m.powerKw);
      socData = meterValues.map((m) => m.soc ?? 0);
    } else if (energyKwh > 0) {
      // Reconstruct clean stepped session envelope from recorded energy and peak
      const steps = Math.max(5, Math.min(20, Math.round(durationMinutes / 2)));
      const avgKw = peakPowerKw > 0 ? peakPowerKw : (energyKwh / (durationMinutes / 60));
      for (let i = 0; i <= steps; i++) {
        const min = Math.round((i / steps) * durationMinutes);
        timeLabels.push(`${min}m`);
        // Typical CC-CV charging curve taper
        const factor = i === 0 ? 0.2 : i < steps * 0.7 ? 1.0 : 1.0 - ((i - steps * 0.7) / (steps * 0.3)) * 0.6;
        powerData.push(Number((avgKw * factor).toFixed(1)));
        socData.push(Math.min(100, Math.round(20 + (i / steps) * 60)));
      }
    } else {
      // Strict Zero State
      timeLabels = ['0m', '5m', '10m', '15m', '20m', '25m', '30m'];
      powerData = [0, 0, 0, 0, 0, 0, 0];
      socData = [0, 0, 0, 0, 0, 0, 0];
    }

    const maxKw = Math.max(22, Math.ceil(Math.max(...powerData, 10) * 1.2));

    return {
      backgroundColor: 'transparent',
      animation: true,
      grid: {
        top: 24,
        right: 44,
        bottom: 24,
        left: 44,
      },
      legend: {
        data: ['Charging Power (kW)', 'State of Charge (%)'],
        top: 0,
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 10,
        },
        itemWidth: 10,
        itemHeight: 10,
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
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeLabels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontFamily: 'monospace',
          fontSize: 9,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: 'kW',
          min: 0,
          max: maxKw,
          nameTextStyle: { color: '#10B981', fontFamily: 'monospace', fontSize: 9 },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.05)',
              type: 'dashed',
            },
          },
          axisLabel: {
            color: '#64748b',
            fontFamily: 'monospace',
            fontSize: 9,
          },
        },
        {
          type: 'value',
          name: 'SoC %',
          min: 0,
          max: 100,
          nameTextStyle: { color: '#007AFF', fontFamily: 'monospace', fontSize: 9 },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: {
            color: '#64748b',
            fontFamily: 'monospace',
            fontSize: 9,
            formatter: '{value}%',
          },
        },
      ],
      series: [
        {
          name: 'Charging Power (kW)',
          type: 'line',
          smooth: 0.3,
          showSymbol: false,
          yAxisIndex: 0,
          lineStyle: {
            color: '#10B981',
            width: 2.5,
            shadowColor: 'rgba(16, 185, 129, 0.5)',
            shadowBlur: 8,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.30)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.00)' },
            ]),
          },
          data: powerData,
        },
        {
          name: 'State of Charge (%)',
          type: 'line',
          smooth: 0.2,
          showSymbol: false,
          yAxisIndex: 1,
          lineStyle: {
            color: '#007AFF',
            width: 2,
            type: 'dashed',
            shadowColor: 'rgba(0, 122, 255, 0.5)',
            shadowBlur: 6,
          },
          data: socData,
        },
      ],
    };
  }, [energyKwh, peakPowerKw, durationMinutes, meterValues]);

  return (
    <div className="w-full h-44 bg-slate-950/90 border border-slate-700/60 rounded-xl p-2 shadow-inner">
      <BaseEChart option={chartOption} />
    </div>
  );
};
