import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/lib/theme-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { branding, theme, resolvedTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState(user?.email || 'elena.vance@mapletyne.com');
  const [phone, setPhone] = useState('+44 20 7946 0921');
  const [timezone, setTimezone] = useState('Europe/London (UTC+0)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const userEmail = user?.email || 'admin@mapletyne.com';

  const { data: userData } = useQuery({
    queryKey: ['users', userEmail],
    queryFn: () => api.get<any>(`/users/${encodeURIComponent(userEmail)}`),
    retry: false,
  });

  const { data: rawTokens } = useQuery({
    queryKey: ['tokens', 'profile'],
    queryFn: () => api.get<any>('/tokens'),
    retry: false,
  });
  const rfidTokens = Array.isArray(rawTokens) ? rawTokens : (rawTokens?.items || []);
  void userData;
  void rfidTokens;

  const certMutation = useMutation({
    mutationFn: () => api.post<any>(`/users/${encodeURIComponent(userEmail)}/cert/issue`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users', userEmail] }),
  });

  const tokenMutation = useMutation({
    mutationFn: () => api.post<any>('/tokens', { label: 'New RFID Token' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tokens', 'profile'] }),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline">
        <div>
          <h1 className="font-headline font-bold text-4xl tracking-tight text-on-surface">
            Operator Profile & Security Credentials
          </h1>
          <p className="text-xs text-on-surface-variant font-body mt-1">
            Manage your operational credentials, mutual TLS identity, and RFID dispatch tokens.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Session: Encrypted via mTLS</span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2.5">
          <span className="material-symbols-outlined text-lg" aria-hidden="true">check_circle</span>
          <span className="font-medium">Profile and emergency dispatch preferences saved successfully.</span>
        </div>
      )}

      {/* Two Column Grid Layout - Flush Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Operator Summary */}
        <div className="space-y-8">
          <div className="text-center pb-6 border-b border-outline/30">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-primary/30 border-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-3xl font-bold font-mono mx-auto shadow-md">
              {user.initials || 'EV'}
            </div>
            <h2 className="mt-4 text-xl font-headline font-bold text-on-surface">
              {user.name || 'Elena Vance'}
            </h2>
            <p className="text-sm text-on-surface-variant font-medium mt-0.5">
              {user.role || 'Director of Grid Operations & Microgrid Architecture'}
            </p>
            <p className="text-xs font-mono text-on-surface-variant mt-1">
              {branding.company_name || 'Mapletyne Fleet Power LLC'}
            </p>

            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <span className="px-3 py-1 rounded-full text-micro font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Super Admin
              </span>
              <span className="px-3 py-1 rounded-full text-micro font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                OCPP 2.0.1 Certified
              </span>
            </div>
          </div>

          {/* Security Posture Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">security</span>
              Security Posture
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-outline/30">
                <span className="text-on-surface-variant">Hardware MFA</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">verified</span>
                  Active (FIDO2)
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline/30">
                <span className="text-on-surface-variant">Session Auth</span>
                <span className="font-mono text-sm text-on-surface">TLS 1.3 / P-384</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline/30">
                <span className="text-on-surface-variant">Last Dispatch IP</span>
                <span className="font-mono text-sm text-on-surface">192.168.1.104</span>
              </div>
            </div>
          </div>

          {/* Theme & Workspace Appearance Section */}
          <div className="space-y-4 pt-4 border-t border-outline/30">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">palette</span>
                Workspace Appearance
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-container-high border border-outline text-on-surface-variant">
                Active: {resolvedTheme}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-body">
              Select your operator interface theme mode or synchronize with your operating system settings.
            </p>
            <div className="grid grid-cols-3 gap-2 p-1 bg-surface-container-high/60 border border-outline rounded-xl">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                  theme === 'light'
                    ? 'bg-surface-container text-primary shadow-sm border border-outline font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                }`}
                title="Switch to Light Theme"
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">light_mode</span>
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-surface-container text-primary shadow-sm border border-outline font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                }`}
                title="Switch to Dark Theme"
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">dark_mode</span>
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                  theme === 'system'
                    ? 'bg-surface-container text-primary shadow-sm border border-outline font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                }`}
                title="Synchronize with OS Theme"
              >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">settings_brightness</span>
                <span>System</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Details, PKI, and RFID */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal & Contact Details Form */}
          <div className="space-y-4">
            <h3 className="text-xl font-headline font-bold text-on-surface pb-3 border-b border-outline/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">badge</span>
              Contact & Dispatch Preferences
            </h3>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-4 text-base text-on-surface focus:outline-none focus:border-primary font-sans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    Emergency Grid Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-4 text-base text-on-surface focus:outline-none focus:border-primary font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Operating Timezone
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline rounded-xl h-11 px-4 text-base text-on-surface focus:outline-none focus:border-primary font-sans"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:opacity-95 text-white font-semibold text-base rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">save</span>
                  <span>Update Profile</span>
                </button>
              </div>
            </form>
          </div>

          {/* PKI Vault & Mutual TLS Identity - Flush Canvas */}
          <div className="space-y-4 pt-6 border-t border-outline/30">
            <div className="flex items-center justify-between pb-3 border-b border-outline/30">
              <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">vpn_key</span>
                PKI Certificate & mTLS Identity
              </h3>
              <button 
                onClick={() => {
                  certMutation.mutate();
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 3000);
                }}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-surface-container-high/60 hover:bg-surface-container-highest border border-outline/30 text-on-surface flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">autorenew</span>
                <span>Renew Certificate</span>
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-high/50 rounded-xl border border-outline/30">
                <span className="text-xs font-mono uppercase text-on-surface-variant block">Subject Common Name (CN)</span>
                <span className="font-mono font-semibold text-on-surface text-sm break-all">elena.vance.mapletyne.internal</span>
              </div>
              <div className="p-4 bg-surface-container-high/50 rounded-xl border border-outline/30">
                <span className="text-xs font-mono uppercase text-on-surface-variant block">Certificate Serial</span>
                <span className="font-mono font-semibold text-on-surface text-sm">7A:19:C4:00:8F:22:9B</span>
              </div>
              <div className="p-4 bg-surface-container-high/50 rounded-xl border border-outline/30">
                <span className="text-xs font-mono uppercase text-on-surface-variant block">Issuer Authority</span>
                <span className="font-semibold text-on-surface text-sm">Mapletyne Substation CA 01</span>
              </div>
              <div className="p-4 bg-surface-container-high/50 rounded-xl border border-outline/30">
                <span className="text-xs font-mono uppercase text-on-surface-variant block">Expiration</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">Valid (Expires in 428 days)</span>
              </div>
            </div>
          </div>

          {/* Assigned Master RFID Tokens - Flush Canvas */}
          <div className="space-y-4 pt-6 border-t border-outline/30">
            <div className="flex items-center justify-between pb-3 border-b border-outline/30">
              <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">credit_card</span>
                Assigned Master RFID Tokens
              </h3>
              <button 
                onClick={() => {
                  tokenMutation.mutate();
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 3000);
                }}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-primary text-on-primary flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">add_card</span>
                <span>Register Token</span>
              </button>
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left font-body text-sm" aria-label="Master RFID Tokens">
                <thead>
                  <tr className="border-b border-outline/30 bg-surface-container-high/40 text-xs font-sans text-on-surface-variant uppercase tracking-wider">
                    <th className="py-2.5 px-3">Tag UID</th>
                    <th className="py-2.5 px-3">Label / Assignment</th>
                    <th className="py-2.5 px-3">Scope</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/30 font-mono text-sm">
                  <tr className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-on-surface">04:A2:8B:91</td>
                    <td className="py-3 px-3 font-sans text-on-surface">Master Engineering Fleet Token</td>
                    <td className="py-3 px-3 font-sans text-on-surface-variant">Unrestricted / Priority 0</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-micro font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-on-surface">8B:22:FE:19</td>
                    <td className="py-3 px-3 font-sans text-on-surface">Emergency Maintenance Override Card</td>
                    <td className="py-3 px-3 font-sans text-on-surface-variant">Maintenance & Curtailment</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-micro font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Security Audit Trail - Flush Canvas */}
          <div className="space-y-4 pt-6 border-t border-outline/30">
            <h3 className="text-xl font-headline font-bold text-on-surface pb-3 border-b border-outline/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">history</span>
              Recent Dispatch Audit Trail
            </h3>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left font-body text-sm" aria-label="Audit Trail">
                <thead>
                  <tr className="border-b border-outline bg-surface-container-high/40 text-xs font-sans text-on-surface-variant uppercase tracking-wider">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Action Description</th>
                    <th className="py-2.5 px-3 font-mono">IP Address</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline text-sm">
                  <tr className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="py-3 px-3 text-on-surface-variant font-mono text-xs">11:42 AM</td>
                    <td className="py-3 px-3 font-medium text-on-surface">Adjusted Peak Shaving Threshold to 420 kW</td>
                    <td className="py-3 px-3 font-mono text-xs text-on-surface-variant">192.168.1.104</td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold text-micro uppercase">Success</td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="py-3 px-3 text-on-surface-variant font-mono text-xs">09:15 AM</td>
                    <td className="py-3 px-3 font-medium text-on-surface">Dispatched 50 kW BESS Discharge Command</td>
                    <td className="py-3 px-3 font-mono text-xs text-on-surface-variant">192.168.1.104</td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold text-micro uppercase">Success</td>
                  </tr>
                  <tr className="hover:bg-surface-container-high/30 transition-colors">
                    <td className="py-3 px-3 text-on-surface-variant font-mono text-xs">Yesterday</td>
                    <td className="py-3 px-3 font-medium text-on-surface">Rotated OCPP 2.0.1 Station TLS Private Key</td>
                    <td className="py-3 px-3 font-mono text-xs text-on-surface-variant">10.0.4.12</td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold text-micro uppercase">Success</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
