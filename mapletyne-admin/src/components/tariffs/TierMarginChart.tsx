import React, { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { BaseEChart } from '@/components/common/BaseEChart';

export interface PricingTierItem {
  id: string;
  name: string;
  margin_kwh: number;
  description?: string;
  rate_excl?: number;
  rate_incl?: number;
  updated_at?: string;
}

export interface TierMarginChartProps {
  tiers: PricingTierItem[];
  costBasis: number;
}

export const TierMarginChart: React.FC<TierMarginChartProps> = ({ tiers, costBasis }) => {
  const chartOption = useMemo<EChartsOption>(() => {
    if (!tiers || tiers.length === 0) {
      return {
        title: {
          text: 'No Pricing Tiers Configured',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#64748b', fontSize: 12, fontFamily: 'monospace' },
        },
      };
    }

    const categories = tiers.map((t) => t.name || t.id);
    const baseData = tiers.map(() => Number(costBasis.toFixed(3)));
    const marginData = tiers.map((t) => Number((t.margin_kwh ?? 0).toFixed(3)));
    const inclTaxData = tiers.map((t) => Number((t.rate_incl ?? (costBasis + (t.margin_kwh ?? 0)) * 1.21).toFixed(3)));

    return {
      backgroundColor: 'transparent',
      animation: true,
      legend: {
        data: ['Grid & Cost Basis', 'Tier Margin Adder', 'Final Retail (incl. Tax)'],
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
        bottom: 28,
        left: 48,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
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
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const tierName = params[0].axisValue;
          const base = params.find((p: any) => p.seriesName.includes('Cost Basis'))?.value ?? 0;
          const margin = params.find((p: any) => p.seriesName.includes('Margin'))?.value ?? 0;
          const inclTax = params.find((p: any) => p.seriesName.includes('incl. Tax'))?.value ?? 0;
          const exclTax = (Number(base) + Number(margin)).toFixed(3);
          return `
            <div class="font-bold font-mono border-b border-white/10 pb-1 mb-1 text-xs text-slate-400">${tierName} Tier</div>
            <div class="flex items-center justify-between gap-4 text-xs font-mono">
              <span class="text-slate-400">Grid & Cost Basis:</span>
              <span class="font-bold text-white">£${Number(base).toFixed(3)}/kWh</span>
            </div>
            <div class="flex items-center justify-between gap-4 text-xs my-0.5 font-mono">
              <span class="text-emerald-400">Tier Margin:</span>
              <span class="font-bold text-emerald-400">+£${Number(margin).toFixed(3)}/kWh</span>
            </div>
            <div class="flex items-center justify-between gap-4 text-xs my-0.5 border-t border-white/10 pt-1 font-mono">
              <span class="text-blue-400">Rate (excl. Tax):</span>
              <span class="font-bold text-blue-400">£${exclTax}/kWh</span>
            </div>
            <div class="flex items-center justify-between gap-4 text-xs font-bold font-mono text-amber-400">
              <span>Final Retail (incl. Tax):</span>
              <span>£${Number(inclTax).toFixed(3)}/kWh</span>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontFamily: 'monospace',
          fontSize: 10,
          interval: 0,
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
          name: 'Grid & Cost Basis',
          type: 'bar',
          stack: 'retail_stack',
          barMaxWidth: 28,
          itemStyle: { color: '#334155', borderRadius: [0, 0, 4, 4] },
          data: baseData,
        },
        {
          name: 'Tier Margin Adder',
          type: 'bar',
          stack: 'retail_stack',
          barMaxWidth: 28,
          itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] },
          data: marginData,
        },
        {
          name: 'Final Retail (incl. Tax)',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { color: '#F59E0B' },
          lineStyle: {
            color: '#F59E0B',
            width: 2.5,
            type: 'dashed',
            shadowColor: 'rgba(245, 158, 11, 0.5)',
            shadowBlur: 8,
          },
          data: inclTaxData,
        },
      ],
    };
  }, [tiers, costBasis]);

  return (
    <div className="w-full h-56">
      <BaseEChart option={chartOption} />
    </div>
  );
};
