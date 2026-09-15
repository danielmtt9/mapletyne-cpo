import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';
import { api } from '@/lib/api-client';
import {
  TelemetryRingBuffer,
  formatTimeLabel,
} from '@/lib/telemetry-processor';

export interface ChargerTelemetryViewProps {
  chargerId: string;
  maxPowerKw?: number;
  status?: string;
  vendor?: string;
  model?: string;
}

interface PhaseTelemetryPoint {
  timestamp: number;
  timeLabel: string;
  vL1: number;
  vL2: number;
  vL3: number;
  aL1: number;
  aL2: number;
  aL3: number;
  powerKw: number;
}

export const ChargerTelemetryView: React.FC<ChargerTelemetryViewProps> = ({
  chargerId,
  maxPowerKw = 150.0,
  status = 'Available',
}) => {
  const [viewMetric, setViewMetric] = useState<'voltage' | 'current'>('voltage');

  // Query live telemetry or station data
  const { data: telemetryData } = useQuery({
    queryKey: ['telemetry', chargerId],
    queryFn: () => api.get<any>(`/chargers/${chargerId}`).catch(() => null),
    refetchInterval: status === 'Charging' ? 2000 : 10000,
  });

  // Query historical meter values for exact phase & power telemetry
  const { data: meterValuesData } = useQuery({
    queryKey: ['meter-values', chargerId],
    queryFn: () => api.get<any>(`/chargers/${chargerId}/meter-values?limit=30`).catch(() => null),
    refetchInterval: status === 'Charging' ? 3000 : 15000,
  });

  // Extract latest connector reading if available
  const latestMeterReading = useMemo(() => {
    if (!meterValuesData?.connectors) return null;
    const connectors = Object.values(meterValuesData.connectors) as Array<any[]>;
    if (connectors.length > 0 && Array.isArray(connectors[0]) && connectors[0].length > 0) {
      return connectors[0][0]; // Most recent entry is first (ORDER BY time DESC)
    }
    return null;
  }, [meterValuesData]);

  const isCharging = status === 'Charging' || telemetryData?.status === 'Charging' || (latestMeterReading && (latestMeterReading.power_kw ?? 0) > 0);
  const isOnline = status === 'online' || status === 'Available' || isCharging || telemetryData?.status === 'Available' || telemetryData?.status === 'online';

  // Derive current electrical parameters
  const currentPowerKw = latestMeterReading?.power_kw != null
    ? Number(latestMeterReading.power_kw.toFixed(2))
    : (isCharging ? Number((telemetryData?.power_kw ?? telemetryData?.active_power_kw ?? 0.0).toFixed(2)) : 0.0);

  const baseVoltage = latestMeterReading?.voltage_v != null
    ? Number(latestMeterReading.voltage_v)
    : (isOnline ? 230.0 : 0.0);

  const currentVL1 = isOnline ? (telemetryData?.voltage_l1 ?? baseVoltage) : 0.0;
  const currentVL2 = isOnline ? (telemetryData?.voltage_l2 ?? baseVoltage) : 0.0;
  const currentVL3 = isOnline ? (telemetryData?.voltage_l3 ?? baseVoltage) : 0.0;

  const baseCurrent = latestMeterReading?.current_a != null
    ? Number(latestMeterReading.current_a)
    : (isCharging ? Number(((currentPowerKw * 1000) / (3 * (baseVoltage || 230))).toFixed(1)) : 0.0);

  const currentAL1 = isCharging ? (telemetryData?.current_l1 ?? baseCurrent) : 0.0;
  const currentAL2 = isCharging ? (telemetryData?.current_l2 ?? baseCurrent) : 0.0;
  const currentAL3 = isCharging ? (telemetryData?.current_l3 ?? baseCurrent) : 0.0;

  // 30-point sliding window for phase oscilloscope (2s intervals = 60s window)
  const ringBufferRef = useRef<TelemetryRingBuffer<PhaseTelemetryPoint>>(
    new TelemetryRingBuffer<PhaseTelemetryPoint>(30)
  );

  const [phaseHistory, setPhaseHistory] = useState<PhaseTelemetryPoint[]>(() => {
    const initial: PhaseTelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const ts = now - i * 2000;
      initial.push({
        timestamp: ts,
        timeLabel: formatTimeLabel(ts),
        vL1: isOnline ? 230.0 : 0.0,
        vL2: isOnline ? 230.0 : 0.0,
        vL3: isOnline ? 230.0 : 0.0,
        aL1: 0.0,
        aL2: 0.0,
        aL3: 0.0,
        powerKw: 0.0,
      });
    }
    initial.forEach((p) => ringBufferRef.current.push(p));
    return initial;
  });

  // Hydrate history from real meter-values when available
  useEffect(() => {
    if (!meterValuesData?.connectors) return;
    const connectors = Object.values(meterValuesData.connectors) as Array<any[]>;
    if (connectors.length > 0 && Array.isArray(connectors[0]) && connectors[0].length > 0) {
      const reversed = [...connectors[0]].reverse(); // Chronological order
      const newPoints: PhaseTelemetryPoint[] = reversed.map((mv) => {
        const ts = new Date(mv.time).getTime();
        const v = Number(mv.voltage_v || 230.0);
        const a = Number(mv.current_a || 0.0);
        const p = Number(mv.power_kw || 0.0);
        return {
          timestamp: ts,
          timeLabel: formatTimeLabel(ts),
          vL1: v,
          vL2: v,
          vL3: v,
          aL1: a,
          aL2: a,
          aL3: a,
          powerKw: p,
        };
      });
      ringBufferRef.current.clear();
      newPoints.forEach((pt) => ringBufferRef.current.push(pt));
      setPhaseHistory(ringBufferRef.current.toArray());
    }
  }, [meterValuesData]);

  // Ticker to slide the window
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const point: PhaseTelemetryPoint = {
        timestamp: now,
        timeLabel: formatTimeLabel(now),
        vL1: currentVL1,
        vL2: currentVL2,
        vL3: currentVL3,
        aL1: currentAL1,
        aL2: currentAL2,
        aL3: currentAL3,
        powerKw: currentPowerKw,
      };
      ringBufferRef.current.push(point);
      setPhaseHistory(ringBufferRef.current.toArray());
    }, 2000);

    return () => clearInterval(interval);
  }, [currentVL1, currentVL2, currentVL3, currentAL1, currentAL2, currentAL3, currentPowerKw]);

  // ECharts: Semi-Circular Active Power Gauge
  const gaugeOption = useMemo<EChartsOption>(() => {
    const maxVal = maxPowerKw > 0 ? maxPowerKw : 150;
    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          center: ['50%', '75%'],
          radius: '110%',
          min: 0,
          max: maxVal,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 10,
              color: [
                [0.7, '#005234'],
                [0.9, '#4edea3'],
                [1, '#3b82f6'],
              ],
            },
          },
          progress: {
            show: true,
            width: 10,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#005234' },
                { offset: 1, color: '#4edea3' },
              ]),
            },
          },
          pointer: {
            show: true,
            length: '65%',
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
          },
          title: {
            show: true,
            offsetCenter: [0, '-20%'],
            fontSize: 10,
            color: '#94a3b8',
            fontFamily: 'monospace',
          },
          detail: {
            valueAnimation: true,
            offsetCenter: [0, '10%'],
            fontSize: 18,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            color: '#e2e8f0',
            formatter: '{value} kW',
          },
          data: [
            {
              value: currentPowerKw,
              name: 'ACTIVE OUTPUT',
            },
          ],
        },
      ],
    };
  }, [currentPowerKw, maxPowerKw]);

  // ECharts: 3-Phase Voltage / Current Multi-Line Oscilloscope
  const oscilloscopeOption = useMemo<EChartsOption>(() => {
    const timeLabels = phaseHistory.map((p) => p.timeLabel);
    const isVoltage = viewMetric === 'voltage';

    const l1Data = phaseHistory.map((p) => (isVoltage ? p.vL1 : p.aL1));
    const l2Data = phaseHistory.map((p) => (isVoltage ? p.vL2 : p.aL2));
    const l3Data = phaseHistory.map((p) => (isVoltage ? p.vL3 : p.aL3));

    const yUnit = isVoltage ? 'V' : 'A';
    const yMin = isVoltage ? (isOnline ? 200 : 0) : 0;
    const yMax = isVoltage ? 260 : Math.max(32, Math.ceil(Math.max(...l1Data, ...l2Data, ...l3Data, 10) * 1.2));

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDurationUpdate: 600,
      grid: {
        top: 20,
        right: 12,
        bottom: 24,
        left: 42,
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
          let output = `<div class="font-bold border-b border-[#222a3d] pb-1 mb-1 text-xs text-[#94a3b8]">${time}</div>`;
          params.forEach((item: any) => {
            output += `
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="flex items-center gap-1.5">
                  <span style="display:inline-block;width:7px;height:7px;background:${item.color};border-radius:1px;"></span>
                  <span>${item.seriesName}:</span>
                </span>
                <span class="font-bold tabular-nums">${item.value} ${yUnit}</span>
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
        axisLine: { lineStyle: { color: '#222a3d' } },
        axisLabel: {
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 9,
          interval: Math.floor(phaseHistory.length / 4),
        },
      },
      yAxis: {
        type: 'value',
        min: yMin,
        max: yMax,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1b243b', type: 'dashed' } },
        axisLabel: {
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 9,
          formatter: `{value} ${yUnit}`,
        },
      },
      series: [
        {
          name: 'L1 (Phase A)',
          type: 'line',
          smooth: 0.2,
          showSymbol: false,
          lineStyle: { color: '#4edea3', width: 2 },
          data: l1Data,
        },
        {
          name: 'L2 (Phase B)',
          type: 'line',
          smooth: 0.2,
          showSymbol: false,
          lineStyle: { color: '#3b82f6', width: 2 },
          data: l2Data,
        },
        {
          name: 'L3 (Phase C)',
          type: 'line',
          smooth: 0.2,
          showSymbol: false,
          lineStyle: { color: '#fbbf24', width: 2 },
          data: l3Data,
        },
      ],
    };
  }, [phaseHistory, viewMetric, isOnline]);

  return (
    <div className="space-y-4 font-body">
      {/* 3 Metric Summary Boxes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="material-card bg-surface-container/80 p-3.5 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block">Active Output</span>
          <span className="text-xl font-headline font-bold text-apple-green tabular-nums">
            {currentPowerKw.toFixed(1)} <span className="text-xs font-mono font-normal text-on-surface-variant">kW</span>
          </span>
        </div>
        <div className="material-card bg-surface-container/80 p-3.5 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block">Phase RMS Voltage</span>
          <span className="text-xl font-headline font-bold text-on-surface tabular-nums">
            {isOnline ? `${((currentVL1 + currentVL2 + currentVL3) / 3).toFixed(0)}` : '0'} <span className="text-xs font-mono font-normal text-on-surface-variant">V</span>
          </span>
        </div>
        <div className="material-card bg-surface-container/80 p-3.5 rounded-xl border border-white/5 text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block">Total Draw</span>
          <span className="text-xl font-headline font-bold text-apple-blue tabular-nums">
            {(currentAL1 + currentAL2 + currentAL3).toFixed(1)} <span className="text-xs font-mono font-normal text-on-surface-variant">A</span>
          </span>
        </div>
      </div>

      {/* Visual Telemetry: Gauge & 3-Phase Oscilloscope */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Left: Active Power Speedometer Gauge */}
        <div className="md:col-span-2 material-card bg-surface-container/80 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-full text-left mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface-variant">
              Output Meter
            </span>
          </div>
          <div className="w-full h-36">
            <BaseEChart option={gaugeOption} />
          </div>
        </div>

        {/* Right: 3-Phase Multi-Line Oscilloscope */}
        <div className="md:col-span-3 material-card bg-surface-container/80 border border-white/5 p-4 rounded-xl flex flex-col justify-between min-h-[200px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface">
                3-Phase Scope
              </span>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#34c759]" /> L1</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#0a84ff]" /> L2</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#ff9f0a]" /> L3</span>
              </div>
            </div>
            {/* Metric Toggle Segmented Control */}
            <div className="flex bg-surface-container-lowest/80 p-0.5 rounded-lg border border-white/5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setViewMetric('voltage')}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  viewMetric === 'voltage' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Volts
              </button>
              <button
                type="button"
                onClick={() => setViewMetric('current')}
                className={`px-2.5 py-0.5 rounded-md transition-all ${
                  viewMetric === 'current' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Amps
              </button>
            </div>
          </div>

          <div className="w-full h-32">
            <BaseEChart option={oscilloscopeOption} />
          </div>
        </div>
      </div>
    </div>
  );
};
