import React, { useMemo } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

export interface EmsBatterySocGaugeProps {
  socPct?: number;
  batteryKw?: number;
  batteryTempC?: number;
  batteryState?: string;
}

export const EmsBatterySocGauge: React.FC<EmsBatterySocGaugeProps> = ({
  socPct = 0.0,
  batteryKw = 0.0,
  batteryTempC = 25.0,
  batteryState = 'idle',
}) => {
  const chartOption = useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          center: ['50%', '55%'],
          radius: '95%',
          min: 0,
          max: 100,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 10,
              color: [
                [0.2, '#ef4444'],
                [0.8, '#3b82f6'],
                [1, '#4edea3'],
              ],
            },
          },
          progress: {
            show: true,
            width: 10,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#3b82f6' },
                { offset: 1, color: '#4edea3' },
              ]),
            },
          },
          pointer: {
            show: true,
            length: '60%',
            width: 4,
            itemStyle: {
              color: '#4edea3',
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            length: 6,
            lineStyle: {
              width: 1,
              color: '#3a445d',
            },
          },
          axisLabel: {
            distance: 14,
            color: '#94a3b8',
            fontSize: 9,
            fontFamily: 'monospace',
            formatter: '{value}%',
          },
          title: {
            show: true,
            offsetCenter: [0, '25%'],
            fontSize: 10,
            color: '#94a3b8',
            fontFamily: 'monospace',
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '-10%'],
            fontSize: 20,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            color: '#e2e8f0',
            formatter: '{value}%',
          },
          data: [
            {
              value: Math.round(socPct),
              name: 'STATE OF CHARGE',
            },
          ],
        },
      ],
    };
  }, [socPct]);

  return (
    <div className="bg-surface-container border border-outline-variant/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono font-bold uppercase text-on-surface">
          BESS Battery Storage
        </h3>
        <span
          className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${
            batteryState === 'discharging'
              ? 'bg-secondary/10 text-secondary border-secondary/30'
              : batteryState === 'charging'
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'
          }`}
        >
          {batteryState.toUpperCase()}
        </span>
      </div>

      <div className="w-full h-44">
        <BaseEChart option={chartOption} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono pt-2 border-t border-outline-variant/20">
        <div>
          <span className="text-[10px] text-on-surface-variant uppercase block">Power Flow</span>
          <span className="font-bold text-on-surface tabular-nums">
            {batteryKw ? `${batteryKw > 0 ? `+${batteryKw.toFixed(1)}` : batteryKw.toFixed(1)} kW` : '0.0 kW'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-on-surface-variant uppercase block">Cell Temp</span>
          <span className="font-bold text-on-surface tabular-nums">
            {batteryTempC ? `${batteryTempC.toFixed(1)}°C` : '25.0°C'}
          </span>
        </div>
      </div>
    </div>
  );
};
