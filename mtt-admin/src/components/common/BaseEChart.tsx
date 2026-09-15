import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption, ECharts } from 'echarts';
import { registerOpenCpoTheme } from '@/lib/echarts-theme';

// Ensure custom luxury dark theme is registered in ECharts
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
  theme = 'opencpo-dark',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);

  // Initialize ECharts instance with dark palette & dirty-rect optimization
  useEffect(() => {
    if (!chartRef.current) return;

    registerOpenCpoTheme();
    const chart = echarts.init(chartRef.current, theme, {
      renderer,
      useDirtyRect: true,
    });
    chartInstance.current = chart;

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
  }, [renderer]);

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
        color: '#007AFF',
        textColor: '#F8FAFC',
        maskColor: 'rgba(11, 15, 25, 0.7)',
        zlevel: 10,
      });
    } else {
      chartInstance.current.hideLoading();
    }
  }, [loading]);

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
