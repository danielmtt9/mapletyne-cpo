import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ensureArray<T>(data: any, preferredKey?: string): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (preferredKey && Array.isArray(data[preferredKey])) return data[preferredKey];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.chargers)) return data.chargers;
  if (Array.isArray(data.sessions)) return data.sessions;
  if (Array.isArray(data.tariffs)) return data.tariffs;
  if (Array.isArray(data.tokens)) return data.tokens;
  if (Array.isArray(data.groups)) return data.groups;
  if (Array.isArray(data.vehicles)) return data.vehicles;
  if (Array.isArray(data.certificates)) return data.certificates;
  if (Array.isArray(data.parties)) return data.parties;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export function formatKw(kw: number | null | undefined): string {
  if (kw === null || kw === undefined) return '0.0 kW';
  return `${kw.toFixed(1)} kW`;
}

export function formatKwh(kwh: number | null | undefined): string {
  if (kwh === null || kwh === undefined) return '0.00 kWh';
  return `${kwh.toFixed(2)} kWh`;
}

export function formatCurrency(amount: number | null | undefined, currency = '£'): string {
  if (amount === null || amount === undefined) return `${currency}0.00`;
  return `${currency}${amount.toFixed(2)}`;
}

export function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}
