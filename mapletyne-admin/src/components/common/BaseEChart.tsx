import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption, ECharts } from 'echarts';
import { registerOpenCpoTheme } from '@/lib/echarts-theme';
import { useTheme } from '@/lib/theme-provider';

// Ensure custom themes are registered in ECharts
registerOpenCpoTheme();

export interface BaseEChartProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
  onEvents?: Record<string, (params: any) => void>;
  onChartReady?: (chart: ECharts) => void;
  renderer?: 'canvas' | 'svg';
  theme?: string;
}

export const BaseEChart: React.FC<BaseEChartProps> = ({
  option,
  style = { height: '100%', width: '100%' },
  className = '',
  loading = false,
  onEvents,
  onChartReady,
  renderer = 'canvas',
  theme,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);
  const { resolvedTheme } = useTheme();

  // Pick reactive theme unless explicitly overridden
  const effectiveTheme = theme || (resolvedTheme === 'dark' ? 'opencpo-dark' : 'opencpo-light');

  // Initialize ECharts instance with matching palette & dirty-rect optimization
  useEffect(() => {
    if (!chartRef.current) return;

    registerOpenCpoTheme();
    const chart = echarts.init(chartRef.current, effectiveTheme, {
      renderer,
      useDirtyRect: true,
    });
    chartInstance.current = chart;

    // Apply initial option immediately after init
    chart.setOption(option, {
      notMerge: true,
      lazyUpdate: false,
      silent: false,
    });

    if (onChartReady) {
      onChartReady(chart);
    }

    // Bind DOM ResizeObserver for responsive canvas updates without global resize thrashing
    const resizeObserver = new ResizeObserver(() => {
      chart.resize({
        animation: {
          duration: 250,
          easing: 'cubicOut',
        },
      });
    });

    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartInstance.current = null;
    };
  }, [renderer, effectiveTheme]);

  // Update options incrementally with smooth transition
  useEffect(() => {
    if (!chartInstance.current) return;

    chartInstance.current.setOption(option, {
      notMerge: false,
      lazyUpdate: true,
      silent: false,
    });
  }, [option]);

  // Update loading state
  useEffect(() => {
    if (!chartInstance.current) return;

    if (loading) {
      chartInstance.current.showLoading({
        text: 'Streaming Telemetry...',
        color: effectiveTheme === 'opencpo-dark' ? '#10B981' : '#006948',
        textColor: effectiveTheme === 'opencpo-dark' ? '#F8FAFC' : '#0F172A',
        maskColor: effectiveTheme === 'opencpo-dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        zlevel: 10,
      });
    } else {
      chartInstance.current.hideLoading();
    }
  }, [loading, effectiveTheme]);

  // Bind custom chart events
  useEffect(() => {
    if (!chartInstance.current || !onEvents) return;

    const chart = chartInstance.current;
    const entries = Object.entries(onEvents);

    entries.forEach(([eventName, handler]) => {
      chart.on(eventName, handler);
    });

    return () => {
      entries.forEach(([eventName, handler]) => {
        chart.off(eventName, handler);
      });
    };
  }, [onEvents]);

  return <div ref={chartRef} style={style} className={className} />;
};
