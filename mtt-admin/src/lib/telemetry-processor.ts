/**
 * Telemetry Pre-Processing & Data Analytics Engine
 * Enforces strict zero/live states, O(1) ring buffering, and LTTB decimation.
 */

export interface TelemetryPoint {
  timestamp: number; // Unix timestamp in ms
  timeLabel: string; // 'HH:mm:ss'
  powerKw: number;   // Active Power in kW
  gridLimitKw?: number; // Optional dynamic grid limit
  voltageV?: number;
  currentA?: number;
  socPct?: number;
}

/**
 * Fixed-capacity circular ring buffer for real-time live telemetry streaming.
 * Prevents continuous allocation and memory leaks during 24/7 dashboard operations.
 */
export class TelemetryRingBuffer<T> {
  private buffer: (T | null)[];
  private capacity: number;
  private pointer: number = 0;
  private isFull: boolean = false;

  constructor(capacity: number = 120) {
    this.capacity = capacity;
    this.buffer = new Array<T | null>(capacity).fill(null);
  }

  public push(item: T): void {
    this.buffer[this.pointer] = item;
    this.pointer = (this.pointer + 1) % this.capacity;
    if (this.pointer === 0) {
      this.isFull = true;
    }
  }

  public toArray(): T[] {
    if (!this.isFull) {
      return this.buffer.slice(0, this.pointer).filter((x): x is T => x !== null);
    }
    return [
      ...this.buffer.slice(this.pointer),
      ...this.buffer.slice(0, this.pointer),
    ].filter((x): x is T => x !== null);
  }

  public clear(): void {
    this.buffer = new Array<T | null>(this.capacity).fill(null);
    this.pointer = 0;
    this.isFull = false;
  }

  public size(): number {
    return this.isFull ? this.capacity : this.pointer;
  }
}

/**
 * Aggregates multi-phase active power readings (Watts) into total Active Power (kW).
 */
export function aggregatePhasePower(
  wL1?: number | null,
  wL2?: number | null,
  wL3?: number | null,
  singlePhaseW?: number | null
): number {
  if (wL1 !== undefined && wL1 !== null) {
    const totalW = (wL1 || 0) + (wL2 || 0) + (wL3 || 0);
    return Number((totalW / 1000).toFixed(2));
  }
  if (singlePhaseW !== undefined && singlePhaseW !== null) {
    return Number((singlePhaseW / 1000).toFixed(2));
  }
  return 0.0;
}

/**
 * Largest Triangle Three Buckets (LTTB) downsampling algorithm.
 * Compresses dense historical time-series datasets into visual buckets
 * while strictly preserving peak spikes, deep sags, and critical transitions.
 */
export function lttbDecimate(
  data: [number, number][],
  threshold: number
): [number, number][] {
  const dataLen = data.length;
  if (threshold >= dataLen || threshold <= 2) {
    return data;
  }

  const sampled: [number, number][] = [];
  let sampledIndex = 0;
  const bucketSize = (dataLen - 2) / (threshold - 2);

  let a = 0;
  sampled[sampledIndex++] = data[a]; // Always add the first point

  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0;
    let avgY = 0;
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, dataLen);
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    if (avgRangeLength > 0) {
      for (let j = avgRangeStart; j < avgRangeEnd; j++) {
        avgX += data[j][0];
        avgY += data[j][1];
      }
      avgX /= avgRangeLength;
      avgY /= avgRangeLength;
    }

    const rangeOffs = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.min(Math.floor((i + 1) * bucketSize) + 1, dataLen);
    const pointAX = data[a][0];
    const pointAY = data[a][1];

    let maxArea = -1;
    let nextA = rangeOffs;

    for (let j = rangeOffs; j < rangeTo; j++) {
      const area =
        Math.abs(
          (pointAX - avgX) * (data[j][1] - pointAY) -
            (pointAX - data[j][0]) * (avgY - pointAY)
        ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        nextA = j;
      }
    }

    sampled[sampledIndex++] = data[nextA];
    a = nextA;
  }

  sampled[sampledIndex++] = data[dataLen - 1]; // Always add the last point
  return sampled;
}

/**
 * Generates formatted HH:mm:ss label from timestamp.
 */
export function formatTimeLabel(ts: number = Date.now()): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Creates an initial zero-state buffer of points (e.g. last 60 seconds at 0 kW).
 */
export function createZeroStateBuffer(points: number = 60, intervalSec: number = 2): TelemetryPoint[] {
  const now = Date.now();
  const res: TelemetryPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const ts = now - i * intervalSec * 1000;
    res.push({
      timestamp: ts,
      timeLabel: formatTimeLabel(ts),
      powerKw: 0.0,
      gridLimitKw: 250.0,
    });
  }
  return res;
}
