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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl material-sheet bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 h-full p-6 overflow-y-auto space-y-5 shadow-2xl animate-in slide-in-from-right duration-300 font-body">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[24px]">ev_station</span>
              <h2 className="font-headline text-2xl font-bold text-slate-100">{charger.id}</h2>
              <span
                className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full border ${
                  isCharging
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : isOnline
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isFaulted
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}
              >
                {charger.status || 'Online'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              OCPP 2.0.1 • {charger.vendor || 'ABB'} {charger.model || 'Terra 360'} • Site: {charger.site || charger.city || 'Newcastle'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-700/80 rounded-xl font-mono text-xs">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'telemetry'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Telemetry
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'diagnostics'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OCPP 2.0.1 Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('control')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition-all ${
              activeTab === 'control'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200'
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
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-700/60 shadow-inner space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Firmware Version</span>
                <span className="text-sm font-bold text-slate-100">{charger.firmware_version || 'v2.4.12-rc3'}</span>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-700/60 shadow-inner space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Heartbeat Latency</span>
                <span className="text-sm font-bold text-emerald-400">142 ms (Healthy)</span>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-700/60 shadow-inner space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">Connector Lock State</span>
                <span className="text-sm font-bold text-cyan-300">Locked / Ready</span>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-700/60 shadow-inner space-y-1">
                <span className="text-slate-400 text-[10px] uppercase block">OCPP Protocol Dialect</span>
                <span className="text-sm font-bold text-primary">OCPP 2.0.1 (JSON/WSS)</span>
              </div>
            </div>

            {/* Self-Healing Watchdog Status */}
            <div className="material-card bg-slate-950/90 p-4 rounded-2xl border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Self-Healing Watchdog Engine
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  AUTONOMOUS ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Continuously evaluates connector lock anomalies and protocol faults. Executes Tier 1 (UnlockCable) followed by Tier 2 (SoftReboot) within 10s if unrecovered.
              </p>
            </div>

            {/* Device Model Variables Snapshot */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700/60 space-y-2">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">OCPP 2.0.1 Component Variables</span>
              <div className="space-y-1.5 divide-y divide-white/5 text-[11px]">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">ChargingStation.AvailabilityState:</span>
                  <span className="text-emerald-400 font-bold">{isOnline ? 'Available' : 'Unavailable'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">OCPPCommCtrl.HeartbeatInterval:</span>
                  <span className="text-slate-200 font-bold">60s</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">SmartChargingCtrl.PowerProfiles:</span>
                  <span className="text-slate-200 font-bold">Enabled (TxProfile)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Remote Operations & Throttling */}
        {activeTab === 'control' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Remote Operator Commands
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => onRemoteCommand('start', { connector_id: 1, id_tag: 'OPERATOR_DISPATCH' })}
                  className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  Remote Start
                </button>
                <button
                  onClick={() => onRemoteCommand('stop', { transaction_id: 1 })}
                  className="px-4 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">stop</span>
                  Remote Stop
                </button>
                <button
                  onClick={() => onRemoteCommand('unlock', { connector_id: 1 })}
                  className="px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl hover:border-primary transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_open</span>
                  Unlock Cable
                </button>
                <button
                  onClick={() => onRemoteCommand('reset', { reset_type: 'Soft' })}
                  className="px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl hover:border-rose-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  Soft Reboot OS
                </button>
                <button
                  onClick={() => onRemoteCommand('self-heal', { connector_id: 1 })}
                  className="col-span-2 px-4 py-2.5 bg-primary/10 border border-primary/40 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">healing</span>
                  Trigger Tiered Self-Healing Sequence (Tier 1 + 2)
                </button>
              </div>
            </div>

            {/* Smart Power Limit Stepper */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-700/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Dynamic Smart Power Throttling
              </h4>
              <p className="text-xs text-slate-400 font-sans">
                Set dynamic max charging power setpoint via OCPP 2.0.1 SetChargingProfile.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 flex-1">
                  <input
                    type="number"
                    min="3"
                    max="350"
                    value={smartPowerLimit}
                    onChange={(e) => setSmartPowerLimit(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-mono text-slate-100 font-bold focus:outline-none"
                  />
                  <span className="text-xs font-mono text-slate-400 ml-1">kW</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSmartPowerLimit((prev) => Math.max(3, prev - 10))}
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartPowerLimit((prev) => Math.min(350, prev + 10))}
                    className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
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
                  className="px-4 py-2 bg-primary text-slate-950 font-bold rounded-xl hover:brightness-110 transition-all shadow-apple-sm"
                >
                  Set Limit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-4 border-t border-white/10 font-mono text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
