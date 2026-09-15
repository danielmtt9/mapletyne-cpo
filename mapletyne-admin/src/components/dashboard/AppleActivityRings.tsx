import React, { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

export interface AppleActivityRingsProps {
  powerPct?: number;       // 0 to 100
  occupancyPct?: number;   // 0 to 100
  headroomPct?: number;    // 0 to 100
  currentLoadKw?: number;
  onlineCount?: number;
  totalCount?: number;
}

export const AppleActivityRings: React.FC<AppleActivityRingsProps> = ({
  powerPct = 0,
  occupancyPct = 0,
  headroomPct = 100,
  currentLoadKw = 0,
  onlineCount = 0,
  totalCount = 0,
}) => {
  const chartOption = useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          startAngle: 90,
          endAngle: -270,
          clockwise: true,
          pointer: { show: false },
          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            clip: false,
            itemStyle: { borderWidth: 0 },
          },
          axisLine: {
            lineStyle: {
              width: 18,
              color: [[1, 'rgba(255, 255, 255, 0.05)']],
            },
          },
          splitLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          data: [
            {
              value: Math.min(100, Math.max(0, Math.round(powerPct))),
              name: 'Power',
              title: { show: false },
              detail: { show: false },
              itemStyle: { color: '#FF3B30' }, // Apple Red
            },
            {
              value: Math.min(100, Math.max(0, Math.round(occupancyPct))),
              name: 'Occupancy',
              title: { show: false },
              detail: { show: false },
              itemStyle: { color: '#34C759' }, // Apple Green
            },
            {
              value: Math.min(100, Math.max(0, Math.round(headroomPct))),
              name: 'Headroom',
              title: { show: false },
              detail: { show: false },
              itemStyle: { color: '#007AFF' }, // Apple Blue
            },
          ],
        },
      ],
    };
  }, [powerPct, occupancyPct, headroomPct]);

  return (
    <div className="material-card p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">System Utilization</h3>
          <p className="text-[11px] text-slate-400 font-mono">Multi-Vector Activity</p>
        </div>
        <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full text-slate-300 uppercase">
          Live Rings
        </span>
      </div>

      {/* Center Gauge & Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 py-3">
        {/* ECharts Ring Canvas */}
        <div className="w-full h-36 relative flex items-center justify-center">
          <BaseEChart option={chartOption} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-white tabular-nums tracking-tight">
              {currentLoadKw.toFixed(1)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              kW Live
            </span>
          </div>
        </div>

        {/* Ring Legend & Metrics */}
        <div className="space-y-2 text-xs">
          {/* Ring 1 */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]" />
              <span className="text-slate-300 font-medium">Power Load</span>
            </div>
            <span className="font-mono font-bold text-white tabular-nums">
              {Math.round(powerPct)}%
            </span>
          </div>

          {/* Ring 2 */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
              <span className="text-slate-300 font-medium">Occupancy</span>
            </div>
            <span className="font-mono font-bold text-white tabular-nums">
              {Math.round(occupancyPct)}%
            </span>
          </div>

          {/* Ring 3 */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
              <span className="text-slate-300 font-medium">Headroom</span>
            </div>
            <span className="font-mono font-bold text-white tabular-nums">
              {Math.round(headroomPct)}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Endpoints: {onlineCount} / {totalCount} Active</span>
        <span className="text-emerald-400 font-medium">Normal Grid State</span>
      </div>
    </div>
  );
};
