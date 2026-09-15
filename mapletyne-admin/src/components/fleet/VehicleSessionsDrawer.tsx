import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';
import type { VehicleItem } from './VehicleModal';

interface VehicleSessionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleItem | null;
}

export const VehicleSessionsDrawer: React.FC<VehicleSessionsDrawerProps> = ({ isOpen, onClose, vehicle }) => {
  const { data: rawSessions, isLoading } = useQuery({
    queryKey: ['fleet', 'vehicles', vehicle?.id, 'sessions'],
    queryFn: () => api.get<any>(`/fleet/vehicles/${vehicle?.id}/sessions`),
    enabled: Boolean(isOpen && vehicle?.id),
  });

  const sessions = ensureArray<any>(rawSessions, 'sessions');

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface-container-low border-l border-outline-variant/30 h-full p-6 space-y-5 shadow-2xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">directions_car</span>
              <h2 className="font-headline text-lg font-bold text-on-surface">Vehicle Session Telemetry</h2>
            </div>
            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="bg-surface-container p-3 border border-outline-variant/20 space-y-1 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">License Plate:</span>
              <span className="text-on-surface font-bold">{vehicle.license_plate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Vehicle:</span>
              <span className="text-on-surface">{vehicle.make} {vehicle.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Connector:</span>
              <span className="text-secondary">{vehicle.connector_type || 'CCS2'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
              Charging Sessions ({sessions.length})
            </h3>

            {isLoading ? (
              <div className="p-6 text-center text-on-surface-variant font-mono text-xs">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center text-on-surface-variant font-mono text-xs bg-surface-container border border-outline-variant/20">
                No charging sessions registered for vehicle {vehicle.license_plate}.
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {sessions.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-3 bg-surface-container border border-outline-variant/20 space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">{s.charge_point || 'Charger'}</span>
                      <span className="text-primary font-bold">{Number(s.energy_kwh || 0).toFixed(2)} kWh</span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant flex justify-between">
                      <span>Connector: #{s.connector_id ?? 1}</span>
                      <span>Status: {s.status || 'completed'}</span>
                    </div>
                    <div className="text-[10px] text-on-surface-variant pt-1 border-t border-outline-variant/20 flex justify-between">
                      <span>Start:</span>
                      <span>{s.start_time ? new Date(s.start_time).toLocaleString() : '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-outline-variant/20 pt-3">
          <button
            onClick={onClose}
            className="w-full py-2 bg-surface-container border border-outline-variant/30 text-on-surface font-mono text-xs hover:bg-surface-container-high transition-colors"
          >
            Close Telemetry
          </button>
        </div>
      </div>
    </div>
  );
};
