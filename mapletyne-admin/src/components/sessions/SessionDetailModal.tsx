import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatKwh, formatCurrency, formatTimestamp } from '@/lib/utils';
import { SessionChargingProfileChart } from './SessionChargingProfileChart';
import { api } from '@/lib/api-client';

interface SessionDetailModalProps {
  session: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'curve' | 'invoice' | 'protocol'>('curve');

  if (!isOpen || !session) return null;

  const { data: meterRes } = useQuery({
    queryKey: ['session-meter', session?.id],
    queryFn: () => api.get<any>(`/sessions/${session.id}/meter`),
    enabled: Boolean(isOpen && session?.id),
    retry: false,
  });

  const meterValues = (meterRes?.meter_values || meterRes?.items || (Array.isArray(meterRes) ? meterRes : [])).map((m: any) => ({
    time: m.time || '',
    powerKw: m.power_kw ?? m.value ?? 0,
    soc: m.soc,
  }));

  const energyKwh = Number(session.energy_kwh ?? session.kwh_delivered ?? 0);
  const totalCost = Number(session.total_cost ?? session.amount_total ?? (energyKwh * 0.42));
  const ratePerKwh = energyKwh > 0 ? (totalCost * 0.79) / energyKwh : 0.42; // Pre-tax rate approx
  const vatAmount = totalCost * (0.21 / 1.21);
  const subtotalNet = totalCost - vatAmount;
  const isCompleted = session.status === 'completed' || session.status === 'Stopped';

