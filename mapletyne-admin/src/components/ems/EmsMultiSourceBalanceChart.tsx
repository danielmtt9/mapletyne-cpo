import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';
import {
  TelemetryRingBuffer,
  formatTimeLabel,
} from '@/lib/telemetry-processor';

export interface EmsBalancePoint {
  timestamp: number;
  timeLabel: string;
  gridKw: number;
  solarKw: number;
  chargerKw: number;
  buildingKw: number;
}

export interface EmsMultiSourceBalanceChartProps {
  gridKw?: number;
  solarKw?: number;
  chargerKw?: number;
  buildingKw?: number;
}

export const EmsMultiSourceBalanceChart: React.FC<EmsMultiSourceBalanceChartProps> = ({
  gridKw = 0.0,
  solarKw = 0.0,
  chargerKw = 0.0,
  buildingKw = 0.0,
}) => {
  // 60-point sliding window (2s intervals = 2 minutes history)
  const ringBufferRef = useRef<TelemetryRingBuffer<EmsBalancePoint>>(
    new TelemetryRingBuffer<EmsBalancePoint>(60)
  );

  const [points, setPoints] = useState<EmsBalancePoint[]>(() => {
    const initial: EmsBalancePoint[] = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const ts = now - i * 2000;
      initial.push({
        timestamp: ts,
        timeLabel: formatTimeLabel(ts),
        gridKw: 0.0,
        solarKw: 0.0,
        chargerKw: 0.0,
        buildingKw: 0.0,
      });
    }
    initial.forEach((p) => ringBufferRef.current.push(p));
    return initial;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const pt: EmsBalancePoint = {
        timestamp: now,
        timeLabel: formatTimeLabel(now),
        gridKw: Math.max(0, gridKw),
        solarKw: Math.max(0, solarKw),
        chargerKw: Math.max(0, chargerKw),
        buildingKw: Math.max(0, buildingKw),
      };
      ringBufferRef.current.push(pt);
      setPoints(ringBufferRef.current.toArray());
    }, 2000);

    return () => clearInterval(interval);
  }, [gridKw, solarKw, chargerKw, buildingKw]);

  const chartOption = useMemo<EChartsOption>(() => {
    const timeLabels = points.map((p) => p.timeLabel);
    const solarData = points.map((p) => p.solarKw);
    const gridData = points.map((p) => p.gridKw);
    const evLoadData = points.map((p) => p.chargerKw);

    const maxVal = Math.max(
      30,
      Math.ceil(
        Math.max(...solarData, ...gridData, ...evLoadData, 10) * 1.2
      )
    );

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDurationUpdate: 600,
      legend: {
        data: ['Solar PV Generation', 'Grid Import', 'EV Charging Load'],
        top: 0,
        right: 10,
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 11,
        },
        icon: 'rect',
        itemWidth: 10,
        itemHeight: 10,
      },
      grid: {
        top: 36,
        right: 16,
        bottom: 24,
        left: 48,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#171f33',
        borderColor: '#3a445d',
        textStyle: {
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontSize: 11,
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const time = params[0].axisValue;
          let output = `<div class="font-mono font-semibold border-b border-white/10 pb-1.5 mb-1.5 text-xs text-slate-400">${time}</div>`;
          params.forEach((item: any) => {
            output += `
              <div class="flex items-center justify-between gap-4 text-xs my-1 font-sans">
                <span class="flex items-center gap-2">
                  <span style="display:inline-block;width:8px;height:8px;background:${item.color};border-radius:9999px;"></span>
                  <span class="text-slate-300 font-medium">${item.seriesName}:</span>
                </span>
                <span class="font-bold tabular-nums font-mono text-white">${typeof item.value === 'number' ? item.value.toFixed(1) : item.value} kW</span>
              </div>
            `;
          });
          return output;
        },
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
          fontSize: 10,
          interval: Math.floor(points.length / 5),
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: maxVal,
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
          fontSize: 10,
          formatter: '{value} kW',
        },
      },
      series: [
        {
          name: 'Solar PV Generation',
          type: 'line',
          smooth: 0.3,
          showSymbol: false,
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
          data: solarData,
        },
        {
          name: 'Grid Import',
          type: 'line',
          smooth: 0.3,
          showSymbol: false,
          lineStyle: {
            color: '#007AFF',
            width: 2.5,
            shadowColor: 'rgba(0, 122, 255, 0.5)',
            shadowBlur: 8,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 122, 255, 0.25)' },
              { offset: 1, color: 'rgba(0, 122, 255, 0.00)' },
            ]),
          },
          data: gridData,
        },
        {
          name: 'EV Charging Load',
          type: 'line',
          smooth: 0.3,
          showSymbol: false,
          lineStyle: {
            color: '#8B5CF6',
            width: 3,
            shadowColor: 'rgba(139, 92, 246, 0.6)',
            shadowBlur: 10,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(139, 92, 246, 0.25)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.00)' },
            ]),
          },
          data: evLoadData,
        },
      ],
    };
  }, [points]);

  return (
    <div className="w-full h-full min-h-[280px]">
      <BaseEChart option={chartOption} />
    </div>
  );
};
