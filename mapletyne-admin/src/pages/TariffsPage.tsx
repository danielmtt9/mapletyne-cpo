import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';
import type { TariffItem } from '@/components/tariffs/TariffBreakdownChart';
import type { PricingTierItem } from '@/components/tariffs/TierMarginChart';
import { TariffModelModal } from '@/components/tariffs/TariffModelModal';
import { PricingTierModal } from '@/components/tariffs/PricingTierModal';
import { CostBasisCard, type CostComponent } from '@/components/tariffs/CostBasisCard';
import { TariffDetailModal } from '@/components/tariffs/TariffDetailModal';

export const TariffsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<TariffItem | null>(null);

  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTierItem | null>(null);

  // In-Depth Detail Inspection Modal State
  const [detailTariff, setDetailTariff] = useState<TariffItem | null>(null);

  // Search, Sort & View Mode Filter state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'rate_desc' | 'rate_asc'>('name_asc');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Tariffs
  const { data: rawTariffs, isLoading: isTariffsLoading } = useQuery({
    queryKey: ['tariffs'],
    queryFn: () => api.get<any>('/tariffs'),
  });
  const tariffs = ensureArray<TariffItem>(rawTariffs, 'tariffs');

  const filteredTariffs = tariffs
    .filter((t) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        (t.name && t.name.toLowerCase().includes(query)) ||
        (t.id && t.id.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'rate_desc') return (b.energy_rate ?? 0) - (a.energy_rate ?? 0);
      if (sortBy === 'rate_asc') return (a.energy_rate ?? 0) - (b.energy_rate ?? 0);
      return (a.name || a.id).localeCompare(b.name || b.id);
    });

  // 2. Fetch Pricing Config (Cost components + Tiers)
  const { data: pricingConfig, isLoading: isConfigLoading } = useQuery({
    queryKey: ['pricing', 'config'],
    queryFn: () => api.get<any>('/pricing/config'),
  });

  const costComponents: CostComponent[] = pricingConfig?.components || [];
  const pricingTiers: PricingTierItem[] = pricingConfig?.tiers || [];
  const totalCostBasis = pricingConfig?.cost_basis ?? 0;
  const taxComponent = costComponents.find((c) => c.key.includes('tax') || c.key.includes('btw'));
  const taxRatePercent = taxComponent ? (taxComponent.value * 100).toFixed(0) : '21';

  // ── Tariffs Mutations ──────────────────────────────────────────────
  const createTariffMutation = useMutation({
    mutationFn: (body: any) => api.post('/tariffs', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      setIsTariffModalOpen(false);
      setEditingTariff(null);
      showToast('New tariff model registered successfully.');
    },
    onError: (err: any) => showToast(`Failed to create tariff: ${err.message}`),
  });

  const updateTariffMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/tariffs/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      setIsTariffModalOpen(false);
      setEditingTariff(null);
      showToast('Tariff updated successfully.');
    },
    onError: (err: any) => showToast(`Failed to update tariff: ${err.message}`),
  });

  const deleteTariffMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tariffs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      showToast('Tariff removed successfully.');
    },
    onError: (err: any) => showToast(`Failed to delete tariff: ${err.message}`),
  });

  // ── Pricing Tiers Mutations ────────────────────────────────────────
  const createTierMutation = useMutation({
    mutationFn: (body: any) => api.post('/pricing/tiers', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing', 'config'] });
      setIsTierModalOpen(false);
      setEditingTier(null);
      showToast('Customer pricing tier created successfully.');
    },
    onError: (err: any) => showToast(`Failed to create tier: ${err.message}`),
  });

  const updateTierMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/pricing/tiers/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing', 'config'] });
      setIsTierModalOpen(false);
      setEditingTier(null);
      showToast('Pricing tier updated successfully.');
    },
    onError: (err: any) => showToast(`Failed to update tier: ${err.message}`),
  });

  // ── Cost Basis Config Mutation ─────────────────────────────────────
  const updateConfigMutation = useMutation({
    mutationFn: (updates: Record<string, number>) => api.put('/pricing/config', { updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing', 'config'] });
      showToast('Cost basis parameters updated successfully.');
    },
    onError: (err: any) => showToast(`Failed to update config: ${err.message}`),
  });

  const handleSaveTariff = (data: any) => {
    if (editingTariff) {
      updateTariffMutation.mutate({
        id: editingTariff.id,
        body: {
          name: data.name,
          energy_rate: data.energy_rate,
          time_rate: data.time_rate,
          idle_rate: data.idle_rate,
          flat_fee: data.flat_fee,
        },
      });
    } else {
      createTariffMutation.mutate(data);
    }
  };

  const handleSaveTier = (data: any) => {
    if (editingTier) {
      updateTierMutation.mutate({
        id: editingTier.id,
        body: {
          name: data.name,
          margin_kwh: data.margin_kwh,
          description: data.description,
        },
      });
    } else {
      createTierMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6 font-body max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 material-card bg-slate-900/95 backdrop-blur-xl border border-secondary/40 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-mono text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-slate-100">
            Tariffs & Pricing Management
          </h1>
          <p className="text-sm text-slate-400 font-body mt-1">
            Multi-component base billing models, operational cost basis configuration, and customer margin tiering.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingTier(null);
              setIsTierModalOpen(true);
            }}
            className="px-4 py-2.5 material-card bg-slate-900/80 border border-slate-700/80 text-slate-200 hover:text-white font-semibold text-xs rounded-xl shadow-apple-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">add</span>
            Add Margin Tier
          </button>
          <button
            onClick={() => {
              setEditingTariff(null);
              setIsTariffModalOpen(true);
            }}
            className="px-4 py-2.5 bg-primary text-slate-950 font-semibold text-xs rounded-xl shadow-apple-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Create Tariff Model
          </button>
        </div>
      </div>

      {/* Summary Metrics (Standardized Height, Borders, and High Contrast) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="material-card bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-5 rounded-2xl shadow-apple-sm hover:border-slate-600 transition-all flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
              Active Tariff Plans
            </span>
            <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
          </div>
          <div className="font-headline text-2xl font-bold text-slate-100 tabular-nums">
            {isTariffsLoading ? '...' : tariffs.length}
          </div>
        </div>

        <div className="material-card bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-5 rounded-2xl shadow-apple-sm hover:border-slate-600 transition-all flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
              Customer Pricing Tiers
            </span>
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">loyalty</span>
          </div>
          <div className="font-headline text-2xl font-bold text-emerald-400 tabular-nums">
            {isConfigLoading ? '...' : pricingTiers.length}
          </div>
        </div>

        <div className="material-card bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-5 rounded-2xl shadow-apple-sm hover:border-slate-600 transition-all flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
              Network Cost Basis
            </span>
            <span className="material-symbols-outlined text-blue-400 text-[18px]">account_balance</span>
          </div>
          <div className="font-headline text-2xl font-bold text-blue-400 tabular-nums flex items-baseline gap-1">
            £{totalCostBasis.toFixed(3)} <span className="text-xs font-mono font-normal text-slate-400">/ kWh</span>
          </div>
        </div>

        <div className="material-card bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-5 rounded-2xl shadow-apple-sm hover:border-slate-600 transition-all flex flex-col justify-between h-24">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
              Standard Tax / VAT
            </span>
            <span className="material-symbols-outlined text-amber-400 text-[18px]">percent</span>
          </div>
          <div className="font-headline text-2xl font-bold text-amber-400 tabular-nums">
            {taxRatePercent}%
          </div>
        </div>
      </div>

      {/* Section 1: Base Tariff Models (Spacious Full-Width Layout) */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
            <div>
              <h2 className="font-headline text-lg font-bold text-slate-100">
                Configured Base Tariff Models
              </h2>
              <span className="text-xs font-mono text-slate-400">
                OCPP & OCPI Compatible Dimensional Billing ({filteredTariffs.length} shown)
              </span>
            </div>
          </div>

          {/* Dedicated Filter & View Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tariffs by name or ID..."
                className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-8 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950/90 border border-slate-700 rounded-xl h-8 px-2.5 text-xs text-slate-200 focus:border-primary outline-none cursor-pointer"
            >
              <option value="name_asc" className="bg-slate-900">Sort: Name (A-Z)</option>
              <option value="rate_desc" className="bg-slate-900">Sort: Rate (High to Low)</option>
              <option value="rate_asc" className="bg-slate-900">Sort: Rate (Low to High)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-950 border border-slate-700 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid Card View"
              >
                <span className="material-symbols-outlined text-[14px]">grid_view</span>
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition-all ${
                  viewMode === 'table'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dense Table View"
              >
                <span className="material-symbols-outlined text-[14px]">table_rows</span>
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Full-Width Tariff Content */}
        {filteredTariffs.length === 0 ? (
          <div className="material-card bg-slate-900/80 border border-slate-700/60 rounded-2xl p-10 text-center space-y-3">
            <span className="material-symbols-outlined text-slate-500 text-[40px]">receipt_long</span>
            <h3 className="font-headline text-base font-bold text-slate-200">No Matching Tariff Models</h3>
            <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
              {searchQuery ? `No tariff matches query '${searchQuery}'.` : 'Set up energy rates, idle penalty fees, and connection fees across your network.'}
            </p>
            <button
              onClick={() => {
                setEditingTariff(null);
                setIsTariffModalOpen(true);
              }}
              className="mt-2 px-4 py-2 bg-primary text-slate-950 font-mono text-xs font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Create Tariff Model
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* 3-Column Responsive Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTariffs.map((t) => (
              <div
                key={t.id}
                className="material-card bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 p-5 rounded-2xl shadow-apple-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                onClick={() => setDetailTariff(t)}
              >
                <div>
                  <div className="flex justify-between items-start gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-headline font-bold text-base text-slate-100 truncate group-hover:text-blue-300 transition-colors">
                        {t.name || t.id}
                      </h3>
                      <span className="text-xs font-mono text-slate-400 truncate block">ID: {t.id}</span>
                    </div>
                    <span className="font-headline text-xl font-bold text-primary whitespace-nowrap shrink-0">
                      £{(t.energy_rate ?? 0).toFixed(3)} <span className="text-xs font-mono font-normal text-slate-400">/kWh</span>
                    </span>
                  </div>

                  {/* Strict Tabular Alignment with Dimmed Zero Values */}
                  <div className="space-y-2 font-mono text-xs border-t border-white/5 pt-3 mt-3">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <span className="text-slate-400">Energy Rate:</span>
                      <span className={`tabular-nums text-right font-semibold ${(t.energy_rate ?? 0) > 0 ? 'text-slate-100' : 'text-slate-500 font-normal'}`}>
                        £{(t.energy_rate ?? 0).toFixed(3)} / kWh
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <span className="text-slate-400">Time Rate:</span>
                      <span className={`tabular-nums text-right ${(t.time_rate ?? 0) > 0 ? 'text-sky-300 font-semibold' : 'text-slate-500 font-normal'}`}>
                        £{(t.time_rate ?? 0).toFixed(3)} / min
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <span className="text-slate-400">Idle Penalty:</span>
                      <span className={`tabular-nums text-right ${(t.idle_rate ?? 0) > 0 ? 'text-amber-400 font-semibold' : 'text-slate-500 font-normal'}`}>
                        £{(t.idle_rate ?? 0).toFixed(3)} / min
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <span className="text-slate-400">Start Flat Fee:</span>
                      <span className={`tabular-nums text-right ${(t.flat_fee ?? 0) > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-500 font-normal'}`}>
                        £{(t.flat_fee ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between border-t border-white/5 pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setDetailTariff(t)}
                    className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <span className="material-symbols-outlined text-[14px]">query_stats</span>
                    Breakdown
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingTariff(t);
                        setIsTariffModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-slate-950/80 border border-slate-700 text-slate-200 font-mono text-xs rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete tariff '${t.name || t.id}'?`)) {
                          deleteTariffMutation.mutate(t.id);
                        }
                      }}
                      className="p-1 bg-slate-950/80 border border-slate-700 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="Delete Tariff"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Dense Table View */
          <div className="material-card bg-slate-900/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-apple-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/90 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 min-w-[200px]">Plan Name & ID</th>
                    <th className="py-3 px-3 text-right">Energy Rate</th>
                    <th className="py-3 px-3 text-right">Time Rate</th>
                    <th className="py-3 px-3 text-right">Idle Fee</th>
                    <th className="py-3 px-3 text-right">Flat Start</th>
                    <th className="py-3 px-3 text-center">Curr</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTariffs.map((t) => (
                    <tr 
                      key={t.id} 
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => setDetailTariff(t)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 font-sans text-xs flex items-center gap-2">
                          <span>{t.name || t.id}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {t.id}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span className={(t.energy_rate ?? 0) > 0 ? 'text-slate-100 font-bold' : 'text-slate-500'}>
                          £{(t.energy_rate ?? 0).toFixed(3)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">/kWh</span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span className={(t.time_rate ?? 0) > 0 ? 'text-sky-300 font-semibold' : 'text-slate-500'}>
                          £{(t.time_rate ?? 0).toFixed(3)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">/min</span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span className={(t.idle_rate ?? 0) > 0 ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                          £{(t.idle_rate ?? 0).toFixed(3)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">/min</span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span className={(t.flat_fee ?? 0) > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                          £{(t.flat_fee ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">
                        {t.currency || 'GBP'}
                      </td>
                      <td 
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailTariff(t)}
                            className="p-1.5 bg-slate-950 border border-slate-700 text-blue-400 hover:text-blue-300 rounded-lg transition-colors"
                            title="Inspect In-Depth Breakdown"
                          >
                            <span className="material-symbols-outlined text-[14px]">query_stats</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingTariff(t);
                              setIsTariffModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-950 border border-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors"
                            title="Edit Tariff"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete tariff '${t.name || t.id}'?`)) {
                                deleteTariffMutation.mutate(t.id);
                              }
                            }}
                            className="p-1.5 bg-slate-950 border border-slate-700 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg transition-colors"
                            title="Delete Tariff"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Customer Pricing Tiers & Cost Basis Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Left: Customer Pricing Tiers Table */}
        <div className="material-card bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-5 rounded-2xl space-y-4 shadow-apple-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">loyalty</span>
              <div>
                <h3 className="font-headline text-base font-bold text-slate-100">
                  Customer Pricing Tiers
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  CPO profit margins added to base network costs
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingTier(null);
                setIsTierModalOpen(true);
              }}
              className="px-3 py-1.5 bg-secondary text-slate-950 font-mono text-xs font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1 shadow-apple-sm"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Add Tier
            </button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-3 min-w-[140px]">Tier Plan</th>
                  <th className="p-3 text-right">Margin</th>
                  <th className="p-3 text-right">Excl. Tax</th>
                  <th className="p-3 text-right">Incl. Tax</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pricingTiers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No pricing tiers configured.
                    </td>
                  </tr>
                ) : (
                  pricingTiers.map((tier) => (
                    <tr key={tier.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-100 font-sans">{tier.name}</div>
                        <div className="text-[10px] text-slate-500">{tier.id}</div>
                      </td>
                      <td className="p-3 text-right text-emerald-400 font-bold tabular-nums">
                        +£{(tier.margin_kwh ?? 0).toFixed(3)}
                      </td>
                      <td className="p-3 text-right text-slate-300 font-mono tabular-nums">
                        £{(tier.rate_excl ?? totalCostBasis + tier.margin_kwh).toFixed(3)}
                      </td>
                      <td className="p-3 text-right text-primary font-bold tabular-nums">
                        £{(tier.rate_incl ?? (totalCostBasis + tier.margin_kwh) * 1.21).toFixed(3)}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingTier(tier);
                            setIsTierModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 hover:text-white text-[11px] transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Network Cost Basis Editor */}
        <CostBasisCard
          components={costComponents}
          totalCostBasis={totalCostBasis}
          onSave={(updates) => updateConfigMutation.mutate(updates)}
          isLoading={updateConfigMutation.isPending}
        />
      </div>

      {/* In-Depth Tariff Breakdown Modal */}
      <TariffDetailModal
        tariff={detailTariff}
        isOpen={Boolean(detailTariff)}
        onClose={() => setDetailTariff(null)}
        onEdit={(t) => {
          setDetailTariff(null);
          setEditingTariff(t);
          setIsTariffModalOpen(true);
        }}
        costBasis={totalCostBasis}
      />

      {/* CRUD Modals */}
      <TariffModelModal
        isOpen={isTariffModalOpen}
        onClose={() => {
          setIsTariffModalOpen(false);
          setEditingTariff(null);
        }}
        onSave={handleSaveTariff}
        initialData={editingTariff}
        isLoading={createTariffMutation.isPending || updateTariffMutation.isPending}
      />

      <PricingTierModal
        isOpen={isTierModalOpen}
        onClose={() => {
          setIsTierModalOpen(false);
          setEditingTier(null);
        }}
        onSave={handleSaveTier}
        initialData={editingTier}
        isLoading={createTierMutation.isPending || updateTierMutation.isPending}
      />
    </div>
  );
};
