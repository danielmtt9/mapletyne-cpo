import React, { useState } from 'react';

interface EmsOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  currentOverrideKw?: number | null;
  isOverrideActive: boolean;
  onApplyOverride: (data: { site_id: string; override_kw: number; duration_seconds: number; reason: string }) => void;
  onCancelOverride: (siteId: string) => void;
  isLoading?: boolean;
}

export const EmsOverrideModal: React.FC<EmsOverrideModalProps> = ({
  isOpen,
  onClose,
  siteId,
  currentOverrideKw,
  isOverrideActive,
  onApplyOverride,
  onCancelOverride,
  isLoading = false,
}) => {
  const [overrideKw, setOverrideKw] = useState<number>(currentOverrideKw || 350.0);
  const [durationSeconds, setDurationSeconds] = useState<number>(300);
  const [reason, setReason] = useState('SCADA_GRID_CURTAILMENT_EVENT');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyOverride({
      site_id: siteId,
      override_kw: Number(overrideKw),
      duration_seconds: Number(durationSeconds),
      reason,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface-container-low border border-outline-variant/30 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[22px]">electrical_services</span>
            <h3 className="font-headline text-base font-bold text-on-surface">
              External SCADA / EMS Override
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {isOverrideActive && (
          <div className="p-3 bg-error/15 border border-error/30 text-xs text-error flex items-center justify-between">
            <div>
              <span className="font-bold block">Active Hard Power Cap</span>
              <span>Currently capped at {currentOverrideKw} kW</span>
            </div>
            <button
              type="button"
              onClick={() => onCancelOverride(siteId)}
              className="px-3 py-1 bg-error text-white font-semibold rounded hover:bg-error/90 transition-colors"
            >
              Cancel Override
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-on-surface-variant font-medium block mb-1 uppercase tracking-wider">
              Hard Power Limit Cap (kW) *
            </label>
            <input
              type="number"
              required
              step="1"
              min="0"
              value={overrideKw}
              onChange={(e) => setOverrideKw(Number(e.target.value))}
              className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-on-surface-variant font-medium block mb-1 uppercase tracking-wider">
              Fail-Safe Watchdog Timeout (Seconds) *
            </label>
            <select
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface"
            >
              <option value="60">1 Minute (60s test)</option>
              <option value="300">5 Minutes (300s standard)</option>
              <option value="900">15 Minutes (900s)</option>
              <option value="3600">1 Hour (3600s)</option>
              <option value="14400">4 Hours (14400s)</option>
            </select>
            <p className="text-[10px] text-on-surface-variant mt-1">
              If no heartbeat/refresh is received from the external system before the watchdog expires, the EMS automatically reverts to normal automated site limits.
            </p>
          </div>

          <div>
            <label className="text-on-surface-variant font-medium block mb-1 uppercase tracking-wider">
              Curtailment Reason / Event Code
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold bg-error text-white hover:bg-error/90 transition-all flex items-center gap-1 shadow disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              {isLoading ? 'Applying...' : 'Enforce SCADA Cap'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
