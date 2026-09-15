import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  LayoutDashboard, 
  Zap, 
  Receipt, 
  Activity, 
  Coins, 
  Users, 
  Car, 
  ShieldCheck, 
  Globe, 
  Settings,
  ArrowRight,
  X
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const commands = [
    { label: 'Dashboard Overview', path: '/', category: 'Navigation', icon: LayoutDashboard },
    { label: 'Hardware Chargers', path: '/chargers', category: 'Navigation', icon: Zap },
    { label: 'Sessions & Ledger', path: '/sessions', category: 'Navigation', icon: Receipt },
    { label: 'Energy Management (EMS)', path: '/ems', category: 'Navigation', icon: Activity },
    { label: 'Tariffs & Dynamic Pricing', path: '/tariffs', category: 'Navigation', icon: Coins },
    { label: 'RFID Tokens & Fleet Groups', path: '/fleet', category: 'Navigation', icon: Users },
    { label: 'Fleet Vehicles Roster', path: '/vehicles', category: 'Navigation', icon: Car },
    { label: 'PKI Security Vault', path: '/pki', category: 'Navigation', icon: ShieldCheck },
    { label: 'OCPI Roaming Network', path: '/roaming', category: 'Navigation', icon: Globe },
    { label: 'System Settings & Backups', path: '/settings', category: 'Settings', icon: Settings },
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
        } else {
          // Open handled by parent or state
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-apple-modal overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search views... (e.g. Chargers, EMS, Tariffs)"
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-md text-slate-300">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.path}
                  onClick={() => {
                    navigate(cmd.path);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-medium text-slate-200 group-hover:text-white block">
                        {cmd.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {cmd.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-sm text-slate-400">
              No matching destinations found for "{query}".
            </div>
          )}
        </div>

        {/* Footer Shortcut Tips */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Navigate with arrows</span>
          <span>Select with ↵ Enter</span>
        </div>
      </div>
    </div>
  );
};
