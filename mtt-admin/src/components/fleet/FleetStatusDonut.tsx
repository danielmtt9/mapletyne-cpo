import React, { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

interface FleetStatusDonutProps {
  title: string;
  slices: StatusSlice[];
}

export const FleetStatusDonut: React.FC<FleetStatusDonutProps> = ({ title, slices }) => {
  const chartOption = useMemo<EChartsOption>(() => {
    const total = slices.reduce((acc, s) => acc + s.value, 0);

    return {
      backgroundColor: 'transparent',
      animation: true,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#171f33',
        borderColor: '#3a445d',
        textStyle: { color: '#e2e8f0', fontFamily: 'monospace', fontSize: 11 },
        formatter: '{b}: <span class="font-bold">{c}</span> ({d}%)',
      },
      legend: {
        bottom: 0,
        left: 'center',
        textStyle: {
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: 10,
        },
        itemWidth: 8,
        itemHeight: 8,
      },
      series: [
        {
          name: title,
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 3,
            borderColor: '#0f172a',
            borderWidth: 2,
          },
          label: {
            show: true,
            position: 'center',
            formatter: () => `${total}\nTotal`,
            fontSize: 13,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            color: '#e2e8f0',
          },
          data: slices.map((s) => ({
            name: s.name,
            value: s.value,
            itemStyle: { color: s.color },
          })),
        },
      ],
    };
  }, [title, slices]);

  return (
    <div className="w-full h-56">
      <BaseEChart option={chartOption} />
    </div>
  );
};
