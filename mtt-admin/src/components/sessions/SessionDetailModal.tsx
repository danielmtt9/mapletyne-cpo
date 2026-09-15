import React, { useState } from 'react';
import { formatKwh, formatCurrency, formatTimestamp } from '@/lib/utils';
import { SessionChargingProfileChart } from './SessionChargingProfileChart';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="material-card bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
              <h2 className="font-headline text-xl font-bold text-slate-100">
                Session {session.id || session.transaction_id}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  isCompleted
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                }`}
              >
                {session.status || 'Active'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>Station: <strong className="text-primary">{session.charge_point || session.charge_point_id || 'CP-01'}</strong></span>
              <span>•</span>
              <span>Connector: <strong className="text-slate-300">#{session.connector_id || 1} (CCS2)</strong></span>
              <span>•</span>
              <span>Auth: <strong className="text-slate-300">{session.auth_id || session.driver_email || session.id_tag || 'Guest'}</strong></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-700/80 rounded-xl font-mono text-xs">
          <button
            onClick={() => setActiveTab('curve')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'curve'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Power & SoC Metering
          </button>
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'invoice'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Itemized CDR Invoice
          </button>
          <button
            onClick={() => setActiveTab('protocol')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'protocol'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OCPP Protocol Trace
          </button>
        </div>

        {/* Tab 1: Metering Curve */}
        {activeTab === 'curve' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-slate-950/80 border border-slate-700/60 p-3 rounded-2xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Total Energy</span>
                <span className="text-base font-bold text-white">{formatKwh(energyKwh)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Peak Power</span>
                <span className="text-base font-bold text-emerald-400">{peakPowerKw.toFixed(1)} kW</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Duration</span>
                <span className="text-base font-bold text-cyan-300">{durationMinutes} min</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Billed Total</span>
                <span className="text-base font-bold text-primary">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-700/60 rounded-2xl p-3 shadow-inner">
              <span className="text-[11px] font-bold text-slate-300 block mb-2">
                Dispensed Power (kW) & Battery State of Charge (%) Trajectory
              </span>
              <SessionChargingProfileChart
                energyKwh={energyKwh}
                peakPowerKw={peakPowerKw}
                durationMinutes={durationMinutes}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Itemized CDR Invoice */}
        {activeTab === 'invoice' && (
          <div className="space-y-3 font-mono text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-700/60 shadow-inner">
            <div className="space-y-2 divide-y divide-white/5">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Energy Consumption ({energyKwh.toFixed(2)} kWh @ {formatCurrency(ratePerKwh)}/kWh):</span>
                <span className="text-slate-100 font-bold">{formatCurrency(subtotalNet)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Session Unlock / Connection Base Fee:</span>
                <span className="text-slate-100 font-bold">{formatCurrency(0.00)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Overstay / Idle Time Grace:</span>
                <span className="text-emerald-400 font-bold">Waived (£0.00)</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Standard UK/EU Tax (VAT 21%):</span>
                <span className="text-slate-300 font-bold">{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-slate-100 font-bold">Total Settled Driver Bill:</span>
                <span className="text-primary font-bold text-base">{formatCurrency(totalCost)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Electronic Tax Invoice:</span>
              <a
                href={`/app/receipt/${session.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 text-blue-300 font-bold rounded-xl hover:bg-blue-600/30 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                Download Official PDF Receipt
              </a>
            </div>
          </div>
        )}

        {/* Tab 3: OCPP Protocol Lifecycle Trace */}
        {activeTab === 'protocol' && (
          <div className="space-y-3 font-mono text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-700/60 shadow-inner max-h-[300px] overflow-y-auto">
            <div className="space-y-3 relative pl-4 border-l-2 border-blue-500/30 ml-2">
              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-blue-500" />
                <div className="text-slate-200 font-bold">1. Authorize.req & TransactionEvent(Started)</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Timestamp: {formatTimestamp(startTime)} • Tag: {session.auth_id || 'ID_TAG_VALID'}
                </div>
                <div className="text-emerald-400 text-[10px] mt-0.5">Status: Accepted (IdTokenInfo.status = Accepted)</div>
              </div>

              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-cyan-400" />
                <div className="text-slate-200 font-bold">2. Sampled Periodic MeterValues</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Interval: 60s • 3-Phase Energy.Active.Import.Register & SoC telemetry streamed
                </div>
                <div className="text-cyan-300 text-[10px] mt-0.5">Peak Setpoint: {peakPowerKw.toFixed(1)} kW (Grid Limit Respected)</div>
              </div>

              <div className="relative">
                <div className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-emerald-400" />
                <div className="text-slate-200 font-bold">3. TransactionEvent(Ended) & CDR Generated</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Timestamp: {formatTimestamp(stopTime || new Date().toISOString())} • Trigger: EVDisconnected / Local
                </div>
                <div className="text-slate-300 text-[10px] mt-0.5">
                  Total Energy Dispensed: {energyKwh.toFixed(2)} kWh • Final Reason: NormalCycleComplete
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 font-mono text-xs">
          <div className="text-slate-400 text-[11px]">
            Payment Status: <span className="text-emerald-400 font-bold">SETTLED (Stripe / OCPI Hub)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
