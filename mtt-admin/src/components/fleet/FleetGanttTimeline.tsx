import React from 'react';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

export interface ScheduleItem {
  id: number;
  vehicle_id: number;
  license_plate: string;
  unit_number?: string;
  priority_tier?: number;
  current_soc_pct?: number;
  target_soc_pct: number;
  min_emergency_soc_pct: number;
  target_departure_at: string;
  status: string;
}

interface FleetGanttTimelineProps {
  schedules: ScheduleItem[];
  isLoading?: boolean;
}

export const FleetGanttTimeline: React.FC<FleetGanttTimelineProps> = ({ schedules, isLoading = false }) => {
  if (schedules.length === 0 && !isLoading) {
    return (
      <div className="h-[260px] w-full bg-surface-container-low border border-outline-variant/30 p-6 flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-outline-variant text-[40px] mb-2">schedule</span>
        <p className="text-sm font-medium text-on-surface">No Upcoming Shift Schedules</p>
        <p className="text-xs text-on-surface-variant max-w-sm mt-1">
          Add vehicle departure deadlines and target SOCs to visualize the smart charging dispatcher timeline.
        </p>
      </div>
    );
  }

  const vehicleLabels = schedules.map((s) => s.unit_number ? `${s.unit_number} (${s.license_plate})` : s.license_plate);
  const currentSocs = schedules.map((s) => s.current_soc_pct ?? 40);
  const socGaps = schedules.map((s) => Math.max(0, s.target_soc_pct - (s.current_soc_pct ?? 40)));

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0F172A',
      borderColor: '#334155',
      textStyle: { color: '#F8FAFC', fontSize: 12 },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const idx = params[0].dataIndex;
        const item = schedules[idx];
        if (!item) return '';
        const dep = new Date(item.target_departure_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `
          <div class="font-sans">
            <div class="font-bold text-white border-b border-slate-700 pb-1 mb-1">
              ${item.unit_number || item.license_plate} (Tier ${item.priority_tier || 2})
            </div>
            <div class="text-xs text-slate-300">Target Departure: <span class="text-white font-mono font-bold">${dep}</span></div>
            <div class="text-xs text-slate-300">Current SOC: <span class="text-blue-400 font-mono font-bold">${item.current_soc_pct ?? 'N/A'}%</span></div>
            <div class="text-xs text-slate-300">Target Requirement: <span class="text-emerald-400 font-mono font-bold">${item.target_soc_pct}%</span></div>
            <div class="text-xs text-slate-300">Emergency Floor: <span class="text-amber-400 font-mono font-bold">${item.min_emergency_soc_pct}%</span></div>
          </div>
        `;
      },
    },
    legend: {
      data: ['Current Battery SOC', 'Remaining Charge Needed to Departure'],
      top: 0,
      textStyle: { color: '#94A3B8', fontSize: 11 },
    },
    grid: {
      top: 36,
      left: 10,
      right: 40,
      bottom: 10,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'State of Charge (%)',
      max: 100,
      splitLine: { lineStyle: { color: '#1E293B', type: 'dashed' } },
      axisLabel: { color: '#94A3B8', fontSize: 10, formatter: '{value}%' },
      nameTextStyle: { color: '#64748B', fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: vehicleLabels,
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#F8FAFC', fontSize: 11, fontWeight: 500 },
    },
    series: [
      {
        name: 'Current Battery SOC',
        type: 'bar',
        stack: 'soc',
        data: currentSocs,
        itemStyle: {
          color: (params: any) => {
            const val = params.value;
            if (val < 25) return '#EF4444';
            if (val < 50) return '#F59E0B';
            return '#3B82F6';
          },
          borderRadius: [0, 0, 0, 0],
        },
        label: {
          show: true,
          position: 'insideLeft',
          formatter: '{c}%',
          color: '#FFFFFF',
          fontSize: 10,
          fontWeight: 'bold',
        },
      },
      {
        name: 'Remaining Charge Needed to Departure',
        type: 'bar',
        stack: 'soc',
        data: socGaps,
        itemStyle: {
          color: 'rgba(16, 185, 129, 0.35)',
          borderColor: '#10B981',
          borderWidth: 1,
          borderType: 'dashed',
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            const idx = params.dataIndex;
            const item = schedules[idx];
            return item ? `Target ${item.target_soc_pct}%` : '';
          },
          color: '#10B981',
          fontSize: 10,
          fontWeight: 600,
        },
      },
    ],
  };

  return (
    <div className="h-[280px] w-full bg-surface-container-low border border-outline-variant/30 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[16px]">timelapse</span> Dispatcher Departure Timeline & SOC Gap
        </span>
        <span className="text-[11px] text-on-surface-variant font-mono">
          {schedules.length} active scheduled shifts
        </span>
      </div>
      <div className="flex-1 w-full min-h-0">
        <BaseEChart option={option} loading={isLoading} />
      </div>
    </div>
  );
};
