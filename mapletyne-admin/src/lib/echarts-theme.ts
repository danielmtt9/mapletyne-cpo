import * as echarts from 'echarts';

/**
 * OpenCPO Luxury Apple HIG Dark Theme for Apache ECharts
 * Designed for real-time EV charging telemetry, grid management, and financial ledgers.
 */
export const OPENCPO_DARK_PALETTE = [
  '#007AFF', // Electric Azure (Grid / EV Load)
  '#10B981', // Emerald Mint (Solar / Healthy Status)
  '#F59E0B', // Amber Alert (BESS Storage / Peak Demand)
  '#8B5CF6', // Purple Telematics (Fleet Dispatches)
  '#06B6D4', // Cyan Hydro (Building Base Load)
  '#EC4899', // Magenta (Tariff Retail Margin)
  '#EF4444', // Rose Coral (Grid Overload / Idle Penalties)
  '#14B8A6', // Teal (OCPI Roaming)
];

export const openCpoDarkTheme = {
  color: OPENCPO_DARK_PALETTE,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Geist", "JetBrains Mono", sans-serif',
    color: '#94a3b8',
    fontSize: 11,
  },
  title: {
    textStyle: {
      color: '#f8fafc',
      fontSize: 14,
      fontWeight: 600,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
    },
    subtextStyle: {
      color: '#64748b',
      fontSize: 11,
      fontFamily: 'monospace',
    },
  },
  line: {
    itemStyle: {
      borderWidth: 2,
    },
    lineStyle: {
      width: 2.5,
    },
    symbolSize: 6,
    symbol: 'circle',
    smooth: true,
  },
  bar: {
    itemStyle: {
      borderRadius: [4, 4, 0, 0],
    },
  },
  grid: {
    top: 32,
    right: 16,
    bottom: 24,
    left: 48,
    containLabel: false,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.12)',
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#94a3b8',
      fontSize: 10,
      fontFamily: 'monospace',
    },
    splitLine: {
      show: false,
    },
  },
  valueAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#94a3b8',
      fontSize: 10,
      fontFamily: 'monospace',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.06)',
        type: 'dashed',
      },
    },
  },
  legend: {
    top: 0,
    right: 8,
    textStyle: {
      color: '#94a3b8',
      fontSize: 11,
      fontFamily: 'monospace',
    },
    itemWidth: 12,
    itemHeight: 8,
    itemGap: 14,
    icon: 'roundRect',
  },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    padding: [10, 14],
    textStyle: {
      color: '#f8fafc',
      fontSize: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", monospace',
    },
    extraCssText: 'backdrop-filter: blur(16px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); border-radius: 12px;',
    axisPointer: {
      type: 'cross',
      lineStyle: {
        color: 'rgba(0, 122, 255, 0.4)',
        type: 'dashed',
        width: 1,
      },
      crossStyle: {
        color: 'rgba(0, 122, 255, 0.4)',
      },
      label: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        fontFamily: 'monospace',
        fontSize: 10,
        borderRadius: 4,
      },
    },
  },
  dataZoom: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    dataBackgroundColor: 'rgba(0, 122, 255, 0.15)',
    fillerColor: 'rgba(0, 122, 255, 0.25)',
    handleColor: '#007AFF',
    handleSize: '100%',
    textStyle: {
      color: '#94a3b8',
      fontFamily: 'monospace',
      fontSize: 10,
    },
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
};

// Register custom theme once
let isThemeRegistered = false;
export function registerOpenCpoTheme(): void {
  if (!isThemeRegistered) {
    echarts.registerTheme('opencpo-dark', openCpoDarkTheme);
    isThemeRegistered = true;
  }
}

/**
 * Creates a vertical gradient fill for area charts
 */
export function createAreaGradient(
  colorHex: string,
  topOpacity = 0.35,
  bottomOpacity = 0.0
): echarts.graphic.LinearGradient {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: hexToRgba(colorHex, topOpacity) },
    { offset: 1, color: hexToRgba(colorHex, bottomOpacity) },
  ]);
}

/**
 * Creates a glowing line style configuration
 */
export function createGlowLine(
  colorHex: string,
  width = 2.5,
  glowBlur = 10
): {
  color: string;
  width: number;
  shadowColor: string;
  shadowBlur: number;
} {
  return {
    color: colorHex,
    width,
    shadowColor: hexToRgba(colorHex, 0.6),
    shadowBlur: glowBlur,
  };
}

/**
 * Converts Hex string (#RRGGBB) to rgba string
 */
export function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const r = parseInt(cleaned.substring(0, 2), 16) || 0;
  const g = parseInt(cleaned.substring(2, 4), 16) || 0;
  const b = parseInt(cleaned.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
