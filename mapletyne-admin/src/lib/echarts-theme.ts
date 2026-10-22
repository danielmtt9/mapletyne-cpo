import * as echarts from 'echarts';

/**
 * OpenCPO Luxury Material / Tabler Dark & Light Themes for Apache ECharts
 * Designed for real-time EV charging telemetry, grid management, and financial ledgers.
 * No glassmorphism; solid Google Material / Tabler elevation surfaces.
 */

export const OPENCPO_DARK_PALETTE = [
  '#10B981', // Emerald Mint (Primary / Solar / Ready)
  '#38BDF8', // Electric Azure (Grid / EV Load)
  '#F59E0B', // Amber Alert (BESS Storage / Peak Demand)
  '#A78BFA', // Purple Telematics (Fleet Dispatches)
  '#06B6D4', // Cyan Hydro (Building Base Load)
  '#EC4899', // Magenta (Tariff Retail Margin)
  '#EF4444', // Rose Coral (Grid Overload / Idle Penalties)
  '#14B8A6', // Teal (OCPI Roaming)
];

export const OPENCPO_LIGHT_PALETTE = [
  '#006948', // Deep Forest Emerald (Primary)
  '#0284C7', // Electric Blue (Load / Dispensing)
  '#D97706', // Amber (Demand / Storage)
  '#7C3AED', // Purple (Fleet)
  '#0891B2', // Cyan (Base Load)
  '#DB2777', // Pink (Margin)
  '#DC2626', // Red (Alerts / Faults)
  '#0D9488', // Teal (Roaming)
];

export const openCpoDarkTheme = {
  color: OPENCPO_DARK_PALETTE,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#94a3b8',
    fontSize: 12,
  },
  title: {
    textStyle: {
      color: '#f8fafc',
      fontSize: 16,
      fontWeight: 600,
      fontFamily: '"Inter", sans-serif',
    },
    subtextStyle: {
      color: '#64748b',
      fontSize: 12,
      fontFamily: '"IBM Plex Mono", monospace',
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
    bottom: 28,
    left: 48,
    containLabel: false,
    borderColor: '#334155',
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#334155',
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#cbd5e1',
      fontSize: 12,
      fontFamily: '"IBM Plex Mono", monospace',
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
      color: '#cbd5e1',
      fontSize: 12,
      fontFamily: '"IBM Plex Mono", monospace',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#1e293b',
        type: 'dashed',
      },
    },
  },
  legend: {
    top: 0,
    right: 8,
    textStyle: {
      color: '#cbd5e1',
      fontSize: 12,
      fontFamily: '"Inter", sans-serif',
    },
    itemWidth: 12,
    itemHeight: 8,
    itemGap: 14,
    icon: 'roundRect',
  },
  tooltip: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    padding: [10, 14],
    textStyle: {
      color: '#f8fafc',
      fontSize: 12,
      fontFamily: '"Inter", "IBM Plex Mono", sans-serif',
    },
    extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.2); border-radius: 8px;',
    axisPointer: {
      type: 'cross',
      lineStyle: {
        color: 'rgba(56, 189, 248, 0.5)',
        type: 'dashed',
        width: 1,
      },
      crossStyle: {
        color: 'rgba(56, 189, 248, 0.5)',
      },
      label: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: 12,
        borderRadius: 4,
      },
    },
  },
  dataZoom: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    dataBackgroundColor: 'rgba(56, 189, 248, 0.15)',
    fillerColor: 'rgba(56, 189, 248, 0.25)',
    handleColor: '#38BDF8',
    handleSize: '100%',
    textStyle: {
      color: '#cbd5e1',
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: 12,
    },
    borderColor: '#334155',
  },
};

export const openCpoLightTheme = {
  color: OPENCPO_LIGHT_PALETTE,
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#475569',
    fontSize: 12,
  },
  title: {
    textStyle: {
      color: '#0f172a',
      fontSize: 16,
      fontWeight: 600,
      fontFamily: '"Inter", sans-serif',
    },
    subtextStyle: {
      color: '#64748b',
      fontSize: 12,
      fontFamily: '"IBM Plex Mono", monospace',
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
    bottom: 28,
    left: 48,
    containLabel: false,
    borderColor: '#e2e8f0',
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#cbd5e1',
      },
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#475569',
      fontSize: 12,
      fontFamily: '"IBM Plex Mono", monospace',
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
      color: '#475569',
      fontSize: 12,
      fontFamily: '"IBM Plex Mono", monospace',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#e2e8f0',
        type: 'dashed',
      },
    },
  },
  legend: {
    top: 0,
    right: 8,
    textStyle: {
      color: '#475569',
      fontSize: 12,
      fontFamily: '"Inter", sans-serif',
    },
    itemWidth: 12,
    itemHeight: 8,
    itemGap: 14,
    icon: 'roundRect',
  },
  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    padding: [10, 14],
    textStyle: {
      color: '#0f172a',
      fontSize: 12,
      fontFamily: '"Inter", "IBM Plex Mono", sans-serif',
    },
    extraCssText: 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05); border-radius: 8px;',
    axisPointer: {
      type: 'cross',
      lineStyle: {
        color: 'rgba(2, 132, 199, 0.5)',
        type: 'dashed',
        width: 1,
      },
      crossStyle: {
        color: 'rgba(2, 132, 199, 0.5)',
      },
      label: {
        backgroundColor: '#f1f5f9',
        color: '#0f172a',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: 12,
        borderRadius: 4,
      },
    },
  },
  dataZoom: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    dataBackgroundColor: 'rgba(2, 132, 199, 0.15)',
    fillerColor: 'rgba(2, 132, 199, 0.25)',
    handleColor: '#0284C7',
    handleSize: '100%',
    textStyle: {
      color: '#475569',
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: 12,
    },
    borderColor: '#e2e8f0',
  },
};

// Register custom themes once
let isThemeRegistered = false;
export function registerOpenCpoTheme(): void {
  if (!isThemeRegistered) {
    echarts.registerTheme('opencpo-dark', openCpoDarkTheme);
    echarts.registerTheme('opencpo-light', openCpoLightTheme);
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