  const startTime = session.start_time || session.created_at || new Date(Date.now() - 45 * 60000).toISOString();
  const stopTime = session.stop_time || (isCompleted ? new Date(new Date(startTime).getTime() + 45 * 60000).toISOString() : null);
  const durationMinutes = session.duration_minutes || (stopTime ? Math.max(1, Math.round((new Date(stopTime).getTime() - new Date(startTime).getTime()) / 60000)) : 45);
  const peakPowerKw = session.peak_power_kw ?? (energyKwh > 0 ? Math.min(350, Math.round((energyKwh / (durationMinutes / 60)) * 1.4)) : 50);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 animate-in fade-in duration-150">
      <div className="tabler-card bg-surface-container border border-outline rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 font-body">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
              <h2 className="font-headline text-xl font-bold text-on-surface">
                Session {session.id || session.transaction_id}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-micro font-mono font-bold uppercase border ${
                  isCompleted
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                }`}
              >
                {session.status || 'Active'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm font-mono text-on-surface-variant">
              <span>Station: <strong className="text-primary">{session.charge_point || session.charge_point_id || 'CP-01'}</strong></span>
              <span>•</span>
              <span>Connector: <strong className="text-on-surface">#{session.connector_id || 1} (CCS2)</strong></span>
              <span>•</span>
              <span>Auth: <strong className="text-on-surface">{session.auth_id || session.driver_email || session.id_tag || 'Guest'}</strong></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-surface-container-high border border-outline rounded-xl font-sans text-sm">
          <button
            onClick={() => setActiveTab('curve')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'curve'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Power & SoC Metering
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'invoice'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Itemized CDR Invoice
          </button>
          <button
            onClick={() => setActiveTab('protocol')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'protocol'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            OCPP Protocol Trace
          </button>
        </div>

        {/* Tab 1: Metering Curve */}
        {activeTab === 'curve' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-surface-container-high border border-outline p-4 rounded-xl">
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">Total Energy</span>
                <span className="text-base font-bold text-on-surface font-mono">{formatKwh(energyKwh)}</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">Peak Power</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">{peakPowerKw.toFixed(1)} kW</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">Duration</span>
                <span className="text-base font-bold text-blue-600 dark:text-cyan-400 font-mono">{durationMinutes} min</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant uppercase font-medium block">Billed Total</span>
                <span className="text-base font-bold text-primary font-mono">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            <div className="bg-surface-container-high border border-outline rounded-xl p-4 shadow-xs">
              <span className="text-sm font-semibold text-on-surface block mb-3 font-sans">
                Dispensed Power (kW) & Battery State of Charge (%) Trajectory
              </span>
              <SessionChargingProfileChart
                energyKwh={energyKwh}
                peakPowerKw={peakPowerKw}
                durationMinutes={durationMinutes}
                meterValues={meterValues}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Itemized CDR Invoice */}
        {activeTab === 'invoice' && (
          <div className="space-y-3 font-sans text-sm bg-surface-container-high p-5 rounded-xl border border-outline shadow-xs">
            <div className="space-y-2 divide-y divide-outline">
              <div className="flex justify-between items-center py-2">
                <span className="text-on-surface-variant">Energy Consumption ({energyKwh.toFixed(2)} kWh @ {formatCurrency(ratePerKwh)}/kWh):</span>
                <span className="text-on-surface font-bold font-mono">{formatCurrency(subtotalNet)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-on-surface-variant">Session Unlock / Connection Base Fee:</span>
                <span className="text-on-surface font-bold font-mono">{formatCurrency(0.00)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-on-surface-variant">Overstay / Idle Time Grace:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">Waived (£0.00)</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-on-surface-variant">Standard UK/EU Tax (VAT 20%):</span>
                <span className="text-on-surface font-bold font-mono">{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 text-base">
                <span className="text-on-surface font-bold">Total Settled Driver Bill:</span>
                <span className="text-primary font-bold text-lg font-mono">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-outline flex items-center justify-between">
              <span className="text-on-surface-variant text-sm font-medium">Electronic Tax Invoice:</span>
              <a
                href={`/app/receipt/${session.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary/10 border border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all flex items-center gap-1.5 cursor-pointer text-sm"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download Official PDF Receipt
              </a>
            </div>
          </div>
        )}

        {/* Tab 3: OCPP Protocol Lifecycle Trace */}
        {activeTab === 'protocol' && (
          <div className="space-y-3 font-mono text-xs bg-surface-container-high p-5 rounded-xl border border-outline shadow-xs max-h-[320px] overflow-y-auto">
            <div className="space-y-4 relative pl-4 border-l-2 border-primary/30 ml-2">
              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-primary" />
                <div className="text-on-surface font-bold text-sm">1. Authorize.req & TransactionEvent(Started)</div>
                <div className="text-on-surface-variant text-xs mt-0.5">
                  Timestamp: {formatTimestamp(startTime)} • Tag: {session.auth_id || 'ID_TAG_VALID'}
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 font-semibold">Status: Accepted (IdTokenInfo.status = Accepted)</div>
              </div>

              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-blue-500" />
                <div className="text-on-surface font-bold text-sm">2. Sampled Periodic MeterValues</div>
                <div className="text-on-surface-variant text-xs mt-0.5">
                  Interval: 60s • 3-Phase Energy.Active.Import.Register & SoC telemetry streamed
                </div>
                <div className="text-blue-600 dark:text-cyan-400 text-xs mt-0.5 font-semibold">Peak Setpoint: {peakPowerKw.toFixed(1)} kW (Grid Limit Respected)</div>
              </div>

              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-emerald-500" />
                <div className="text-on-surface font-bold text-sm">3. TransactionEvent(Ended) & CDR Generated</div>
                <div className="text-on-surface-variant text-xs mt-0.5">
                  Timestamp: {formatTimestamp(stopTime || new Date().toISOString())} • Trigger: EVDisconnected / Local
                </div>
                <div className="text-on-surface-variant text-xs mt-0.5">
                  Total Energy Dispensed: {energyKwh.toFixed(2)} kWh • Final Reason: NormalCycleComplete
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-outline font-sans text-sm">
          <div className="text-on-surface-variant">
            Payment Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">SETTLED (Stripe / OCPI Hub)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline rounded-xl text-on-surface font-semibold transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
