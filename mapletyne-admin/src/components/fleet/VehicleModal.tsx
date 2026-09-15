import React, { useState, useEffect } from 'react';

export interface VehicleItem {
  id?: number;
  license_plate: string;
  unit_number?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  connector_type?: string;
  status?: string;
  battery_capacity_kwh?: number;
  usable_battery_kwh?: number;
  max_ac_power_kw?: number;
  max_dc_power_kw?: number;
  priority_tier?: number;
  default_depot_site?: string;
  assigned_bay_id?: string;
  assigned_driver_name?: string;
  cost_center_code?: string;
  telematics_provider?: string;
  telematics_vehicle_id?: string;
  autocharge_mac?: string;
  pnc_cert_serial?: string;
  pnc_cert_status?: string;
  current_soc_pct?: number;
  battery_health_soh_pct?: number;
  estimated_range_km?: number;
  odometer_km?: number;
  latitude?: number;
  longitude?: number;
  is_plugged_in?: boolean;
  active_charge_session_id?: string;
  telematics_synced_at?: string;
  last_session_at?: string;
  created_at?: string;
}

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: VehicleItem | null;
  isLoading?: boolean;
}

const CONNECTOR_TYPES = ['CCS2', 'Type 2', 'CHAdeMO', 'Type 1', 'CCS1'];
const STATUSES = [
  { value: 'active', label: 'Active (Operational)' },
  { value: 'maintenance', label: 'Maintenance (Under Repair)' },
  { value: 'inactive', label: 'Inactive (Decommissioned)' },
];
const PRIORITY_TIERS = [
  { value: 1, label: 'Tier 1: Emergency & Priority VIP' },
  { value: 2, label: 'Tier 2: Fixed Route & Shift Delivery' },
  { value: 3, label: 'Tier 3: Flexible & General Duty' },
  { value: 4, label: 'Tier 4: Standby & Buffer' },
];
const TELEMATICS_PROVIDERS = ['manual', 'Geotab', 'Samsara', 'Verizon Connect', 'OBD-II', 'OEM Cloud'];
const PNC_STATUSES = ['none', 'active', 'pending', 'revoked'];

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData);
  const [activeTab, setActiveTab] = useState<'general' | 'battery' | 'depot' | 'telematics'>('general');

  // Form states
  const [licensePlate, setLicensePlate] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(2025);
  const [connectorType, setConnectorType] = useState('CCS2');
  const [status, setStatus] = useState('active');
  const [priorityTier, setPriorityTier] = useState<number>(2);

  // Battery & Power
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<number>(75.0);
  const [usableBatteryKwh, setUsableBatteryKwh] = useState<number>(70.0);
  const [maxAcPowerKw, setMaxAcPowerKw] = useState<number>(11.0);
  const [maxDcPowerKw, setMaxDcPowerKw] = useState<number>(150.0);

  // Depot & Operations
  const [defaultDepotSite, setDefaultDepotSite] = useState('default');
  const [assignedBayId, setAssignedBayId] = useState('');
  const [assignedDriverName, setAssignedDriverName] = useState('');
  const [costCenterCode, setCostCenterCode] = useState('');

  // Telematics & Auth
  const [telematicsProvider, setTelematicsProvider] = useState('manual');
  const [telematicsVehicleId, setTelematicsVehicleId] = useState('');
  const [autochargeMac, setAutochargeMac] = useState('');
  const [pncCertSerial, setPncCertSerial] = useState('');
  const [pncCertStatus, setPncCertStatus] = useState('none');

  useEffect(() => {
    if (initialData) {
      setLicensePlate(initialData.license_plate || '');
      setUnitNumber(initialData.unit_number || '');
      setVin(initialData.vin || '');
      setMake(initialData.make || '');
      setModel(initialData.model || '');
      setYear(initialData.year || 2025);
      setConnectorType(initialData.connector_type || 'CCS2');
      setStatus(initialData.status || 'active');
      setPriorityTier(initialData.priority_tier || 2);
      setBatteryCapacityKwh(initialData.battery_capacity_kwh || 75.0);
      setUsableBatteryKwh(initialData.usable_battery_kwh || 70.0);
      setMaxAcPowerKw(initialData.max_ac_power_kw || 11.0);
      setMaxDcPowerKw(initialData.max_dc_power_kw || 150.0);
      setDefaultDepotSite(initialData.default_depot_site || 'default');
      setAssignedBayId(initialData.assigned_bay_id || '');
      setAssignedDriverName(initialData.assigned_driver_name || '');
      setCostCenterCode(initialData.cost_center_code || '');
      setTelematicsProvider(initialData.telematics_provider || 'manual');
      setTelematicsVehicleId(initialData.telematics_vehicle_id || '');
      setAutochargeMac(initialData.autocharge_mac || '');
      setPncCertSerial(initialData.pnc_cert_serial || '');
      setPncCertStatus(initialData.pnc_cert_status || 'none');
    } else {
      setLicensePlate('');
      setUnitNumber('');
      setVin('');
      setMake('');
      setModel('');
      setYear(2025);
      setConnectorType('CCS2');
      setStatus('active');
      setPriorityTier(2);
      setBatteryCapacityKwh(75.0);
      setUsableBatteryKwh(70.0);
      setMaxAcPowerKw(11.0);
      setMaxDcPowerKw(150.0);
      setDefaultDepotSite('default');
      setAssignedBayId('');
      setAssignedDriverName('');
      setCostCenterCode('');
      setTelematicsProvider('manual');
      setTelematicsVehicleId('');
      setAutochargeMac('');
      setPncCertSerial('');
      setPncCertStatus('none');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      license_plate: licensePlate.trim().toUpperCase(),
      unit_number: unitNumber.trim() || undefined,
      vin: vin.trim().toUpperCase() || undefined,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      year: Number(year) || undefined,
      connector_type: connectorType,
      status,
      priority_tier: Number(priorityTier) || 2,
      battery_capacity_kwh: Number(batteryCapacityKwh) || 75.0,
      usable_battery_kwh: Number(usableBatteryKwh) || 70.0,
      max_ac_power_kw: Number(maxAcPowerKw) || 11.0,
      max_dc_power_kw: Number(maxDcPowerKw) || 150.0,
      default_depot_site: defaultDepotSite.trim() || undefined,
      assigned_bay_id: assignedBayId.trim() || undefined,
      assigned_driver_name: assignedDriverName.trim() || undefined,
      cost_center_code: costCenterCode.trim() || undefined,
      telematics_provider: telematicsProvider,
      telematics_vehicle_id: telematicsVehicleId.trim() || undefined,
      autocharge_mac: autochargeMac.trim().toLowerCase() || undefined,
      pnc_cert_serial: pncCertSerial.trim() || undefined,
      pnc_cert_status: pncCertStatus,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-surface-container-low border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-4 bg-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">local_shipping</span>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              {isEdit ? `Edit Vehicle — ${initialData?.license_plate}` : 'Register Multi-Tier Fleet Asset'}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/20 px-6 bg-surface-container-lowest gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">info</span> General Specs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('battery')}
            className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'battery'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">battery_charging_full</span> Battery & Power
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('depot')}
            className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'depot'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">garage</span> Depot & Routing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telematics')}
            className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'telematics'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">sensors</span> Telematics & PnC
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  License Plate *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRK-4089"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary uppercase font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Fleet Unit / Fleet ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. VAN-102"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  VIN (Vehicle Identification Number)
                </label>
                <input
                  type="text"
                  placeholder="17-character standard ISO VIN"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary uppercase font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Manufacturer / Make
                </label>
                <input
                  type="text"
                  placeholder="e.g. Volvo, Ford, Scania"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Model & Variant
                </label>
                <input
                  type="text"
                  placeholder="e.g. FH Electric 4x2"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Model Year
                </label>
                <input
                  type="number"
                  min="2015"
                  max="2035"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Connector Type
                </label>
                <select
                  value={connectorType}
                  onChange={(e) => setConnectorType(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  {CONNECTOR_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Operational Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Priority Dispatch Tier
                </label>
                <select
                  value={priorityTier}
                  onChange={(e) => setPriorityTier(Number(e.target.value))}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  {PRIORITY_TIERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: BATTERY & POWER */}
          {activeTab === 'battery' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Total Nameplate Battery (kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={batteryCapacityKwh}
                  onChange={(e) => setBatteryCapacityKwh(Number(e.target.value))}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Usable Battery Capacity (kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={usableBatteryKwh}
                  onChange={(e) => setUsableBatteryKwh(Number(e.target.value))}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Max AC Onboard Charger (kW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={maxAcPowerKw}
                  onChange={(e) => setMaxAcPowerKw(Number(e.target.value))}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Max DC Fast Charge Power (kW)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={maxDcPowerKw}
                  onChange={(e) => setMaxDcPowerKw(Number(e.target.value))}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="col-span-2 p-3 bg-surface-container-high/50 border border-outline-variant/20 text-xs text-on-surface-variant space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[16px]">bolt</span> EMS Dispatch Clamping Notice
                </div>
                <p>
                  The EMS Engine automatically clamps smart charging profile schedules to not exceed the vehicle's onboard AC/DC limit
                  and protects battery health during overnight shifts.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: DEPOT & ROUTING */}
          {activeTab === 'depot' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Default Depot Site
                </label>
                <input
                  type="text"
                  placeholder="e.g. default or depot-berlin"
                  value={defaultDepotSite}
                  onChange={(e) => setDefaultDepotSite(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Assigned Bay ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. BAY-01"
                  value={assignedBayId}
                  onChange={(e) => setAssignedBayId(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Assigned Driver Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Vance"
                  value={assignedDriverName}
                  onChange={(e) => setAssignedDriverName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Cost Center / Department Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CC-LOG-902"
                  value={costCenterCode}
                  onChange={(e) => setCostCenterCode(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 4: TELEMATICS & AUTH */}
          {activeTab === 'telematics' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Telematics Provider
                </label>
                <select
                  value={telematicsProvider}
                  onChange={(e) => setTelematicsProvider(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  {TELEMATICS_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Telematics External Vehicle ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. SAM-TRK-901"
                  value={telematicsVehicleId}
                  onChange={(e) => setTelematicsVehicleId(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  AutoCharge MAC / EVCCID Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. 00:1a:2b:3c:4d:5e"
                  value={autochargeMac}
                  onChange={(e) => setAutochargeMac(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono lowercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  ISO 15118 PnC Certificate Serial
                </label>
                <input
                  type="text"
                  placeholder="e.g. 04A1B2C3D4"
                  value={pncCertSerial}
                  onChange={(e) => setPncCertSerial(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                  Plug&Charge Status
                </label>
                <select
                  value={pncCertStatus}
                  onChange={(e) => setPncCertStatus(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  {PNC_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {isLoading ? 'Saving...' : isEdit ? 'Update Asset' : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
