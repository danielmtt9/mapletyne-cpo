import React from 'react';
import { NavLink } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="tabler-card p-8 sm:p-12 max-w-xl w-full text-center space-y-6 shadow-xl border border-outline">
        {/* Error Badge Icon */}
        <div className="w-20 h-20 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-sm">
          <span className="material-symbols-outlined text-5xl" aria-hidden="true">
            cloud_off
          </span>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 inline-block">
            ERR_ROUTE_NOT_FOUND (404)
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">
            Substation View or Route Not Found
          </h1>
          <p className="text-base text-on-surface-variant max-w-md mx-auto">
            The requested charging facility node, dispenser asset, or telemetry view does not exist in the active Mapletyne CSMS registry.
          </p>
        </div>

        {/* Monospace Diagnostic Terminal Box */}
        <div className="p-4 bg-surface-container-high rounded-xl text-left font-mono text-xs text-on-surface-variant space-y-1 border border-outline">
          <div className="text-rose-600 dark:text-rose-400 font-semibold">[ROUTER-GATEWAY] HTTP 404: Endpoint unresolved</div>
          <div>[REGISTRY] Checked: /chargers, /sessions, /ems, /fleet, /settings</div>
          <div className="text-on-surface">Path: {window.location.pathname}</div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <NavLink
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-primary hover:opacity-95 text-white font-semibold text-base rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">dashboard</span>
            <span>Return to Dashboard</span>
          </NavLink>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-outline bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_back</span>
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
