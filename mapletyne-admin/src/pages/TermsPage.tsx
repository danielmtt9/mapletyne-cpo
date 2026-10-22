import React, { useState } from 'react';

export const TermsPage: React.FC = () => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(Boolean(localStorage.getItem('mapletyne_terms_signature')));

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAgreed) return;
    const sigRecord = { signedAt: new Date().toISOString(), digest: 'SHA256:' + btoa(new Date().toISOString()).slice(0, 16) };
    localStorage.setItem('mapletyne_terms_signature', JSON.stringify(sigRecord));
    setSignatureSaved(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline">
        <div>
          <h1 className="font-bold text-3xl sm:text-4xl tracking-tight text-on-surface">
            Enterprise Terms of Service & Grid Compliance
          </h1>
          <p className="text-base text-on-surface-variant mt-1">
            Master service terms, microgrid interconnection agreements, and automated curtailment covenants.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border border-outline bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-base transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">download</span>
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Two-Column Documentation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sticky Table of Contents (1 col) */}
        <div className="tabler-card p-5 sticky top-20 space-y-3">
          <h2 className="text-lg font-bold text-on-surface pb-2 border-b border-outline">
            Agreement Sections
          </h2>
          <nav className="space-y-1.5 text-base font-medium">
            <a 
              href="#section-1" 
              className="flex items-center gap-2 p-2 rounded-lg text-primary bg-primary/10 font-semibold"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">gavel</span>
              <span>1. Master Service Terms</span>
            </a>
            <a 
              href="#section-2" 
              className="flex items-center gap-2 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">bolt</span>
              <span>2. Grid Curtailment</span>
            </a>
            <a 
              href="#section-3" 
              className="flex items-center gap-2 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">security</span>
              <span>3. NERC CIP Data Security</span>
            </a>
            <a 
              href="#section-4" 
              className="flex items-center gap-2 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">payments</span>
              <span>4. Automated Settlement</span>
            </a>
            <a 
              href="#section-5" 
              className="flex items-center gap-2 p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">verified</span>
              <span>5. SLA & Interconnect</span>
            </a>
          </nav>

          <div className="pt-4 border-t border-outline text-xs text-on-surface-variant font-mono">
            <span>Version: 2.4-GA</span>
            <span className="block mt-0.5">Effective: Oct 2026</span>
          </div>
        </div>

        {/* Right Content Pane (3 cols) */}
        <div className="lg:col-span-3 tabler-card p-8 space-y-8">
          {/* Section 1 */}
          <section id="section-1" className="space-y-3">
            <h2 className="text-2xl font-bold text-on-surface">
              1. Master Service & Microgrid Operations Terms
            </h2>
            <p className="text-base text-on-surface leading-relaxed">
              This Enterprise Agreement governs the deployment, telemetry monitoring, and automated smart power dispatch across all charging stations and Battery Energy Storage Systems (BESS) orchestrated by the Mapletyne EMS platform.
            </p>
            <p className="text-base text-on-surface-variant leading-relaxed">
              By authorizing connection of physical dispensers, the Operator grants Mapletyne continuous rights to balance electrical loads, negotiate ISO/RTO ancillary services, and optimize wholesale energy spot market tariffs.
            </p>
          </section>

          {/* Section 2 with Curtailment Callout */}
          <section id="section-2" className="space-y-4 pt-4 border-t border-outline">
            <h2 className="text-2xl font-bold text-on-surface">
              2. Grid Interconnection & Emergency Curtailment Protocols
            </h2>
            <div className="p-4 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-on-surface space-y-2">
              <div className="flex items-center gap-2 font-bold text-base text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined text-xl" aria-hidden="true">warning</span>
                <span>Mandatory 5-Minute Demand Response Curtailment</span>
              </div>
              <p className="text-base leading-relaxed">
                During utility grid stress events or substation transformer over-temperature alarms, Mapletyne EMS will automatically throttle non-critical charging dispensers to 50 kW per port within 300 seconds to avoid utility peak demand surcharges.
              </p>
            </div>
            <p className="text-base text-on-surface leading-relaxed">
              Emergency curtailment triggers are logged as cryptographically verified audit records in the PKI Vault with millisecond-accurate NTP timestamps.
            </p>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="space-y-3 pt-4 border-t border-outline">
            <h2 className="text-2xl font-bold text-on-surface">
              3. NERC CIP Compliance & Telemetry Data Governance
            </h2>
            <p className="text-base text-on-surface leading-relaxed">
              All bidirectional communications between the charging station hardware and the central system must adhere to OCPP 2.0.1 Security Profile 3 utilizing mutual TLS (mTLS) with elliptical curve cryptography (ECDSA P-384).
            </p>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="space-y-3 pt-4 border-t border-outline">
            <h2 className="text-2xl font-bold text-on-surface">
              4. Automated Billing & Revenue Settlement
            </h2>
            <p className="text-base text-on-surface leading-relaxed">
              All EV charging sessions, roaming OCPI CDR transactions, and demand-response capacity credits are reconciled on a 24-hour settlement cadence with automated ledger export.
            </p>
          </section>

          {/* Section 5: Electronic Execution Panel */}
          <section id="section-5" className="pt-6 border-t border-outline space-y-4">
            <h2 className="text-2xl font-bold text-on-surface">
              5. Operator Electronic Acknowledgment & Signature
            </h2>

            {signatureSaved ? (
              <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-base space-y-2">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <span className="material-symbols-outlined text-2xl" aria-hidden="true">verified</span>
                  <span>Agreement Digitally Signed & Sealed</span>
                </div>
                <p className="font-mono text-sm">
                  Signatory: Elena Vance (Director of Grid Operations) • Timestamp: {new Date().toISOString()} • Digest: SHA256:4f89..b201
                </p>
              </div>
            ) : (
              <form onSubmit={handleSign} className="p-6 bg-surface-container-high rounded-xl space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="w-5 h-5 rounded border-outline text-primary focus:ring-primary mt-1"
                  />
                  <span className="text-base font-medium text-on-surface">
                    I acknowledge and agree to the Mapletyne Enterprise Service Agreement, ISO/RTO microgrid curtailment covenants, and NERC CIP data governance policies on behalf of the registered facility.
                  </span>
                </label>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm font-mono text-on-surface-variant">
                    Digital Signature: Elena Vance (Authorized Officer)
                  </div>
                  <button
                    type="submit"
                    disabled={!hasAgreed}
                    className="px-6 py-2.5 bg-primary hover:opacity-95 text-white font-semibold text-base rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">draw</span>
                    <span>Sign Agreement</span>
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
