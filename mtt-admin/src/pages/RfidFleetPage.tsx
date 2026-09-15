import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';
import { TokenIssueModal, type TokenItem } from '@/components/fleet/TokenIssueModal';
import { TokenReplaceModal } from '@/components/fleet/TokenReplaceModal';
import { TokenBlockModal } from '@/components/fleet/TokenBlockModal';
import { TokenAuditDrawer } from '@/components/fleet/TokenAuditDrawer';
import { TokenSessionsDrawer } from '@/components/fleet/TokenSessionsDrawer';
import { GroupModal, type GroupDetailItem } from '@/components/fleet/GroupModal';
import { GroupUsageModal } from '@/components/fleet/GroupUsageModal';
import { FleetUsageChart } from '@/components/fleet/FleetUsageChart';
import { FleetStatusDonut } from '@/components/fleet/FleetStatusDonut';

export const RfidFleetPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // Modals & Drawers state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<TokenItem | null>(null);

  const [replacingToken, setReplacingToken] = useState<TokenItem | null>(null);
  const [blockingToken, setBlockingToken] = useState<TokenItem | null>(null);
  const [auditingToken, setAuditingToken] = useState<TokenItem | null>(null);
  const [viewingSessionsToken, setViewingSessionsToken] = useState<TokenItem | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupDetailItem | null>(null);
  const [viewingUsageGroup, setViewingUsageGroup] = useState<GroupDetailItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Tokens
  const { data: rawTokens, isLoading: isTokensLoading } = useQuery({
    queryKey: ['tokens', { group_id: groupFilter, status: statusFilter, type: typeFilter, search: searchTerm }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (groupFilter) params.append('group_id', groupFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);
      return api.get<any>(`/tokens?${params.toString()}`);
    },
  });
  const tokens = ensureArray<TokenItem>(rawTokens, 'tokens');

  // 2. Fetch Groups
  const { data: rawGroups, isLoading: isGroupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get<any>('/groups'),
  });
  const groups = ensureArray<GroupDetailItem>(rawGroups, 'groups');

  // Top summary KPIs
  const totalTokens = tokens.length;
  const activeTokens = tokens.filter((t) => t.status?.toLowerCase() === 'active').length;
  const blockedTokens = tokens.filter((t) => t.status?.toLowerCase() === 'blocked').length;
  const otherTokens = totalTokens - activeTokens - blockedTokens;
  const totalMonthlyKwh = groups.reduce((acc, g) => acc + (g.month_kwh ?? 0), 0);

  // ── Token Mutations ────────────────────────────────────────────────
  const issueTokenMutation = useMutation({
    mutationFn: (body: any) => api.post('/tokens', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setIsIssueModalOpen(false);
      setEditingToken(null);
      showToast('Token authorization issued successfully.');
    },
    onError: (err: any) => showToast(`Failed to issue token: ${err.message}`),
  });

  const updateTokenMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/tokens/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      setIsIssueModalOpen(false);
      setEditingToken(null);
      showToast('Token metadata updated successfully.');
    },
    onError: (err: any) => showToast(`Failed to update token: ${err.message}`),
  });

  const blockTokenMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post(`/tokens/${id}/block`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      setBlockingToken(null);
      showToast('Token has been blocked.');
    },
    onError: (err: any) => showToast(`Failed to block token: ${err.message}`),
  });

  const unblockTokenMutation = useMutation({
    mutationFn: (id: string) => api.post(`/tokens/${id}/unblock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      showToast('Token has been unblocked and is now active.');
    },
    onError: (err: any) => showToast(`Failed to unblock token: ${err.message}`),
  });

  const replaceTokenMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      api.post(`/tokens/${id}/replace`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setReplacingToken(null);
      showToast('Card swapped and replacement token issued.');
    },
    onError: (err: any) => showToast(`Failed to replace card: ${err.message}`),
  });

  const revokeTokenMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tokens/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showToast('Token authorization revoked.');
    },
    onError: (err: any) => showToast(`Failed to revoke token: ${err.message}`),
  });

  const purgeTestMutation = useMutation({
    mutationFn: () => api.post('/tokens/purge-test'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      showToast('Simulated test tokens purged.');
    },
    onError: (err: any) => showToast(`Purge failed: ${err.message}`),
  });

  // ── Group Mutations ────────────────────────────────────────────────
  const createGroupMutation = useMutation({
    mutationFn: (body: any) => api.post('/groups', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setIsGroupModalOpen(false);
      setEditingGroup(null);
      showToast('Corporate fleet group created successfully.');
    },
    onError: (err: any) => showToast(`Failed to create group: ${err.message}`),
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/groups/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setIsGroupModalOpen(false);
      setEditingGroup(null);
      showToast('Group details updated.');
    },
    onError: (err: any) => showToast(`Failed to update group: ${err.message}`),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      showToast('Corporate group deleted.');
    },
    onError: (err: any) => showToast(`Failed to delete group: ${err.message}`),
  });

  const handleSaveToken = (data: any) => {
    if (editingToken) {
      updateTokenMutation.mutate({ id: editingToken.id || editingToken.uid, body: data });
    } else {
      issueTokenMutation.mutate(data);
    }
  };

  const handleSaveGroup = (data: any) => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, body: data });
    } else {
      createGroupMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 material-card bg-surface-container-highest/90 backdrop-blur-xl border border-secondary/40 text-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-mono text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
            RFID Tokens & Fleet Groups
          </h1>
          <p className="text-sm text-on-surface-variant font-body mt-1">
            Physical card authorizations, fleet driver pools, and corporate multi-tenant billing accounts.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (confirm('Purge simulated test tokens? Production credentials will not be affected.')) {
                purgeTestMutation.mutate();
              }
            }}
            disabled={purgeTestMutation.isPending}
            className="px-3 py-2 material-card bg-surface-container/80 border border-white/10 text-on-surface-variant hover:text-on-surface font-mono text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
            Purge Test Badges
          </button>
          <button
            onClick={() => {
              setEditingGroup(null);
              setIsGroupModalOpen(true);
            }}
            className="px-3.5 py-2 material-card bg-surface-container/80 border border-white/10 text-on-surface font-semibold text-xs rounded-xl shadow-sm hover:bg-surface-container-high active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">domain_add</span>
            Add Corporate Group
          </button>
          <button
            onClick={() => {
              setEditingToken(null);
              setIsIssueModalOpen(true);
            }}
            className="px-4 py-2 bg-primary text-on-primary font-semibold text-xs rounded-xl shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add_card</span>
            Issue New Token
          </button>
        </div>
      </div>

      {/* Standard Top KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Total Authorized Tokens
          </span>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {isTokensLoading ? '...' : totalTokens}
          </div>
        </div>
        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Active Badges
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            {isTokensLoading ? '...' : activeTokens}
          </div>
        </div>
        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Corporate Fleet Groups
          </span>
          <div className="text-2xl font-bold font-mono text-primary tracking-tight">
            {isGroupsLoading ? '...' : groups.length}
          </div>
        </div>
        <div className="material-card bg-slate-900/90 border border-slate-700/80 min-h-[96px] h-24 p-5 rounded-2xl flex flex-col justify-between shadow-md">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Monthly Fleet Energy
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-300 tracking-tight">
            {totalMonthlyKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
            <span className="text-xs font-mono font-normal text-slate-400">kWh</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="material-card bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-2xl flex flex-wrap items-center gap-3 shadow-md">
        <div className="flex-1 min-w-[240px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search UID, driver name, or badge label..."
            className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-9 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-400 font-mono font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950/90 border border-slate-700 rounded-xl h-9 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="" className="bg-slate-900 text-slate-200">All Statuses</option>
          <option value="active" className="bg-slate-900 text-slate-200">Active</option>
          <option value="blocked" className="bg-slate-900 text-slate-200">Blocked</option>
          <option value="ordered" className="bg-slate-900 text-slate-200">Ordered</option>
          <option value="revoked" className="bg-slate-900 text-slate-200">Revoked</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950/90 border border-slate-700 rounded-xl h-9 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="" className="bg-slate-900 text-slate-200">All Types</option>
          <option value="rfid" className="bg-slate-900 text-slate-200">Physical RFID</option>
          <option value="app_virtual" className="bg-slate-900 text-slate-200">Virtual Token</option>
          <option value="keyfob" className="bg-slate-900 text-slate-200">Key Fob</option>
          <option value="iso15118_emaid" className="bg-slate-900 text-slate-200">ISO 15118 eMAID</option>
        </select>

        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="bg-slate-950/90 border border-slate-700 rounded-xl h-9 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="" className="bg-slate-900 text-slate-200">All Corporate Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id} className="bg-slate-900 text-slate-200">
              {g.name}
            </option>
          ))}
        </select>

        {(searchTerm || statusFilter || typeFilter || groupFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
              setTypeFilter('');
              setGroupFilter('');
            }}
            className="px-3 py-1.5 text-xs font-mono text-primary hover:underline font-bold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Grid: Tokens Table & Groups / Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tokens Table */}
        <div className="lg:col-span-2 material-card bg-surface-container border border-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-surface-container-lowest/60">
              <h2 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                Issued Tokens & Badges
              </h2>
              <span className="font-mono text-xs text-on-surface-variant">{tokens.length} total tokens</span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-body text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-surface-container-lowest/40 text-xs font-mono text-on-surface-variant uppercase tracking-wider h-11">
                    <th className="px-4 min-w-[150px]">UID / Card Tag</th>
                    <th className="px-4 min-w-[160px]">Driver / Label</th>
                    <th className="px-4 min-w-[140px]">Fleet Group</th>
                    <th className="px-4 min-w-[100px]">Type</th>
                    <th className="px-4 min-w-[110px]">Status</th>
                    <th className="px-4 min-w-[160px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {tokens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                        No tokens found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    tokens.map((t) => {
                      const isBlocked = t.status?.toLowerCase() === 'blocked';
                      const isRevoked = t.status?.toLowerCase() === 'revoked';

                      return (
                        <tr key={t.id || t.uid} className="hover:bg-surface-container-high/40 transition-colors h-11">
                          <td className="px-4 py-3">
                            <div className="font-bold text-on-surface truncate">{t.uid}</div>
                            {t.card_number && (
                              <div className="text-xs text-on-surface-variant truncate">{t.card_number}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-on-surface font-body truncate">{t.driver_name || '—'}</div>
                            {t.label && <div className="text-xs text-on-surface-variant truncate">{t.label}</div>}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant truncate">
                            {t.group_name || 'Public Pool'}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant text-xs uppercase">
                            {t.type || 'rfid'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-0.5 text-xs uppercase font-bold rounded-full border shrink-0 ${
                                isBlocked
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : isRevoked
                                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}
                            >
                              {t.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Block / Unblock Button */}
                              {isBlocked ? (
                                <button
                                  title="Unblock Token"
                                  onClick={() => unblockTokenMutation.mutate(t.id || t.uid)}
                                  className="p-1.5 rounded-lg bg-surface-container-high hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">lock_open</span>
                                </button>
                              ) : (
                                <button
                                  title="Block Token"
                                  onClick={() => setBlockingToken(t)}
                                  className="p-1.5 rounded-lg bg-surface-container-high hover:bg-rose-500/20 text-rose-400 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">block</span>
                                </button>
                              )}

                              {/* Replace Card */}
                              <button
                                title="Replace Card"
                                onClick={() => setReplacingToken(t)}
                                className="p-1.5 rounded-lg bg-surface-container-high hover:bg-amber-400/20 text-amber-400 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                              </button>

                              {/* Sessions */}
                              <button
                                title="View Charging Sessions"
                                onClick={() => setViewingSessionsToken(t)}
                                className="p-1.5 rounded-lg bg-surface-container-high hover:bg-secondary/20 text-secondary transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">ev_station</span>
                              </button>

                              {/* Audit Events */}
                              <button
                                title="Audit Trail"
                                onClick={() => setAuditingToken(t)}
                                className="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary/20 text-primary transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">history</span>
                              </button>

                              {/* Edit */}
                              <button
                                title="Edit Token"
                                onClick={() => {
                                  setEditingToken(t);
                                  setIsIssueModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                              </button>

                              {/* Revoke / Delete */}
                              <button
                                title="Revoke Token"
                                onClick={() => {
                                  if (confirm(`Revoke authorization token ${t.uid}?`)) {
                                    revokeTokenMutation.mutate(t.id || t.uid);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-surface-container-high hover:bg-rose-500/20 text-rose-400 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
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

        {/* Right Col: Fleet Corporate Groups & Analytics */}
        <div className="space-y-6">
          {/* Groups Card List */}
          <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h2 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">corporate_fare</span>
                Corporate Accounts
              </h2>
              <button
                onClick={() => {
                  setEditingGroup(null);
                  setIsGroupModalOpen(true);
                }}
                className="px-3 py-1.5 bg-secondary text-white text-xs font-mono font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Add Group
              </button>
            </div>

            <div className="space-y-3 font-body text-xs">
              {groups.length === 0 ? (
                <div className="p-6 bg-surface-container-lowest/60 border border-white/5 rounded-xl text-center text-on-surface-variant font-mono">
                  No corporate groups configured. Click &apos;Add Group&apos; to create an organization billing account.
                </div>
              ) : (
                groups.map((g) => (
                  <div
                    key={g.id}
                    className="p-3.5 material-card bg-surface-container-low/80 border border-white/5 rounded-xl space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-on-surface text-sm block">{g.name}</span>
                        <span className="text-[10px] font-mono text-on-surface-variant block">
                          {g.billing_email || 'No billing email'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                        {g.token_count ?? 0} Badges
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono text-on-surface-variant border-t border-white/5 pt-2">
                      <span>Monthly: {Number(g.month_kwh ?? 0).toFixed(1)} kWh</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingUsageGroup(g)}
                          className="px-2.5 py-1 bg-surface-container-high border border-white/5 rounded-lg text-on-surface text-[10px] hover:bg-surface-container-highest transition-colors"
                        >
                          Usage
                        </button>
                        <button
                          onClick={() => {
                            setEditingGroup(g);
                            setIsGroupModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-surface-container-high border border-white/5 rounded-lg text-on-surface text-[10px] hover:bg-surface-container-highest transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete group '${g.name}'? (Only possible if no active tokens belong to it)`)) {
                              deleteGroupMutation.mutate(g.id);
                            }
                          }}
                          className="px-2.5 py-1 bg-surface-container-high border border-white/5 rounded-lg text-rose-400 text-[10px] hover:bg-rose-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Group Energy Breakdown Chart */}
          <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-5 rounded-2xl space-y-3">
            <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">bar_chart</span>
              Group Energy Breakdown (kWh)
            </h3>
            <FleetUsageChart groups={groups} />
          </div>

          {/* Token Status Donut */}
          <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-5 rounded-2xl space-y-3">
            <h3 className="font-headline text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[16px]">pie_chart</span>
              Token Status Distribution
            </h3>
            <FleetStatusDonut
              title="Token Status"
              slices={[
                { name: 'Active', value: activeTokens, color: '#10b981' },
                { name: 'Blocked', value: blockedTokens, color: '#ef4444' },
                { name: 'Other', value: otherTokens, color: '#64748b' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <TokenIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setEditingToken(null);
        }}
        onSave={handleSaveToken}
        groups={groups}
        initialData={editingToken}
        isLoading={issueTokenMutation.isPending || updateTokenMutation.isPending}
      />

      <TokenReplaceModal
        isOpen={Boolean(replacingToken)}
        onClose={() => setReplacingToken(null)}
        onReplace={(data) => {
          if (replacingToken) {
            replaceTokenMutation.mutate({ id: replacingToken.id || replacingToken.uid, body: data });
          }
        }}
        token={replacingToken}
        isLoading={replaceTokenMutation.isPending}
      />

      <TokenBlockModal
        isOpen={Boolean(blockingToken)}
        onClose={() => setBlockingToken(null)}
        onBlock={(reason) => {
          if (blockingToken) {
            blockTokenMutation.mutate({ id: blockingToken.id || blockingToken.uid, reason });
          }
        }}
        token={blockingToken}
        isLoading={blockTokenMutation.isPending}
      />

      <TokenAuditDrawer
        isOpen={Boolean(auditingToken)}
        onClose={() => setAuditingToken(null)}
        token={auditingToken}
      />

      <TokenSessionsDrawer
        isOpen={Boolean(viewingSessionsToken)}
        onClose={() => setViewingSessionsToken(null)}
        token={viewingSessionsToken}
      />

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSave={handleSaveGroup}
        initialData={editingGroup}
        isLoading={createGroupMutation.isPending || updateGroupMutation.isPending}
      />

      <GroupUsageModal
        isOpen={Boolean(viewingUsageGroup)}
        onClose={() => setViewingUsageGroup(null)}
        group={viewingUsageGroup}
      />
    </div>
  );
};
