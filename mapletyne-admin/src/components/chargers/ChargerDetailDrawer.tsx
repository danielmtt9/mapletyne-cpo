import React, { useState } from 'react';
import { ChargerTelemetryView } from './ChargerTelemetryView';

interface ChargerDetailDrawerProps {
  charger: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRemoteCommand: (action: string, params?: any, body?: any) => void;
}

export const ChargerDetailDrawer: React.FC<ChargerDetailDrawerProps> = ({
  charger,
  isOpen,
  onClose,
  onRemoteCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'diagnostics' | 'control'>('telemetry');
  const [smartPowerLimit, setSmartPowerLimit] = useState<number>(150);

  if (!isOpen || !charger) return null;

  const isOnline = charger.status === 'online' || charger.status === 'Available' || charger.status === 'Charging';
  const isCharging = charger.status === 'Charging';
  const isFaulted = charger.status === 'Faulted';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 animate-in fade-in duration-150">
      <div className="w-full max-w-xl tabler-sheet bg-surface-container border-l border-outline h-full p-6 overflow-y-auto space-y-5 shadow-2xl animate-in slide-in-from-right duration-300 font-body">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[24px]">ev_station</span>
              <h2 className="font-headline text-xl font-bold text-on-surface">{charger.id}</h2>
              <span
                className={`px-2.5 py-0.5 text-micro font-mono font-bold uppercase rounded-full border ${
                  isCharging
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/40'
                    : isOnline
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                    : isFaulted
                    ? 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40'
                    : 'bg-surface-container-high text-on-surface-variant border-outline'
                }`}
              >
                {charger.status || 'Online'}
              </span>
            </div>
            <p className="text-xs font-mono text-on-surface-variant">
              OCPP 2.0.1 • {charger.vendor || 'ABB'} {charger.model || 'Terra 360'} • Site: {charger.site || charger.city || 'Newcastle'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-surface-container-high border border-outline rounded-xl font-sans text-sm">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Live Telemetry
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            OCPP 2.0.1 Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('control')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'control'
                ? 'bg-surface-container text-primary font-bold shadow-xs border border-outline'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Remote Operations
          </button>
        </div>

        {/* Tab 1: Live Electrical Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <ChargerTelemetryView
              chargerId={charger.id}
              maxPowerKw={charger.max_power_kw || 150}
              status={charger.status}
              vendor={charger.vendor}
              model={charger.model}
            />
          </div>
        )}

        {/* Tab 2: OCPP Diagnostics & Device Model */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-high p-3.5 rounded-2xl border border-outline shadow-inner space-y-1">
                <span className="text-on-surface-variant text-xs uppercase block">Firmware Version</span>
                <span className="text-sm font-bold text-on-surface">{charger.firmware_version || 'v2.4.12-rc3'}</span>
              </div>
              <div className="bg-surface-container-high p-3.5 rounded-2xl border border-outline shadow-inner space-y-1">
                <span className="text-on-surface-variant text-xs uppercase block">Heartbeat Latency</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">142 ms (Healthy)</span>
              </div>
              <div className="bg-surface-container-high p-3.5 rounded-2xl border border-outline shadow-inner space-y-1">
                <span className="text-on-surface-variant text-xs uppercase block">Connector Lock State</span>
                <span className="text-sm font-bold text-blue-600 dark:text-cyan-300">Locked / Ready</span>
              </div>
              <div className="bg-surface-container-high p-3.5 rounded-2xl border border-outline shadow-inner space-y-1">
                <span className="text-on-surface-variant text-xs uppercase block">OCPP Protocol Dialect</span>
                <span className="text-sm font-bold text-primary">OCPP 2.0.1 (JSON/WSS)</span>
              </div>
            </div>

            {/* Self-Healing Watchdog Status */}
            <div className="tabler-card bg-surface-container-high p-4 rounded-2xl border border-outline space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Self-Healing Watchdog Engine
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  AUTONOMOUS ACTIVE
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-sans">
                Continuously evaluates connector lock anomalies and protocol faults. Executes Tier 1 (UnlockCable) followed by Tier 2 (SoftReboot) within 10s if unrecovered.
              </p>
            </div>

            {/* Device Model Variables Snapshot */}
            <div className="bg-surface-container-high p-4 rounded-2xl border border-outline space-y-2">
              <span className="text-xs uppercase text-on-surface-variant font-bold block">OCPP 2.0.1 Component Variables</span>
              <div className="space-y-1.5 divide-y divide-outline text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">ChargingStation.AvailabilityState:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{isOnline ? 'Available' : 'Unavailable'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">OCPPCommCtrl.HeartbeatInterval:</span>
                  <span className="text-on-surface font-bold">60s</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">SmartChargingCtrl.PowerProfiles:</span>
                  <span className="text-on-surface font-bold">Enabled (TxProfile)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Remote Operations & Throttling */}
        {activeTab === 'control' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Remote Operator Commands
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => onRemoteCommand('start', { connector_id: 1, id_tag: 'OPERATOR_DISPATCH' })}
                  className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  Remote Start
                </button>
                <button
                  onClick={() => onRemoteCommand('stop', { transaction_id: 1 })}
                  className="px-4 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-rose-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">stop</span>
                  Remote Stop
                </button>
                <button
                  onClick={() => onRemoteCommand('unlock', { connector_id: 1 })}
                  className="px-4 py-2.5 bg-surface-container-high border border-outline text-on-surface rounded-xl hover:border-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_open</span>
                  Unlock Cable
                </button>
                <button
                  onClick={() => onRemoteCommand('reset', { reset_type: 'Soft' })}
                  className="px-4 py-2.5 bg-surface-container-high border border-outline text-on-surface rounded-xl hover:border-rose-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  Soft Reboot OS
                </button>
                <button
                  onClick={() => onRemoteCommand('self-heal', { connector_id: 1 })}
                  className="col-span-2 px-4 py-2.5 bg-primary/10 border border-primary/40 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">healing</span>
                  Trigger Tiered Self-Healing Sequence (Tier 1 + 2)
                </button>
              </div>
            </div>

            {/* Smart Power Limit Stepper */}
            <div className="bg-surface-container-high p-4 rounded-2xl border border-outline space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Dynamic Smart Power Throttling
              </h4>
              <p className="text-xs text-on-surface-variant font-sans">
                Set dynamic max charging power setpoint via OCPP 2.0.1 SetChargingProfile.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-surface-container border border-outline rounded-xl px-3 py-1.5 flex-1">
                  <input
                    type="number"
                    min="3"
                    max="350"
                    value={smartPowerLimit}
                    onChange={(e) => setSmartPowerLimit(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-mono text-on-surface font-bold focus:outline-none"
                  />
                  <span className="text-xs font-mono text-on-surface-variant ml-1">kW</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSmartPowerLimit((prev) => Math.max(3, prev - 10))}
                    className="p-2 rounded-lg bg-surface-container border border-outline text-on-surface hover:bg-surface-container-highest cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartPowerLimit((prev) => Math.min(350, prev + 10))}
                    className="p-2 rounded-lg bg-surface-container border border-outline text-on-surface hover:bg-surface-container-highest cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onRemoteCommand('profile', undefined, {
                      limit_kw: smartPowerLimit,
                      connector_id: 1,
                      duration_seconds: 0,
                    })
                  }
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:opacity-95 transition-all shadow-sm cursor-pointer"
                >
                  Set Limit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-outline font-mono text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-container-high border border-outline rounded-xl text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
