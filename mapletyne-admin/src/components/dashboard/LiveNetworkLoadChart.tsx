import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';
import {
  TelemetryPoint,
  TelemetryRingBuffer,
  createZeroStateBuffer,
  formatTimeLabel,
} from '@/lib/telemetry-processor';

export interface LiveNetworkLoadChartProps {
  currentLoadKw?: number;
  gridLimitKw?: number;
  activeSessions?: number;
}

export const LiveNetworkLoadChart: React.FC<LiveNetworkLoadChartProps> = ({
  currentLoadKw = 0.0,
  gridLimitKw = 250.0,
  activeSessions = 0,
}) => {
  // 60-point sliding window (2 seconds per point = 2 minutes live window)
  const ringBufferRef = useRef<TelemetryRingBuffer<TelemetryPoint>>(
    new TelemetryRingBuffer<TelemetryPoint>(60)
  );

  const [points, setPoints] = useState<TelemetryPoint[]>(() => {
    const initial = createZeroStateBuffer(60, 2);
    initial.forEach((p) => ringBufferRef.current.push(p));
    return initial;
  });

  // Ticker to push current live point every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newPoint: TelemetryPoint = {
        timestamp: now,
        timeLabel: formatTimeLabel(now),
        powerKw: currentLoadKw > 0 ? Number(currentLoadKw.toFixed(2)) : 0.0,
        gridLimitKw: gridLimitKw > 0 ? gridLimitKw : 250.0,
      };

      ringBufferRef.current.push(newPoint);
      setPoints(ringBufferRef.current.toArray());
    }, 2000);

    return () => clearInterval(interval);
  }, [currentLoadKw, gridLimitKw]);

  // Immediate push on major state change
  useEffect(() => {
    const now = Date.now();
    const newPoint: TelemetryPoint = {
      timestamp: now,
      timeLabel: formatTimeLabel(now),
      powerKw: currentLoadKw > 0 ? Number(currentLoadKw.toFixed(2)) : 0.0,
      gridLimitKw: gridLimitKw > 0 ? gridLimitKw : 250.0,
    };
    ringBufferRef.current.push(newPoint);
    setPoints(ringBufferRef.current.toArray());
  }, [currentLoadKw, gridLimitKw]);

  const chartOption = useMemo<EChartsOption>(() => {
    const timeLabels = points.map((p) => p.timeLabel);
    const powerData = points.map((p) => p.powerKw);
    const limitData = points.map((p) => p.gridLimitKw ?? 250.0);

    const maxPower = Math.max(0, ...powerData);
    const yAxisMax = Math.max(50, Math.ceil((Math.max(maxPower, gridLimitKw) * 1.15) / 10) * 10);

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDurationUpdate: 600,
      animationEasingUpdate: 'cubicOut',
      grid: {
        top: 28,
        right: 16,
        bottom: 24,
        left: 48,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: [10, 14],
        borderRadius: 12,
        extraCssText: `
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.4);
          border-radius: 12px;
        `,
        textStyle: {
          color: '#F8FAFC',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
          fontSize: 12,
        },
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.2)',
            width: 1.5,
            type: 'dashed',
          },
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const time = params[0].axisValue;
          let output = `<div class="font-semibold border-b border-white/10 pb-1.5 mb-1.5 text-xs text-slate-400 font-mono">${time}</div>`;
          params.forEach((item: any) => {
            const isPower = item.seriesName === 'EV Load';
            const color = isPower ? '#007AFF' : '#64748B';
            const val = typeof item.value === 'number' ? item.value.toFixed(1) : item.value;
            output += `
              <div class="flex items-center justify-between gap-4 text-xs my-1 font-sans">
                <span class="flex items-center gap-2">
                  <span style="display:inline-block;width:8px;height:8px;background:${color};border-radius:9999px;"></span>
                  <span class="text-slate-300 font-medium">${item.seriesName}:</span>
                </span>
                <span class="font-bold tabular-nums font-mono text-white">${val} kW</span>
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
          color: '#64748B',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
          fontSize: 10,
          interval: Math.floor(points.length / 5),
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: yAxisMax,
        splitNumber: 4,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748B',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
          fontSize: 10,
          formatter: '{value} kW',
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.04)',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: 'Grid Capacity',
          type: 'line',
          showSymbol: false,
          lineStyle: {
            color: '#64748b',
            width: 1.5,
            type: 'dashed',
          },
          data: limitData,
          z: 1,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: '#ef4444',
              type: 'dashed',
              width: 1.5,
            },
            data: [
              {
                yAxis: gridLimitKw,
                label: {
                  formatter: `Limit: ${gridLimitKw} kW`,
                  position: 'insideEndTop',
                  color: '#f87171',
                  fontFamily: 'monospace',
                  fontSize: 10,
                },
              },
            ],
          },
        },
        {
          name: 'EV Load',
          type: 'line',
          smooth: 0.35,
          showSymbol: false,
          sampling: 'lttb',
          lineStyle: {
            color: '#007AFF',
            width: 3,
            shadowColor: 'rgba(0, 122, 255, 0.6)',
            shadowBlur: 10,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 122, 255, 0.35)' },
              { offset: 0.8, color: 'rgba(0, 122, 255, 0.05)' },
              { offset: 1, color: 'rgba(0, 122, 255, 0.00)' },
            ]),
          },
          data: powerData,
          z: 2,
        },
      ],
    };
  }, [points, gridLimitKw]);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-1 right-2 z-10 flex items-center gap-2">
        <div className="text-xs font-mono text-blue-400 font-bold bg-slate-900/80 px-2.5 py-1 border border-blue-500/20 rounded-lg flex items-center gap-1.5 shadow-apple-sm">
          <span className={`w-2 h-2 rounded-full ${currentLoadKw > 0 ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span>Live: {currentLoadKw > 0 ? `${currentLoadKw.toFixed(1)} kW` : '0.0 kW'}</span>
        </div>
        {activeSessions > 0 && (
          <div className="text-xs font-mono text-slate-300 font-medium bg-slate-900/80 px-2.5 py-1 border border-white/10 rounded-lg hidden sm:flex items-center gap-1 shadow-apple-sm">
            <span>{activeSessions} {activeSessions === 1 ? 'Session' : 'Sessions'}</span>
          </div>
        )}
      </div>
      <div className="flex-1 w-full min-h-[220px]">
        <BaseEChart option={chartOption} />
      </div>
    </div>
  );
};
