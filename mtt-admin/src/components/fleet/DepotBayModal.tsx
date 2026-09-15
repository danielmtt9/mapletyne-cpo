import React, { useState, useEffect } from 'react';
import type { DepotBayItem } from './DepotBayGrid';
import type { VehicleItem } from './VehicleModal';

interface DepotBayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: DepotBayItem | null;
  vehicles: VehicleItem[];
  isLoading?: boolean;
}

const BAY_TYPES = ['AC_OVERNIGHT', 'DC_FAST', 'HIGH_POWER_DC', 'PANTOGRAPH', 'EMERGENCY_RESERVE'];
const BAY_STATUSES = ['available', 'occupied', 'charging', 'reserved', 'faulted', 'maintenance'];

export const DepotBayModal: React.FC<DepotBayModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  vehicles,
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData);

  const [bayNumber, setBayNumber] = useState('');
  const [chargePointId, setChargePointId] = useState('CP-01');
  const [connectorId, setConnectorId] = useState<number>(1);
  const [bayType, setBayType] = useState('AC_OVERNIGHT');
  const [maxBayPowerKw, setMaxBayPowerKw] = useState<number>(22.0);
  const [assignedVehicleId, setAssignedVehicleId] = useState<number | ''>('');
  const [status, setStatus] = useState('available');

  useEffect(() => {
    if (initialData) {
      setBayNumber(initialData.bay_number || '');
      setChargePointId(initialData.charge_point_id || 'CP-01');
      setConnectorId(initialData.connector_id || 1);
      setBayType(initialData.bay_type || 'AC_OVERNIGHT');
      setMaxBayPowerKw(initialData.max_bay_power_kw || 22.0);
      setAssignedVehicleId(initialData.assigned_vehicle_id ?? '');
      setStatus(initialData.status || 'available');
    } else {
      setBayNumber('');
      setChargePointId('CP-01');
      setConnectorId(1);
      setBayType('AC_OVERNIGHT');
      setMaxBayPowerKw(22.0);
      setAssignedVehicleId('');
      setStatus('available');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      bay_number: bayNumber.trim().toUpperCase(),
      charge_point_id: chargePointId.trim(),
      connector_id: Number(connectorId),
      bay_type: bayType,
      max_bay_power_kw: Number(maxBayPowerKw),
      assigned_vehicle_id: assignedVehicleId === '' ? null : Number(assignedVehicleId),
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface-container-low border border-outline-variant/30 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">garage</span>
            <h3 className="font-headline text-base font-bold text-on-surface">
              {isEdit ? `Edit Bay ${initialData?.bay_number}` : 'Add Depot Charging Bay'}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-on-surface-variant font-medium block mb-1 uppercase tracking-wider">
              Bay Number / Label *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BAY-01"
              value={bayNumber}
              onChange={(e) => setBayNumber(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface font-mono font-bold uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-on-surface-variant font-medium block mb-1 uppercase tracking-wider">
                Charge Point ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CP-01"
                value={chargePointId}
                onChange={(e) => setChargePointId(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface font-mono"
              />
            </div>
            <div>
              <label className="text-on-surface-variant font-medium block mb-1 uppercase tracking-wider">
                Connector ID *
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={connectorId}
                onChange={(e) => setConnectorId(Number(e.target.value))}
                className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-on-surface-variant font-medium block mb-1 uppercase tracking-wider">
                Bay Type
              </label>
              <select
                value={bayType}
                onChange={(e) => setBayType(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
              >
                {BAY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-on-surface-variant font-medium block mb-1 uppercase tracking-wider">
                Max Bay Power (kW)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={maxBayPowerKw}
                onChange={(e) => setMaxBayPowerKw(Number(e.target.value))}
                className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-on-surface-variant font-medium block mb-1 uppercase tracking-wider">
              Assigned / Docked Vehicle
            </label>
            <select
              value={assignedVehicleId}
              onChange={(e) => setAssignedVehicleId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
            >
              <option value="">-- No vehicle assigned (Available) --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.unit_number ? `${v.unit_number} - ` : ''}{v.license_plate} ({v.make} {v.model})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-on-surface-variant font-medium block mb-1 uppercase tracking-wider">
              Bay Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
            >
              {BAY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-all flex items-center gap-1 shadow"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              {isLoading ? 'Saving...' : isEdit ? 'Update Bay' : 'Create Bay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
