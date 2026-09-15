import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray, formatTimestamp } from '@/lib/utils';

export const PkiVaultPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [certType, setCertType] = useState<'secc' | 'contract'>('secc');
  const [targetId, setTargetId] = useState('');
  const [csrPem, setCsrPem] = useState('');
  const [revokingSerial, setRevokingSerial] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('keyCompromise');

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Queries
  const { data: pkiStats } = useQuery({
    queryKey: ['pki', 'stats'],
    queryFn: () => api.get<any>('/pki/stats').catch(() => null),
  });

  const { data: chargersData } = useQuery({
    queryKey: ['chargers'],
    queryFn: () => api.get<any>('/chargers').catch(() => ({ chargers: [] })),
  });
  const chargers = ensureArray<any>(chargersData, 'chargers');

  const { data: certsData, isLoading: isCertsLoading } = useQuery({
    queryKey: ['pki', 'certificates', { type: typeFilter, status: statusFilter, search: searchTerm }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      return api.get<any>(`/pki/certificates?${params.toString()}`);
    },
  });

  const certList = ensureArray<any>(certsData, 'certificates');

  // Mutations
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (certType === 'secc') {
        return api.post('/pki/issue/secc', {
          charge_point_id: targetId,
          csr_pem: csrPem.trim() || undefined,
        });
      } else {
        return api.post('/pki/issue/contract', {
          emaid: targetId,
          csr_pem: csrPem.trim() || undefined,
        });
      }
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['pki'] });
      setIsSignModalOpen(false);
      setTargetId('');
      setCsrPem('');
      showToast(`Certificate issued successfully! Serial: ${res.serial || 'OK'}`);
    },
    onError: (err: any) => {
      showToast(`Issuance failed: ${err.message}`);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (serial: string) => {
      return api.post('/pki/revoke', {
        serial,
        reason: revokeReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pki'] });
      setRevokingSerial(null);
      showToast('Certificate revoked successfully.');
    },
    onError: (err: any) => {
      showToast(`Revocation failed: ${err.message}`);
    },
  });

  const handleDownloadCert = (serial: string) => {
    window.open(`/api/v1/pki/certificates/${serial}/download`, '_blank');
  };

  const handleDownloadCrl = () => {
    window.open('/api/v1/pki/crl', '_blank');
  };

  return (
    <div className="space-y-6 font-body">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 material-card bg-surface-container-highest/90 backdrop-blur-xl border border-primary/40 text-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-mono text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
            ISO 15118 PKI & Security Vault
          </h1>
          <p className="text-sm text-on-surface-variant font-body mt-1">
            V2G Root CA hierarchy, SECC CSR certificate signing, contract certificates, and CRL verification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCrl}
            className="px-4 py-2.5 material-card bg-surface-container/80 border border-white/10 text-on-surface font-semibold text-xs rounded-xl shadow-sm hover:bg-surface-container-high active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">download</span>
            Download CRL
          </button>
          <button
            onClick={() => {
              setTargetId('');
              setCsrPem('');
              setIsSignModalOpen(true);
            }}
            className="px-4 py-2.5 bg-primary text-on-primary font-semibold text-xs rounded-xl shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            Sign Station / Contract CSR
          </button>
        </div>
      </div>

      {/* Trust Hierarchy Visual Tree */}
      <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-4">
        <h2 className="font-headline text-base font-bold text-on-surface">
          Certificate Authority Trust Chain
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Level 1: V2G Root CA */}
          <div className="bg-surface-container-lowest/80 p-4 rounded-xl border border-primary/40 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-primary font-bold">V2G Root CA (Self-Signed)</span>
              <span className="px-2 py-0.5 text-[9px] bg-primary/10 text-primary uppercase font-bold rounded-full border border-primary/30">
                Root Trust
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">CN: OpenCPO V2G Root CA G2</p>
            <p className="text-[10px] text-on-surface-variant font-mono">ECDSA P-256 • SHA-256</p>
            <div className="text-[10px] text-emerald-400 pt-2 border-t border-white/5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CRL Distribution Active
            </div>
          </div>

          {/* Level 2: SECC Sub-CA */}
          <div className="bg-surface-container-lowest/80 p-4 rounded-xl border border-secondary/40 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-secondary font-bold">SECC Sub-CA 1</span>
              <span className="px-2 py-0.5 text-[9px] bg-secondary/10 text-secondary uppercase font-bold rounded-full border border-secondary/30">
                Intermediate
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">CN: OpenCPO SECC Sub-CA</p>
            <p className="text-[10px] text-on-surface-variant font-mono">Signs Station TLS 1.3 Leaf Certs</p>
            <div className="text-[10px] text-emerald-400 pt-2 border-t border-white/5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {pkiStats?.secc ?? pkiStats?.secc_certs_active ?? pkiStats?.active ?? certList.filter((c: any) => c.type === 'secc').length} Leaf Certs Active
            </div>
          </div>

          {/* Level 3: MO Sub-CA */}
          <div className="bg-surface-container-lowest/80 p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-on-surface font-bold">MO Sub-CA (OEM Contracts)</span>
              <span className="px-2 py-0.5 text-[9px] bg-surface-container-high text-on-surface-variant uppercase font-bold rounded-full">
                Contract CA
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">CN: OpenCPO Mobility Operator CA</p>
            <p className="text-[10px] text-on-surface-variant font-mono">Issues vehicle eMAID certificates</p>
            <div className="text-[10px] text-emerald-400 pt-2 border-t border-white/5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Plug & Charge Enabled
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Inventory Search & Filter Bar */}
      <div className="material-card bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search serial, common name, station..."
              className="w-full bg-slate-950/90 border border-slate-700 rounded-xl h-9 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-400 font-mono font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 shadow-xs"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950/90 border border-slate-700 rounded-xl h-9 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Types (SECC / Contract / User)</option>
            <option value="secc" className="bg-slate-900 text-slate-200">SECC (Station Leaf)</option>
            <option value="contract" className="bg-slate-900 text-slate-200">Contract (Plug & Charge)</option>
            <option value="user" className="bg-slate-900 text-slate-200">User / Operator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/90 border border-slate-700 rounded-xl h-9 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Statuses</option>
            <option value="active" className="bg-slate-900 text-slate-200">Active</option>
            <option value="revoked" className="bg-slate-900 text-slate-200">Revoked</option>
            <option value="expired" className="bg-slate-900 text-slate-200">Expired</option>
          </select>
        </div>

        <div className="text-xs font-mono text-on-surface-variant">
          Total Certificates: <span className="font-bold text-on-surface">{certList.length}</span>
        </div>
      </div>

      {/* Certificate Inventory Table */}
      <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/5 bg-surface-container-high/40 text-on-surface-variant uppercase text-xs tracking-wider h-11">
                <th className="px-4 py-3 min-w-[140px]">Serial / ID</th>
                <th className="px-4 py-3 min-w-[90px]">Type</th>
                <th className="px-4 py-3 min-w-[180px]">Subject / CN</th>
                <th className="px-4 py-3 min-w-[140px]">Station / eMAID</th>
                <th className="px-4 py-3 min-w-[150px]">Valid Until</th>
                <th className="px-4 py-3 min-w-[110px]">Status</th>
                <th className="px-4 py-3 min-w-[100px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-on-surface">
              {isCertsLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                    Loading PKI certificates...
                  </td>
                </tr>
              ) : certList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                    No certificates found matching the criteria. Click &apos;Sign Station / Contract CSR&apos; to issue.
                  </td>
                </tr>
              ) : (
                certList.map((c: any) => {
                  const isRevoked = c.status === 'revoked';
                  const isExpired = c.status === 'expired';
                  const isActive = c.status === 'active' || (!isRevoked && !isExpired);

                  return (
                    <tr key={c.serial} className="hover:bg-surface-container-high/30 transition-colors h-11">
                      <td className="px-4 py-3 font-bold text-primary max-w-[140px] truncate" title={c.serial}>
                        {c.serial}
                      </td>
                      <td className="px-4 py-3 uppercase">
                        <span className="px-2.5 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 font-bold shrink-0">
                          {c.type || 'SECC'}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate text-on-surface-variant" title={c.subject}>
                        {c.subject || '—'}
                      </td>
                      <td className="px-4 py-3 text-on-surface truncate">
                        {c.charge_point || c.emaid || '—'}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {c.not_after ? formatTimestamp(c.not_after) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {isRevoked ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold shrink-0">
                            REVOKED
                          </span>
                        ) : isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold shrink-0">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          <button
                            title="Download Certificate PEM"
                            onClick={() => handleDownloadCert(c.serial)}
                            className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                          </button>
                          {isActive && (
                            <button
                              title="Revoke Certificate"
                              onClick={() => setRevokingSerial(c.serial)}
                              className="p-1.5 rounded-lg bg-surface-container-high hover:bg-rose-500/20 text-rose-400 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">block</span>
                            </button>
                          )}
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

      {/* Sign CSR / Issue Certificate Modal */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="material-card bg-surface-container-high/95 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified_user</span>
                Sign CSR / Issue Certificate
              </h3>
              <button
                onClick={() => setIsSignModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!targetId) return;
                issueMutation.mutate();
              }}
              className="space-y-4 text-xs font-mono"
            >
              <div>
                <label className="block text-on-surface-variant mb-1 font-bold uppercase text-[10px]">
                  Certificate Purpose
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCertType('secc')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                      certType === 'secc'
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-surface-container-lowest/80 border-white/10 text-on-surface-variant'
                    }`}
                  >
                    SECC (Station Leaf)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertType('contract')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                      certType === 'contract'
                        ? 'bg-secondary/20 border-secondary text-secondary'
                        : 'bg-surface-container-lowest/80 border-white/10 text-on-surface-variant'
                    }`}
                  >
                    Contract (Plug & Charge)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-on-surface-variant mb-1 font-bold uppercase text-[10px]">
                  {certType === 'secc' ? 'Charge Point ID' : 'Vehicle eMAID (EMAID)'} *
                </label>
                {certType === 'secc' && chargers.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-3 py-2 text-on-surface focus:border-primary/50 outline-none"
                    >
                      <option value="">-- Select Registered Station or enter below --</option>
                      {chargers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.id} {c.display_name ? `(${c.display_name})` : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or type custom Station ID..."
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-3 py-2 text-on-surface focus:border-primary/50 outline-none"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder={certType === 'secc' ? 'e.g. CP-HQ-01' : 'e.g. DE8A9B1C2D3E4F'}
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-3 py-2 text-on-surface focus:border-primary/50 outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-on-surface-variant mb-1 font-bold uppercase text-[10px]">
                  CSR PEM (Optional - Leave blank to auto-generate SECP256R1 keypair)
                </label>
                <textarea
                  rows={4}
                  value={csrPem}
                  onChange={(e) => setCsrPem(e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE REQUEST-----&#10;...&#10;-----END CERTIFICATE REQUEST-----"
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-xl p-3 text-on-surface font-mono text-[11px] focus:border-primary/50 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetId || issueMutation.isPending}
                  className="px-5 py-2 bg-primary text-on-primary font-bold rounded-xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {issueMutation.isPending && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                  Sign & Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokingSerial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="material-card bg-surface-container-high/95 backdrop-blur-2xl border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-headline text-lg font-bold text-rose-400 flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              Revoke Certificate
            </h3>
            <p className="text-xs font-mono text-on-surface-variant">
              Are you sure you want to revoke certificate <span className="text-on-surface font-bold">{revokingSerial}</span>? This will immediately push the serial to the Certificate Revocation List (CRL).
            </p>

            <div className="space-y-1 font-mono text-xs">
              <label className="text-on-surface-variant font-bold uppercase text-[10px]">Revocation Reason</label>
              <select
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-3 py-2 text-on-surface outline-none"
              >
                <option value="keyCompromise">Key Compromise</option>
                <option value="cessationOfOperation">Station Decommissioned / Ceased</option>
                <option value="superseded">Superseded / Rotated</option>
                <option value="unspecified">Unspecified Reason</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevokingSerial(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revokeMutation.isPending}
                onClick={() => revokeMutation.mutate(revokingSerial)}
                className="px-5 py-2 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-all"
              >
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
