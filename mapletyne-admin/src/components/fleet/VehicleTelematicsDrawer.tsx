import React, { useState } from 'react';
import type { VehicleItem } from './VehicleModal';

interface VehicleTelematicsDrawerProps {
  vehicle: VehicleItem | null;
  onClose: () => void;
  onSyncTelematics: (vehicleId: number, data: any) => Promise<void>;
}

export const VehicleTelematicsDrawer: React.FC<VehicleTelematicsDrawerProps> = ({
  vehicle,
  onClose,
  onSyncTelematics,
}) => {
  if (!vehicle) return null;

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSoc, setSyncSoc] = useState(vehicle.current_soc_pct?.toString() || '75');
  const [syncSoh, setSyncSoh] = useState(vehicle.battery_health_soh_pct?.toString() || '98');
  const [syncRange, setSyncRange] = useState(vehicle.estimated_range_km?.toString() || '220');
  const [syncOdo, setSyncOdo] = useState(vehicle.odometer_km?.toString() || '15400');
  const [isPlugged, setIsPlugged] = useState(vehicle.is_plugged_in ?? true);

  const handleManualSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle.id) return;
    setIsSyncing(true);
    try {
      await onSyncTelematics(vehicle.id, {
        current_soc_pct: Number(syncSoc),
        battery_health_soh_pct: Number(syncSoh),
        estimated_range_km: Number(syncRange),
        odometer_km: Number(syncOdo),
        is_plugged_in: isPlugged,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const soc = vehicle.current_soc_pct ?? 50;
  const soh = vehicle.battery_health_soh_pct ?? 98;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-surface-container-low border-l border-outline-variant/30 h-full flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20 bg-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">sensors</span>
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">
                {vehicle.license_plate} Telematics
              </h3>
              <p className="text-xs text-on-surface-variant font-mono">
                {vehicle.unit_number || 'No Unit ID'} • {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Live Gauges */}
        <div className="p-6 space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            {/* SOC */}
            <div className="p-4 bg-surface-container border border-outline-variant/30 text-center space-y-1">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                State of Charge (SOC)
              </span>
              <div className="text-3xl font-mono font-bold text-primary">{soc}%</div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full"
                  style={{ width: `${Math.min(100, soc)}%` }}
                ></div>
              </div>
            </div>

            {/* SOH */}
            <div className="p-4 bg-surface-container border border-outline-variant/30 text-center space-y-1">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                Battery Health (SOH)
              </span>
              <div className="text-3xl font-mono font-bold text-emerald-400">{soh}%</div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full"
                  style={{ width: `${Math.min(100, soh)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Metric Details */}
          <div className="space-y-3 bg-surface-container p-4 border border-outline-variant/20 text-xs">
            <div className="flex justify-between py-1 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Estimated Range</span>
              <span className="font-mono font-bold text-on-surface">
                {vehicle.estimated_range_km ? `${vehicle.estimated_range_km} km` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Odometer</span>
              <span className="font-mono font-bold text-on-surface">
                {vehicle.odometer_km ? `${vehicle.odometer_km.toLocaleString()} km` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Plugged In</span>
              <span className={`font-mono font-bold ${vehicle.is_plugged_in ? 'text-emerald-400' : 'text-slate-400'}`}>
                {vehicle.is_plugged_in ? 'YES (Connected)' : 'NO (Unplugged)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-outline-variant/20">
              <span className="text-on-surface-variant">Telematics Provider</span>
              <span className="font-mono text-on-surface uppercase font-semibold">
                {vehicle.telematics_provider || 'Manual'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-on-surface-variant">Last Synced</span>
              <span className="font-mono text-on-surface-variant">
                {vehicle.telematics_synced_at
                  ? new Date(vehicle.telematics_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Never'}
              </span>
            </div>
          </div>

          {/* Manual Telematics Push / Test Ingest */}
          <form onSubmit={handleManualSync} className="p-4 bg-surface-container-high/40 border border-outline-variant/30 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface uppercase tracking-wider">
              <span className="material-symbols-outlined text-primary text-[16px]">sync</span>
              Simulate / Push Telematics
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-on-surface-variant block mb-1">SOC (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={syncSoc}
                  onChange={(e) => setSyncSoc(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 text-on-surface font-mono"
                />
              </div>
              <div>
                <label className="text-on-surface-variant block mb-1">SOH (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={syncSoh}
                  onChange={(e) => setSyncSoh(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 text-on-surface font-mono"
                />
              </div>
              <div>
                <label className="text-on-surface-variant block mb-1">Est Range (km)</label>
                <input
                  type="number"
                  value={syncRange}
                  onChange={(e) => setSyncRange(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 text-on-surface font-mono"
                />
              </div>
              <div>
                <label className="text-on-surface-variant block mb-1">Odometer (km)</label>
                <input
                  type="number"
                  value={syncOdo}
                  onChange={(e) => setSyncOdo(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-2 py-1 text-on-surface font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPluggedCheck"
                checked={isPlugged}
                onChange={(e) => setIsPlugged(e.target.checked)}
                className="rounded text-primary focus:ring-0"
              />
              <label htmlFor="isPluggedCheck" className="text-xs text-on-surface font-medium cursor-pointer">
                Vehicle is docked and plugged in
              </label>
            </div>

            <button
              type="submit"
              disabled={isSyncing}
              className="w-full py-2 bg-primary text-on-primary font-semibold text-xs rounded hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
              {isSyncing ? 'Pushing Data...' : 'Sync Telematics Ingest'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
