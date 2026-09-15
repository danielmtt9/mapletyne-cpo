import React, { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

export interface EmsSiteFlowSankeyProps {
  gridKw?: number;
  solarKw?: number;
  chargerKw?: number;
  buildingKw?: number;
}

export const EmsSiteFlowSankey: React.FC<EmsSiteFlowSankeyProps> = ({
  gridKw = 0.0,
  solarKw = 0.0,
  chargerKw = 0.0,
  buildingKw = 0.0,
}) => {
  const chartOption = useMemo<EChartsOption>(() => {
    // Determine flow values
    const solarToEv = solarKw > 0 && chargerKw > 0 ? Math.min(solarKw, chargerKw) : 0.001;
    const gridToEv = gridKw > 0 && chargerKw > 0 ? Math.max(0, chargerKw - solarToEv) : 0.001;
    const gridToBuilding = gridKw > 0 && buildingKw > 0 ? buildingKw : 0.001;

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: '#171f33',
        borderColor: '#3a445d',
        textStyle: {
          color: '#e2e8f0',
          fontFamily: 'monospace',
          fontSize: 11,
        },
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            const rawVal = params.value <= 0.01 ? 0 : params.value;
            return `
              <div class="text-xs">
                <span class="text-[#94a3b8]">${params.data.source} → ${params.data.target}</span><br/>
                <span class="font-bold tabular-nums text-white">${rawVal.toFixed(1)} kW</span>
              </div>
            `;
          }
          return `<div class="text-xs font-bold text-white">${params.name}</div>`;
        },
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          emphasis: {
            focus: 'adjacency',
          },
          nodeAlign: 'justify',
          nodeGap: 24,
          nodeWidth: 18,
          itemStyle: {
            borderWidth: 1,
            borderColor: '#222a3d',
          },
          lineStyle: {
            color: 'source',
            curveness: 0.5,
            opacity: 0.45,
          },
          label: {
            color: '#e2e8f0',
            fontFamily: 'monospace',
            fontSize: 11,
            formatter: '{b}',
          },
          data: [
            { name: 'Solar PV Generation', itemStyle: { color: '#eab308' } },
            { name: 'Utility Grid Import', itemStyle: { color: '#3b82f6' } },
            { name: 'EV Charging Stations', itemStyle: { color: '#4edea3' } },
            { name: 'Base Facility Load', itemStyle: { color: '#64748b' } },
          ],
          links: [
            { source: 'Solar PV Generation', target: 'EV Charging Stations', value: solarToEv },
            { source: 'Utility Grid Import', target: 'EV Charging Stations', value: gridToEv },
            { source: 'Utility Grid Import', target: 'Base Facility Load', value: gridToBuilding },
          ],
        },
      ],
    };
  }, [gridKw, solarKw, chargerKw, buildingKw]);

  return (
    <div className="w-full h-full min-h-[280px]">
      <BaseEChart option={chartOption} />
    </div>
  );
};
