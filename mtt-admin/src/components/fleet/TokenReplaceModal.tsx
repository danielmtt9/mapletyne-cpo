import React, { useState } from 'react';
import type { TokenItem } from './TokenIssueModal';

interface TokenReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplace: (data: { new_uid: string; driver_name?: string; label?: string }) => void;
  token: TokenItem | null;
  isLoading?: boolean;
}

export const TokenReplaceModal: React.FC<TokenReplaceModalProps> = ({
  isOpen,
  onClose,
  onReplace,
  token,
  isLoading = false,
}) => {
  const [newUid, setNewUid] = useState('');
  const [driverName, setDriverName] = useState(token?.driver_name || '');
  const [label, setLabel] = useState(token?.label ? `${token.label} (Replacement)` : 'Replacement Badge');

  if (!isOpen || !token) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUid.trim()) return;
    onReplace({
      new_uid: newUid.trim(),
      driver_name: driverName.trim() || undefined,
      label: label.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface-container-low border border-outline-variant/30 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-[22px]">swap_horiz</span>
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Replace RFID Token / Badge
            </h2>
          </div>
          <button onClick={onClose} type="button" className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="bg-surface-container p-3 border border-outline-variant/20 space-y-1 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Current UID:</span>
            <span className="text-on-surface font-bold">{token.uid}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Driver:</span>
            <span className="text-on-surface">{token.driver_name || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Group:</span>
            <span className="text-secondary">{token.group_name || 'Public Pool'}</span>
          </div>
        </div>

        <p className="text-xs text-on-surface-variant font-body">
          Issuing a replacement will instantly <strong className="text-status-fault font-mono">block</strong> the old card UID and migrate driver privileges and group billing to the new UID.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 font-body text-xs">
          <div>
            <label className="block font-mono text-on-surface-variant uppercase mb-1">
              New Token UID / Card Tag
            </label>
            <input
              type="text"
              required
              value={newUid}
              onChange={(e) => setNewUid(e.target.value)}
              placeholder="e.g. 04FA5B6C7D"
              className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
            />
          </div>

          <div>
            <label className="block font-mono text-on-surface-variant uppercase mb-1">
              Driver Name
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
            />
          </div>

          <div>
            <label className="block font-mono text-on-surface-variant uppercase mb-1">
              New Token Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 h-9 px-3 text-on-surface font-mono"
            />
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
              disabled={isLoading || !newUid.trim()}
              className="px-5 py-2 bg-amber-500 text-black font-bold font-mono hover:bg-amber-400 transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                  <span>Confirm Swap & Replace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
