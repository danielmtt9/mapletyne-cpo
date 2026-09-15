import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';
import { VehicleModal, type VehicleItem } from '@/components/fleet/VehicleModal';
import { VehicleSessionsDrawer } from '@/components/fleet/VehicleSessionsDrawer';
import { VehicleTelematicsDrawer } from '@/components/fleet/VehicleTelematicsDrawer';
import { DepotBayGrid, type DepotBayItem } from '@/components/fleet/DepotBayGrid';
import { DepotBayModal } from '@/components/fleet/DepotBayModal';
import { DepotPowerHeadroomChart } from '@/components/fleet/DepotPowerHeadroomChart';
import { FleetGanttTimeline, type ScheduleItem } from '@/components/fleet/FleetGanttTimeline';
import { EmsOverrideModal } from '@/components/fleet/EmsOverrideModal';

export const VehiclesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Main View Tab
  const [activeTab, setActiveTab] = useState<'inventory' | 'depot' | 'schedules'>('inventory');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState('default');

  // Modals & Drawers
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleItem | null>(null);
  const [viewingSessionsVehicle, setViewingSessionsVehicle] = useState<VehicleItem | null>(null);
  const [viewingTelematicsVehicle, setViewingTelematicsVehicle] = useState<VehicleItem | null>(null);

  const [isBayModalOpen, setIsBayModalOpen] = useState(false);
  const [editingBay, setEditingBay] = useState<DepotBayItem | null>(null);

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Vehicles
  const { data: rawVehicles, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ['fleet', 'vehicles', { status: statusFilter, tier: tierFilter }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (tierFilter) params.append('priority_tier', tierFilter);
      return api.get<any>(`/fleet/vehicles?${params.toString()}`);
    },
    refetchInterval: 10000,
  });

  const allVehicles = ensureArray<VehicleItem>(rawVehicles, 'vehicles');

  // Filter in-memory for search
  const vehicles = allVehicles.filter((v) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchPlate = v.license_plate?.toLowerCase().includes(q);
      const matchUnit = v.unit_number?.toLowerCase().includes(q);
      const matchVin = v.vin?.toLowerCase().includes(q);
      const matchMake = v.make?.toLowerCase().includes(q);
      const matchModel = v.model?.toLowerCase().includes(q);
      if (!matchPlate && !matchUnit && !matchVin && !matchMake && !matchModel) return false;
    }
    return true;
  });

  // 2. Fetch 360° Depot Snapshot
  const { data: depotSnapshot } = useQuery({
    queryKey: ['fleet', 'depots', selectedSiteId, 'snapshot'],
    queryFn: () => api.get<any>(`/fleet/depots/${selectedSiteId}/snapshot`),
    refetchInterval: 5000,
  });

  // 3. Fetch Shift Schedules
  const { data: rawSchedules, isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['fleet', 'schedules'],
    queryFn: () => api.get<any>('/fleet/schedules?limit=50'),
    refetchInterval: 10000,
  });

  const schedules = ensureArray<ScheduleItem>(rawSchedules, 'schedules');

  // 4. Fetch External EMS Override Status
  const { data: overrideStatus } = useQuery({
    queryKey: ['ems', 'override', selectedSiteId],
    queryFn: () => api.get<any>(`/ems/override?site_id=${selectedSiteId}`),
    refetchInterval: 5000,
  });

  // ── Vehicle Mutations ──────────────────────────────────────────────
  const createVehicleMutation = useMutation({
    mutationFn: (body: any) => api.post('/fleet/vehicles', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'vehicles'] });
      setIsVehicleModalOpen(false);
      setEditingVehicle(null);
      showToast('Fleet vehicle asset registered successfully.');
    },
    onError: (err: any) => showToast(`Failed to register vehicle: ${err.message}`),
  });

  const patchVehicleMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      api.patch(`/fleet/vehicles/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'vehicles'] });
      setIsVehicleModalOpen(false);
      setEditingVehicle(null);
      showToast('Vehicle parameters updated.');
    },
    onError: (err: any) => showToast(`Failed to update vehicle: ${err.message}`),
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/fleet/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'vehicles'] });
      showToast('Vehicle deactivated (soft-deleted).');
    },
    onError: (err: any) => showToast(`Failed to delete vehicle: ${err.message}`),
  });

  const syncTelematicsMutation = useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: number; data: any }) =>
      api.post(`/fleet/vehicles/${vehicleId}/telematics/sync`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet', 'depots'] });
      showToast('Telematics telemetry ingested successfully.');
    },
    onError: (err: any) => showToast(`Failed to sync telematics: ${err.message}`),
  });

  // ── Bay Mutations ──────────────────────────────────────────────────
  const createBayMutation = useMutation({
    mutationFn: (body: any) => api.post(`/fleet/depots/${selectedSiteId}/bays`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'depots'] });
      setIsBayModalOpen(false);
      setEditingBay(null);
      showToast('Depot charging bay created.');
    },
    onError: (err: any) => showToast(`Failed to create bay: ${err.message}`),
  });

  const patchBayMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      api.patch(`/fleet/depots/${selectedSiteId}/bays/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet', 'depots'] });
      setIsBayModalOpen(false);
      setEditingBay(null);
      showToast('Depot bay configuration updated.');
    },
    onError: (err: any) => showToast(`Failed to update bay: ${err.message}`),
  });

  // ── Override Mutations ─────────────────────────────────────────────
  const setOverrideMutation = useMutation({
    mutationFn: (body: any) => api.post('/ems/override', body),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['ems', 'override'] });
      queryClient.invalidateQueries({ queryKey: ['fleet', 'depots'] });
      setIsOverrideModalOpen(false);
      showToast(`SCADA Power Cap of ${data.override_kw} kW enforced.`);
    },
    onError: (err: any) => showToast(`Override failed: ${err.message}`),
  });

  const cancelOverrideMutation = useMutation({
    mutationFn: (siteId: string) => api.delete(`/ems/override?site_id=${siteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ems', 'override'] });
      queryClient.invalidateQueries({ queryKey: ['fleet', 'depots'] });
      showToast('SCADA override cancelled. Reverted to automatic optimization.');
    },
    onError: (err: any) => showToast(`Failed to cancel override: ${err.message}`),
  });

  const handleSaveVehicle = (data: any) => {
    if (editingVehicle && editingVehicle.id) {
      patchVehicleMutation.mutate({ id: editingVehicle.id, body: data });
    } else {
      createVehicleMutation.mutate(data);
    }
  };

  const handleSaveBay = (data: any) => {
    if (editingBay && editingBay.id) {
      patchBayMutation.mutate({ id: editingBay.id, body: data });
    } else {
      createBayMutation.mutate(data);
    }
  };

  const depotSummary = depotSnapshot?.depot_summary || {
    total_bays: 0,
    occupied_bays: 0,
    active_charging_sessions: 0,
    total_active_charging_kw: 0,
    grid_import_limit_kw: 1000,
    effective_limit_kw: 1000,
    headroom_kw: 1000,
    ems_mode: 'AUTOMATIC_OPTIMIZED',
  };

  const depotBays: DepotBayItem[] = depotSnapshot?.bays || [];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono flex items-center gap-2 border border-slate-700 animate-fade-in">
          <span className="material-symbols-outlined text-primary text-[18px]">info</span>
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">local_shipping</span>
            Fleet Operations & Depot Cockpit
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Multi-tier commercial EV asset registration, real-time depot bay telemetry, smart charging dispatch, and SCADA override.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOverrideModalOpen(true)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md ${
              overrideStatus?.is_override_active
                ? 'bg-red-600 text-white animate-pulse border border-red-400'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            {overrideStatus?.is_override_active
              ? `SCADA Cap: ${overrideStatus.override_kw} kW (${overrideStatus.remaining_seconds}s)`
              : 'SCADA / EMS Override'}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingVehicle(null);
              setIsVehicleModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Register EV Asset
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inventory_2</span>
          Fleet Inventory & Telematics ({allVehicles.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('depot')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'depot'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">garage</span>
          Depot Cockpit & Bays ({depotBays.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'schedules'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          Dispatcher Shifts & Headroom ({schedules.length})
        </button>
      </div>

      {/* ── TAB 1: FLEET INVENTORY ────────────────────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="material-card bg-slate-900/90 border border-slate-700/80 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search license plate, unit number, VIN, make..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-xs"
                />
              </div>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-200">All Priority Tiers</option>
                <option value="1" className="bg-slate-900 text-slate-200">Tier 1: Emergency/VIP</option>
                <option value="2" className="bg-slate-900 text-slate-200">Tier 2: Fixed Route</option>
                <option value="3" className="bg-slate-900 text-slate-200">Tier 3: Flexible</option>
                <option value="4" className="bg-slate-900 text-slate-200">Tier 4: Standby</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-slate-200">All Statuses</option>
                <option value="active" className="bg-slate-900 text-slate-200">Active</option>
                <option value="maintenance" className="bg-slate-900 text-slate-200">Maintenance</option>
                <option value="inactive" className="bg-slate-900 text-slate-200">Inactive</option>
              </select>
            </div>

            <span className="text-xs text-slate-300 font-mono">
              Showing {vehicles.length} of {allVehicles.length} assets
            </span>
          </div>

          {/* Vehicles Table */}
          <div className="material-card bg-slate-900/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/90 uppercase text-[11px] tracking-wider text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold min-w-[200px] whitespace-nowrap">Unit / Plate</th>
                    <th className="py-3.5 px-4 font-semibold min-w-[170px] whitespace-nowrap">Make & Model</th>
                    <th className="py-3.5 px-4 font-semibold min-w-[90px] whitespace-nowrap">Tier</th>
                    <th className="py-3.5 px-4 font-semibold min-w-[170px] whitespace-nowrap">Battery & Limits</th>
                    <th className="py-3.5 px-4 font-semibold min-w-[150px] whitespace-nowrap">Live SOC / Range</th>
                    <th className="py-3.5 px-4 font-semibold min-w-[110px] whitespace-nowrap">Depot Bay</th>
                    <th className="py-3.5 px-4 font-semibold min-w-[110px] whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right min-w-[130px] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 font-sans">
                  {isVehiclesLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <span className="material-symbols-outlined text-3xl animate-spin mb-2 block text-primary">sync</span>
                        Streaming fleet inventory...
                      </td>
                    </tr>
                  ) : vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No vehicles found matching search filters.
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((v) => {
                      const soc = v.current_soc_pct ?? 50;
                      return (
                        <tr key={v.id} className="hover:bg-slate-800/60 transition-colors">
                          {/* Indestructible License Plate & Unit Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                              {v.unit_number && (
                                <span className="px-2 py-0.5 bg-primary/15 border border-primary/40 text-primary font-mono font-bold text-xs rounded">
                                  {v.unit_number}
                                </span>
                              )}
                              <span className="px-2.5 py-1 bg-slate-950 border border-slate-700 text-white font-mono font-bold text-xs tracking-wider rounded uppercase shadow-xs">
                                {v.license_plate}
                              </span>
                            </div>
                            {v.vin && (
                              <div className="text-[10px] text-slate-400 font-mono mt-1 truncate max-w-[190px]" title={v.vin}>
                                VIN: {v.vin}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-white">{v.make || 'Unknown'} {v.model || ''}</div>
                            <div className="text-[11px] text-slate-300 font-mono">{v.year || 2025} • {v.connector_type}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                                v.priority_tier === 1
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                  : v.priority_tier === 2
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              Tier {v.priority_tier || 2}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                            <div className="text-slate-100 font-medium">{v.usable_battery_kwh || 70} / {v.battery_capacity_kwh || 75} kWh</div>
                            <div className="text-[10px] text-slate-400">
                              AC: {v.max_ac_power_kw || 11}kW • DC: {v.max_dc_power_kw || 150}kW
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-white">{soc}%</span>
                              <div className="w-16 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className={`h-full transition-all ${soc > 70 ? 'bg-emerald-400' : soc > 30 ? 'bg-blue-400' : 'bg-red-400'}`}
                                  style={{ width: `${Math.min(100, soc)}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-300 font-mono mt-0.5">
                              {v.estimated_range_km ? `${v.estimated_range_km} km` : 'No range data'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                            {v.assigned_bay_id ? (
                              <span className="px-2 py-0.5 bg-slate-950 border border-slate-700 text-primary font-bold rounded">
                                {v.assigned_bay_id}
                              </span>
                            ) : (
                              <span className="text-slate-400">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                                v.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : v.status === 'maintenance'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                              }`}
                            >
                              {v.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title="Live Telematics"
                                onClick={() => setViewingTelematicsVehicle(v)}
                                className="p-1.5 hover:bg-slate-800 text-primary rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">sensors</span>
                              </button>
                              <button
                                type="button"
                                title="Charging Sessions"
                                onClick={() => setViewingSessionsVehicle(v)}
                                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">history</span>
                              </button>
                              <button
                                type="button"
                                title="Edit Asset"
                                onClick={() => {
                                  setEditingVehicle(v);
                                  setIsVehicleModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                type="button"
                                title="Deactivate"
                                onClick={() => v.id && deleteVehicleMutation.mutate(v.id)}
                                className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: DEPOT COCKPIT & BAYS ───────────────────────────────────── */}
      {activeTab === 'depot' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="material-card bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl shadow-md">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Depot Bays
              </span>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {depotSummary.total_bays}
              </div>
              <span className="text-[11px] text-primary font-medium">
                {depotSummary.occupied_bays} Docked Vehicles
              </span>
            </div>

            <div className="material-card bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl shadow-md">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Active Depot Charging Load
              </span>
              <div className="text-2xl font-bold font-mono text-primary mt-1">
                {depotSummary.total_active_charging_kw.toFixed(1)} kW
              </div>
              <span className="text-[11px] text-slate-300">
                {depotSummary.active_charging_sessions} Active Sessions
              </span>
            </div>

            <div className="material-card bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl shadow-md">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Grid Power Headroom
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {depotSummary.headroom_kw.toFixed(1)} kW
              </div>
              <span className="text-[11px] text-emerald-400/90 font-medium">Available for Smart Dispatch</span>
            </div>

            <div className="material-card bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl shadow-md">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                EMS Operating Mode
              </span>
              <div
                className={`text-base font-bold font-mono mt-1 ${
                  depotSummary.ems_mode === 'EXTERNAL_OVERRIDE' ? 'text-red-400' : 'text-white'
                }`}
              >
                {depotSummary.ems_mode}
              </div>
              <span className="text-[11px] text-slate-300">
                Cap: {depotSummary.effective_limit_kw} kW
              </span>
            </div>
          </div>

          {/* Depot Power Headroom EChart */}
          <DepotPowerHeadroomChart
            gridLimitKw={depotSummary.grid_import_limit_kw}
            effectiveLimitKw={depotSummary.effective_limit_kw}
            activeChargingKw={depotSummary.total_active_charging_kw}
            headroomKw={depotSummary.headroom_kw}
            emsMode={depotSummary.ems_mode}
          />

          {/* Bays Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="font-headline text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">ev_station</span>
                Charging Bay Matrix
              </h3>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="default">Site: default</option>
                <option value="depot-north">Site: depot-north</option>
                <option value="depot-south">Site: depot-south</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingBay(null);
                setIsBayModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add</span> Add Charging Bay
            </button>
          </div>

          {/* Interactive Depot Bay Grid */}
          <DepotBayGrid
            bays={depotBays}
            onSelectBay={(b) => {
              setEditingBay(b);
              setIsBayModalOpen(true);
            }}
          />
        </div>
      )}

      {/* ── TAB 3: SHIFT SCHEDULES & DISPATCHER ───────────────────────────── */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          {/* Dispatcher Departure Timeline Gantt */}
          <FleetGanttTimeline schedules={schedules} isLoading={isSchedulesLoading} />

          {/* Schedules Table */}
          <div className="material-card bg-slate-900/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-md">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-headline text-sm font-bold text-white">
                Scheduled Vehicle Shift Departures
              </h3>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/90 uppercase text-[11px] tracking-wider text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold min-w-[180px] whitespace-nowrap">Vehicle</th>
                    <th className="py-3 px-4 font-semibold min-w-[170px] whitespace-nowrap">Target Departure</th>
                    <th className="py-3 px-4 font-semibold min-w-[110px] whitespace-nowrap">Target SOC</th>
                    <th className="py-3 px-4 font-semibold min-w-[130px] whitespace-nowrap">Emergency Floor</th>
                    <th className="py-3 px-4 font-semibold min-w-[100px] whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 font-sans">
                  {schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <span className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs">
                          {s.unit_number ? `${s.unit_number} (${s.license_plate})` : s.license_plate}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-200">
                        {new Date(s.target_departure_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-bold whitespace-nowrap">
                        {s.target_soc_pct}%
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-400 font-bold whitespace-nowrap">
                        {s.min_emergency_soc_pct}%
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 uppercase">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals & Drawers ──────────────────────────────────────────────── */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        onSave={handleSaveVehicle}
        initialData={editingVehicle}
        isLoading={createVehicleMutation.isPending || patchVehicleMutation.isPending}
      />

      <VehicleSessionsDrawer
        isOpen={Boolean(viewingSessionsVehicle)}
        vehicle={viewingSessionsVehicle}
        onClose={() => setViewingSessionsVehicle(null)}
      />

      <VehicleTelematicsDrawer
        vehicle={viewingTelematicsVehicle}
        onClose={() => setViewingTelematicsVehicle(null)}
        onSyncTelematics={async (vId, data) => {
          await syncTelematicsMutation.mutateAsync({ vehicleId: vId, data });
        }}
      />

      <DepotBayModal
        isOpen={isBayModalOpen}
        onClose={() => {
          setIsBayModalOpen(false);
          setEditingBay(null);
        }}
        onSave={handleSaveBay}
        initialData={editingBay}
        vehicles={allVehicles}
        isLoading={createBayMutation.isPending || patchBayMutation.isPending}
      />

      <EmsOverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        siteId={selectedSiteId}
        currentOverrideKw={overrideStatus?.override_kw}
        isOverrideActive={Boolean(overrideStatus?.is_override_active)}
        onApplyOverride={(data) => setOverrideMutation.mutate(data)}
        onCancelOverride={(siteId) => cancelOverrideMutation.mutate(siteId)}
        isLoading={setOverrideMutation.isPending || cancelOverrideMutation.isPending}
      />
    </div>
  );
};
