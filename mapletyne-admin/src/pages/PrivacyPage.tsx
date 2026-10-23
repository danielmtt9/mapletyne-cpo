import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-on-surface mb-2">Privacy Policy &amp; GDPR Data Governance</h1>
          <p className="text-base text-on-surface-variant">Effective Date: 2025-01-01 · Last Updated: 2025-07-11</p>
        </div>

        {/* Data Controller */}
        <section className="mb-8 tabler-card p-6 rounded-2xl border border-outline">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Data Controller</h2>
          <p className="text-base text-on-surface-variant leading-relaxed">
            <strong>Mapletyne Technologies Ltd</strong> is the data controller for all personal data processed through the Mapletyne OpenCPO platform (OCPP CDRs, user accounts, telemetry, and related services).
          </p>
        </section>

        {/* Lawful Basis */}
        <section className="mb-8 tabler-card p-6 rounded-2xl border border-outline">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Lawful Basis for Processing (GDPR Art. 6)</h2>
          <ul className="space-y-2 text-base text-on-surface-variant leading-relaxed list-disc pl-5">
            <li><strong>Contractual Necessity</strong> — Processing is necessary to perform the subscription agreement and deliver charging management, session logging, and fleet operations services.</li>
            <li><strong>Legitimate Interests</strong> — Security monitoring, fraud prevention, platform analytics, and service improvement.</li>
            <li><strong>Consent</strong> — Optional telemetry, marketing communications, and non-essential cookies are processed only with explicit user consent.</li>
            <li><strong>Legal Obligation</strong> — Retention of transaction records for tax, audit, and regulatory compliance (e.g., OCPP CDRs).</li>
          </ul>
        </section>

        {/* Data We Collect */}
        <section className="mb-8 tabler-card p-6 rounded-2xl border border-outline">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Data We Collect</h2>
          <div className="space-y-4 text-base text-on-surface-variant leading-relaxed">
            <div>
              <h3 className="font-semibold text-on-surface mb-1">OCPP CDRs (Charge Detail Records)</h3>
              <p>Timestamp, connector ID, energy delivered (kWh), duration, cost, and transaction reference. Stored for billing, audit, and grid analytics.</p>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface mb-1">Account &amp; Identity Data</h3>
              <p>Name, email address, role, authentication tokens, and company details for access management.</p>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface mb-1">Telemetry &amp; Usage Data</h3>
              <p>Platform performance metrics, error logs, feature usage analytics, and device information (collected only with consent).</p>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface mb-1">Cookies &amp; Similar Technologies</h3>
              <p>Essential cookies for session management; optional analytics and preference cookies governed by the cookie consent banner.</p>
            </div>
          </div>
        </section>

        {/* Retention Periods */}
        <section className="mb-8 tabler-card p-6 rounded-2xl border border-outline">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Retention Periods</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-outline">
                  <th className="py-2 pr-4 font-semibold text-on-surface">Data Category</th>
                  <th className="py-2 pr-4 font-semibold text-on-surface">Retention Period</th>
                  <th className="py-2 font-semibold text-on-surface">Rationale</th>
                </tr>
              </thead>
              <tbody className="text-on-surface-variant">
                <tr className="border-b border-outline/50">
                  <td className="py-3 pr-4">OCPP CDRs (transaction records)</td>
                  <td className="py-3 pr-4 font-mono">7 years</td>
                  <td className="py-3">Tax, audit &amp; regulatory compliance</td>
                </tr>
                <tr className="border-b border-outline/50">
                  <td className="py-3 pr-4">User account data</td>
                  <td className="py-3 pr-4 font-mono">Duration of subscription + 90 days</td>
                  <td className="py-3">Service continuity &amp; migration</td>
                </tr>
                <tr className="border-b border-outline/50">
                  <td className="py-3 pr-4">Authentication logs</td>
                  <td className="py-3 pr-4 font-mono">1 year</td>
                  <td className="py-3">Security &amp; fraud prevention</td>
                </tr>
                <tr className="border-b border-outline/50">
                  <td className="py-3 pr-4">Telemetry data (with consent)</td>
                  <td className="py-3 pr-4 font-mono">13 months</td>
                  <td className="py-3">Analytics &amp; product improvement</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Cookies (non-essential)</td>
                  <td className="py-3 pr-4 font-mono">12 months</td>
                  <td className="py-3">Preference &amp; analytics persistence</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Sub-processors */}
        <section className="mb-8 tabler-card p-6 rounded-2xl border border-outline">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Sub-processors</h2>
          <p className="text-base text-on-surface-variant leading-relaxed mb-4">
            We engage the following sub-processors to deliver platform services. All are bound by GDPR-compliant Data Processing Agreements (DPAs):
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-outline">
                  <th className="py-2 pr-4 font-semibold text-on-surface">Sub-processor</th>
                  <th className="py-2 pr-4 font-semibold text-on-surface">Purpose</th>
                  <th className="py-2 font-semibold text-on-surface">Location</th>
                </tr>
              </thead>
              <tbody className="text-on-surface-variant">
                <tr className="border-b border-outline/50">
                  <td className="py-3 pr-4">Amazon Web Services (AWS)</td>
                  <td className="py-3 pr-4">Cloud infrastructure &amp; hosting</td>
                  <td className="py-3">EU (Frankfurt / Ireland)</td>
                </tr>
                <tr className="border-b border-outline/50">
                  <td className="py-3 pr-4">Vercel Inc.</td>
                  <td className="py-3 pr-4">Frontend hosting &amp; edge functions</td>
                  <td className="py-3">US (with SCCs)</td>
                </tr>
                <tr className="border-b border-outline/50">
                  <td className="py-3 pr-4">Supabase / PostgreSQL</td>
                  <td className="py-3 pr-4">Database &amp; authentication</td>
                  <td className="py-3">EU (Frankfurt)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Datadog Inc.</td>
                  <td className="py-3 pr-4">Monitoring &amp; observability</td>
                  <td className="py-3">US (with SCCs)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Data Subject Rights */}
        <section className="mb-8 tabler-card p-6 rounded-2xl border border-outline">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Your Rights (GDPR Arts. 15–22)</h2>
          <ul className="space-y-2 text-base text-on-surface-variant leading-relaxed list-disc pl-5">
            <li><strong>Right of Access</strong> — Request a copy of your personal data.</li>
            <li><strong>Right to Rectification</strong> — Correct inaccurate or incomplete data.</li>
            <li><strong>Right to Erasure ("Right to be Forgotten")</strong> — Request deletion of your data.</li>
            <li><strong>Right to Restrict Processing</strong> — Limit how we use your data.</li>
            <li><strong>Right to Data Portability</strong> — Receive your data in a machine-readable format.</li>
            <li><strong>Right to Object</strong> — Object to processing based on legitimate interests or direct marketing.</li>
          </ul>
        </section>

        {/* DSAR Contact */}
        <section className="mb-8 tabler-card p-6 rounded-2xl border border-outline bg-primary/5">
          <h2 className="text-xl font-semibold text-on-surface mb-3">Data Protection Officer &amp; DSAR Contact</h2>
          <p className="text-base text-on-surface-variant leading-relaxed mb-4">
            For any data protection inquiries, to submit a Data Subject Access Request (DSAR), or to exercise your GDPR rights, please contact our DPO:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <a
              href="mailto:privacy@mapletyne.com"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-container transition-colors min-h-[44px]"
            >
              <span className="material-symbols-outlined">mail</span>
              privacy@mapletyne.com
            </a>
            <span className="text-sm text-on-surface-variant">
              We respond to all DSARs within 30 days.
            </span>
          </div>
        </section>

        {/* Footer Links */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-outline text-sm">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-on-surface hover:text-primary font-semibold rounded-xl hover:bg-surface-container-high transition-colors min-h-[44px]"
          >
            <span className="material-symbols-outlined text-base">home</span>
            Back to Dashboard
          </Link>
          <span className="text-on-surface-variant">·</span>
          <Link
            to="/terms"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-on-surface hover:text-primary font-semibold rounded-xl hover:bg-surface-container-high transition-colors min-h-[44px]"
          >
            <span className="material-symbols-outlined text-base">description</span>
            Terms of Service
          </Link>
        </section>
      </div>
    </div>
  );
};
