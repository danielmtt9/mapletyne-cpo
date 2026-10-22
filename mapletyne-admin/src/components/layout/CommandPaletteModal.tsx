import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const commands = [
    { label: 'Executive Dashboard', path: '/', category: 'Navigation', icon: 'dashboard' },
    { label: 'Hardware Chargers', path: '/chargers', category: 'Navigation', icon: 'ev_station' },
    { label: 'Sessions & Ledger', path: '/sessions', category: 'Navigation', icon: 'receipt_long' },
    { label: 'Energy Management (EMS)', path: '/ems', category: 'Navigation', icon: 'bolt' },
    { label: 'Tariffs & Dynamic Pricing', path: '/tariffs', category: 'Navigation', icon: 'payments' },
    { label: 'RFID Tokens & Fleet Groups', path: '/fleet', category: 'Navigation', icon: 'badge' },
    { label: 'Fleet Vehicles Roster', path: '/vehicles', category: 'Navigation', icon: 'directions_car' },
    { label: 'PKI Security Vault', path: '/pki', category: 'Navigation', icon: 'vpn_key' },
    { label: 'OCPI Roaming Network', path: '/roaming', category: 'Navigation', icon: 'hub' },
    { label: 'Operator User Profile', path: '/profile', category: 'Account', icon: 'account_circle' },
    { label: 'Site Onboarding Wizard', path: '/onboarding', category: 'Operations', icon: 'add_circle' },
    { label: 'Terms of Service & Compliance', path: '/terms', category: 'Compliance', icon: 'description' },
    { label: 'System Settings & Backups', path: '/settings', category: 'Settings', icon: 'settings' },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div 
        className="w-full max-w-xl tabler-card bg-surface-container overflow-hidden shadow-2xl border border-outline animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-outline gap-3">
          <span className="material-symbols-outlined text-2xl text-on-surface-variant" aria-hidden="true">
            search
          </span>
          <input
            type="text"
            placeholder="Type a command or navigate..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-base text-on-surface placeholder:text-on-surface-variant focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-base">
              No matching commands or pages found.
            </div>
          ) : (
            filteredCommands.map((cmd) => (
              <button
                key={cmd.path}
                onClick={() => {
                  navigate(cmd.path);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-base text-on-surface hover:bg-surface-container-high transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-on-surface-variant group-hover:text-primary transition-colors" aria-hidden="true">
                    {cmd.icon}
                  </span>
                  <span className="font-medium text-base">{cmd.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant border border-outline">
                    {cmd.category}
                  </span>
                  <span className="material-symbols-outlined text-lg text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                    arrow_forward
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-surface-container-high border-t border-outline flex items-center justify-between text-xs text-on-surface-variant font-mono">
          <span>Navigate with mouse or arrow keys</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
