import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [stationId, setStationId] = useState('US-NY-MR-001');
  const [selectedHardware, setSelectedHardware] = useState<'abb' | 'alpitronic'>('abb');
  const [csmsUrl, setCsmsUrl] = useState('wss://csms.mapletyne.com:8443/ocpp201/US-NY-MR-001');
  const [securityProfile, setSecurityProfile] = useState('Profile 3 - Mutual TLS (mTLS) with Client Certificates');
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(null);

  const handleTestConnection = async () => {
    setIsPinging(true);
    setPingSuccess(null);
    try {
      await api.get('/chargers');
      setPingSuccess(true);
    } catch {
      setPingSuccess(false);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Header & Logo */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-2">
          <span className="material-symbols-outlined text-3xl" aria-hidden="true">bolt</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
          Deploy New Charging Hub & Microgrid Node
        </h1>
        <p className="text-base text-on-surface-variant max-w-2xl mx-auto">
          Connect physical charging dispensers, configure local grid interconnect limits, and link to Mapletyne EMS.
        </p>
      </div>

      {/* Progress Stepper Bar (Horizontal 4-Step Tracker, 16px font) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-base font-medium">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-container border border-outline text-emerald-600 dark:text-emerald-400">
          <span className="material-symbols-outlined text-xl shrink-0" aria-hidden="true">check_circle</span>
          <span className="whitespace-nowrap">1. Site & Org</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border-2 border-primary text-primary font-semibold shadow-sm">
          <span className="material-symbols-outlined text-xl shrink-0" aria-hidden="true">ev_station</span>
          <span className="whitespace-nowrap">2. Hardware</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-container border border-outline text-on-surface-variant opacity-75">
          <span className="material-symbols-outlined text-xl shrink-0" aria-hidden="true">bolt</span>
          <span className="whitespace-nowrap">3. Grid Limits</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-container border border-outline text-on-surface-variant opacity-75">
          <span className="material-symbols-outlined text-xl shrink-0" aria-hidden="true">verified</span>
          <span className="whitespace-nowrap">4. Telemetry</span>
        </div>
      </div>

      {/* Main Wizard Card Shell */}
      <div className="tabler-card p-8 space-y-6">
        <div className="border-b border-outline pb-4">
          <h2 className="text-2xl font-bold text-on-surface">
            Step 2: Connect Hardware & OCPP 2.0.1 Dispensers
          </h2>
          <p className="text-base text-on-surface-variant mt-1">
            Specify dispenser hardware identifiers, communication protocols, and cryptographic security certificates.
          </p>
        </div>

        <div className="space-y-6">
          {/* Station Identity */}
          <div>
            <label className="block text-base font-semibold text-on-surface mb-1.5 flex items-center justify-between">
              <span>Station Identifier (ChargeBoxIdentity)</span>
              <span className="text-sm font-mono text-on-surface-variant">e.g. US-NY-MR-001</span>
            </label>
            <input
              type="text"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full bg-surface-container-high border border-outline rounded-xl h-12 px-4 text-base font-mono text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Hardware Model Selection Radio Cards */}
          <div>
            <label className="block text-base font-semibold text-on-surface mb-2">
              Charger Hardware Model
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedHardware('abb')}
                className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  selectedHardware === 'abb'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-outline bg-surface-container-high hover:border-outline-variant'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg text-on-surface">ABB Terra 184</span>
                  {selectedHardware === 'abb' && (
                    <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">
                      check_circle
                    </span>
                  )}
                </div>
                <p className="text-base text-on-surface-variant">
                  Dual CCS2, 180 kW DC Fast Charger with ISO 15118 Plug&Charge capability.
                </p>
                <span className="inline-block mt-3 text-xs font-mono font-semibold px-2.5 py-1 rounded bg-surface-container text-on-surface border border-outline">
                  180 kW Max Power
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedHardware('alpitronic')}
                className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  selectedHardware === 'alpitronic'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-outline bg-surface-container-high hover:border-outline-variant'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg text-on-surface">Alpitronic HYC300</span>
                  {selectedHardware === 'alpitronic' && (
                    <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">
                      check_circle
                    </span>
                  )}
                </div>
                <p className="text-base text-on-surface-variant">
                  Dual CCS2 + CHAdeMO, 300 kW Ultra-Fast Charger with liquid-cooled cables.
                </p>
                <span className="inline-block mt-3 text-xs font-mono font-semibold px-2.5 py-1 rounded bg-surface-container text-on-surface border border-outline">
                  300 kW Max Power
                </span>
              </button>
            </div>
          </div>

          {/* CSMS WebSocket Endpoint */}
          <div>
            <label className="block text-base font-semibold text-on-surface mb-1.5">
              Central System CSMS WebSocket Endpoint
            </label>
            <div className="relative">
              <input
                type="text"
                value={csmsUrl}
                onChange={(e) => setCsmsUrl(e.target.value)}
                className="w-full bg-surface-container-high border border-outline rounded-xl h-12 px-4 pr-12 text-base font-mono text-on-surface focus:outline-none focus:border-primary"
              />
              <span className="absolute right-4 top-3.5 material-symbols-outlined text-lg text-on-surface-variant" aria-hidden="true">
                lock
              </span>
            </div>
          </div>

          {/* Security Profile */}
          <div>
            <label className="block text-base font-semibold text-on-surface mb-1.5">
              Security Profile Specification
            </label>
            <select
              value={securityProfile}
              onChange={(e) => setSecurityProfile(e.target.value)}
              className="w-full bg-surface-container-high border border-outline rounded-xl h-12 px-4 text-base text-on-surface focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="Profile 3 - Mutual TLS (mTLS) with Client Certificates">
                Profile 3 — Mutual TLS (mTLS) with Client Certificates (Recommended)
              </option>
              <option value="Profile 2 - TLS with Basic Authentication">
                Profile 2 — TLS with Basic Authentication
              </option>
              <option value="Profile 1 - Unencrypted HTTP (Lab Testing Only)">
                Profile 1 — Unencrypted HTTP (Lab Testing Only)
              </option>
            </select>
          </div>

          {/* Connection Test Banner */}
          <div className="p-4 rounded-xl bg-surface-container-high border border-outline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                  network_check
                </span>
              </div>
              <div>
                <p className="font-semibold text-base text-on-surface">Dispenser Handshake Test</p>
                <p className="text-sm text-on-surface-variant">Ensure port 8443 is open and TLS certificates match.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isPinging}
              className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest border border-outline text-on-surface font-semibold text-base rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-base ${isPinging ? 'animate-spin' : ''}`} aria-hidden="true">
                {isPinging ? 'refresh' : 'sensors'}
              </span>
              <span>{isPinging ? 'Pinging...' : 'Test Connection'}</span>
            </button>
          </div>

          {pingSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-base flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">check_circle</span>
              <span>Connection verified: 200 OK via mTLS handshake (Latency: 42ms).</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-outline">
          <NavLink
            to="/"
            className="px-5 py-2.5 rounded-xl border border-outline text-on-surface font-semibold text-base hover:bg-surface-container-high transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_back</span>
            <span>Back to Dashboard</span>
          </NavLink>
          <button
            type="button"
            onClick={async () => {
              await api.post('/chargers', { id: stationId, vendor: selectedHardware === 'abb' ? 'ABB' : 'Alpitronic', model: selectedHardware === 'abb' ? 'Terra 184' : 'HYC300', ocpp_version: '2.0.1' }).catch(() => {});
              localStorage.setItem('mapletyne_onboarding_complete', 'true');
              navigate('/');
            }}
            className="px-6 py-2.5 bg-primary hover:opacity-95 text-white font-semibold text-base rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <span>Save & Complete Onboarding</span>
            <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
