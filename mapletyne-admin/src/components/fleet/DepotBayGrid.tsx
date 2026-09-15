import React from 'react';

export interface DepotBayItem {
  id: number;
  site_id: string;
  bay_number: string;
  charge_point_id: string;
  connector_id: number;
  bay_type: string;
  max_bay_power_kw: number;
  assigned_vehicle_id?: number;
  status: string;
  charger_model?: string;
  charger_status?: string;
  license_plate?: string;
  unit_number?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  battery_capacity_kwh?: number;
  priority_tier?: number;
  current_soc_pct?: number;
  is_plugged_in?: boolean;
}

interface DepotBayGridProps {
  bays: DepotBayItem[];
  onSelectBay?: (bay: DepotBayItem) => void;
  onDispatchProfile?: (bay: DepotBayItem) => void;
}

export const DepotBayGrid: React.FC<DepotBayGridProps> = ({
  bays,
  onSelectBay,
  onDispatchProfile,
}) => {
  if (bays.length === 0) {
    return (
      <div className="p-8 text-center material-card bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-300">
        <span className="material-symbols-outlined text-[36px] text-slate-500 mb-2">garage</span>
        <p className="text-sm font-semibold text-white">No Charging Bays Configured for this Depot</p>
        <p className="text-xs text-slate-400 mt-1">Configure charging bays to assign vehicles and visualize power distribution.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string, isPluggedIn?: boolean) => {
    if (status === 'charging' || isPluggedIn) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          Charging
        </span>
      );
    }
    if (status === 'occupied') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/40 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Docked
        </span>
      );
    }
    if (status === 'faulted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-red-500/15 text-red-300 border border-red-500/40 rounded-full shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          Faulted
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/40 rounded-full shrink-0">
        Available
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {bays.map((bay) => {
        const hasVehicle = Boolean(bay.license_plate);
        const soc = bay.current_soc_pct ?? 50;

        return (
          <div
            key={bay.id}
            className={`material-card bg-slate-900/90 border transition-all hover:border-primary/60 rounded-2xl flex flex-col justify-between p-4 shadow-md ${
              bay.status === 'charging'
                ? 'border-emerald-500/50 shadow-emerald-950/30'
                : 'border-slate-700/80'
            }`}
          >
            {/* Bay Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                    {bay.bay_number}
                  </span>
                  <span className="text-[11px] font-mono text-slate-300 font-medium">
                    {bay.max_bay_power_kw} kW {bay.bay_type.replace('_', ' ')}
                  </span>
                </div>
                {getStatusBadge(bay.status, bay.is_plugged_in)}
              </div>

              {/* Charger Mapping */}
              <div className="text-xs text-slate-300 flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="flex items-center gap-1.5 font-mono text-white font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-primary">ev_charger</span>
                  {bay.charge_point_id} (P{bay.connector_id})
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {bay.charger_status || 'Online'}
                </span>
              </div>

              {/* Vehicle Info */}
              {hasVehicle ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Indestructible License Plate Badge */}
                      <div className="inline-flex items-center gap-1.5 whitespace-nowrap mb-1">
                        {bay.unit_number && (
                          <span className="px-1.5 py-0.5 bg-primary/15 border border-primary/40 text-primary font-mono font-bold text-[11px] rounded">
                            {bay.unit_number}
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs tracking-wider rounded uppercase">
                          {bay.license_plate}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 truncate font-medium">
                        {bay.vehicle_make} {bay.vehicle_model}
                      </div>
                    </div>
                    {bay.priority_tier && (
                      <span className="text-[10px] px-2 py-0.5 bg-slate-950 font-mono border border-slate-700 text-amber-300 font-bold rounded shrink-0">
                        Tier {bay.priority_tier}
                      </span>
                    )}
                  </div>

                  {/* Battery State Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px] text-primary">battery_charging_full</span>
                        Live SOC
                      </span>
                      <span className="font-mono font-bold text-white">{soc}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          soc > 70 ? 'bg-emerald-400' : soc > 30 ? 'bg-blue-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(100, soc)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center border border-dashed border-slate-750 bg-slate-950/50 rounded-xl text-xs text-slate-400">
                  <span className="material-symbols-outlined text-[22px] text-slate-500 block mb-1">directions_car</span>
                  No Vehicle Docked
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-3 text-xs">
              <button
                type="button"
                onClick={() => onSelectBay?.(bay)}
                className="text-primary hover:text-primary-container flex items-center gap-1 font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span> Bay Setup
              </button>

              {onDispatchProfile && (
                <button
                  type="button"
                  onClick={() => onDispatchProfile(bay)}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px] text-primary">tune</span> Smart Limit
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
