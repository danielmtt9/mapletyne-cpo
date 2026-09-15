import React, { useState } from 'react';
import type { TokenItem } from './TokenIssueModal';

interface TokenBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlock: (reason?: string) => void;
  token: TokenItem | null;
  isLoading?: boolean;
}

export const TokenBlockModal: React.FC<TokenBlockModalProps> = ({
  isOpen,
  onClose,
  onBlock,
  token,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('Lost or damaged card');

  if (!isOpen || !token) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBlock(reason.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface-container-low border border-outline-variant/30 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-status-fault text-[22px]">block</span>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Block Token Authorization
            </h2>
          </div>
          <button onClick={onClose} type="button" className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="bg-surface-container p-3 border border-outline-variant/20 space-y-1 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">UID:</span>
            <span className="text-on-surface font-bold">{token.uid}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Driver:</span>
            <span className="text-on-surface">{token.driver_name || '—'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-body text-xs">
          <div>
            <label className="block font-mono text-on-surface-variant uppercase mb-1">
              Reason for Blocking (Audit Log)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono mb-2"
            >
              <option value="Lost or damaged card">Lost or damaged card</option>
              <option value="Reported stolen">Reported stolen</option>
              <option value="Driver contract terminated">Driver contract terminated</option>
              <option value="Payment arrears / billing issue">Payment arrears / billing issue</option>
              <option value="Temporary security hold">Temporary security hold</option>
              <option value="Custom">Other (Specify below)</option>
            </select>
            {reason === 'Custom' && (
              <input
                type="text"
                required
                placeholder="Enter specific audit reason..."
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-status-fault text-white font-bold font-mono hover:bg-status-fault/90 transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Blocking...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">block</span>
                  <span>Confirm Block</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
