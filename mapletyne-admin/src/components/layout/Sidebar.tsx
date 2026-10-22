import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '@/lib/theme-provider';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isLiveConnected: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isLiveConnected, 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const { branding } = useTheme();
  const { user, logout } = useAuth();

  const companyName = branding.company_name || 'Mapletyne';
  const companyNameSizeClass =
    companyName.length > 22
      ? 'text-sm leading-snug'
      : companyName.length > 14
      ? 'text-base leading-snug'
      : 'text-lg leading-tight';

  const navGroups = [
    {
      title: 'Operations',
      items: [
        { label: 'Executive Dashboard', path: '/', icon: 'dashboard' },
        { label: 'Hardware Chargers', path: '/chargers', icon: 'ev_station' },
        { label: 'Sessions & Ledger', path: '/sessions', icon: 'receipt_long' },
      ],
    },
    {
      title: 'Energy & Microgrid',
      items: [
        { label: 'Energy Management (EMS)', path: '/ems', icon: 'bolt' },
        { label: 'Tariffs & Pricing', path: '/tariffs', icon: 'payments' },
      ],
    },
    {
      title: 'Fleet & Security',
      items: [
        { label: 'RFID Tokens & Fleet', path: '/fleet', icon: 'badge' },
        { label: 'Fleet Vehicles Roster', path: '/vehicles', icon: 'directions_car' },
        { label: 'PKI Security Vault', path: '/pki', icon: 'vpn_key' },
        { label: 'OCPI Roaming Network', path: '/roaming', icon: 'hub' },
      ],
    },
    {
      title: 'System & Legal',
      items: [
        { label: 'System Settings', path: '/settings', icon: 'settings' },
        { label: 'Terms & Compliance', path: '/terms', icon: 'description' },
      ],
    },
  ];

  return (
    <aside 
      className={`h-screen ${
        isCollapsed ? 'w-[72px]' : 'w-fit min-w-[280px] max-w-[340px]'
      } tabler-sidebar flex flex-col z-30 select-none transition-all duration-200 ease-out shrink-0 sticky top-0 overflow-x-hidden`}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header (Dynamic height >= 64px, zero text truncation) */}
      <div className={`min-h-[64px] px-4 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-2'} border-b border-white/10 shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            {branding.logo_data_uri || branding.logo_url ? (
              <img
                src={branding.logo_data_uri || branding.logo_url}
                alt={companyName}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="material-symbols-outlined text-2xl text-emerald-400" aria-hidden="true">
                bolt
              </span>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`font-bold ${companyNameSizeClass} tracking-tight text-white break-words`}>
                  {companyName}
                </span>
                <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                  v2.4
                </span>
              </div>
              <span className="text-xs font-medium leading-snug tracking-tight text-slate-400 block mt-0.5 break-words">
                {branding.portal_tagline || 'EMS & CSMS Hub'}
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button (>=40x40px desktop hit target) */}
        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
            className="w-10 h-10 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              chevron_left
            </span>
          </button>
        )}
      </div>

      {/* Navigation Links: Strict 4px/8px Grid, Clean Pill State (No Left Highlight Bar, No Ellipses) */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto flex flex-col justify-start" aria-label="Main Navigation">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 whitespace-nowrap">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center min-h-[44px] ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-white/10 text-emerald-400 font-semibold'
                        : 'text-slate-300 font-medium hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <span 
                    className="material-symbols-outlined text-[24px] shrink-0" 
                    aria-hidden="true"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'opsz' 24" }}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="ml-3 whitespace-nowrap tracking-tight">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Status & User Profile */}
      <div className="mt-auto px-3 py-4 border-t border-white/10 space-y-3 bg-slate-950/80 shrink-0">
        {/* Expand button when collapsed */}
        {onToggleCollapse && isCollapsed && (
          <button
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
            className="w-full min-h-[40px] rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              chevron_right
            </span>
          </button>
        )}

        {/* Live Event Bus SSE Indicator */}
        <div 
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-lg bg-white/[0.04] border border-white/5 text-xs font-mono text-slate-300`}
          title={isLiveConnected ? 'SSE Event Bus Streaming' : 'SSE Event Bus Reconnecting'}
        >
          {!isCollapsed && (
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-400" aria-hidden="true">
                wifi_tethering
              </span>
              <span className="tracking-wide">SSE STREAM</span>
            </span>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLiveConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' : 'bg-rose-500'
              }`}
            />
            {!isCollapsed && (
              <span
                className={`text-xs uppercase font-bold tracking-wider ${
                  isLiveConnected ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isLiveConnected ? 'Connected' : 'Offline'}
              </span>
            )}
          </div>
        </div>

        {/* User Profile Pill with Direct Link to Profile (No Ellipses) */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-2 px-1'} pt-2 border-t border-white/10`}>
          <NavLink
            to="/profile"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            title={`${user.name || 'Elena Vance'} (${user.role || 'Director of Grid Operations'})`}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600/40 to-primary/40 border border-emerald-400/40 text-emerald-300 flex items-center justify-center text-sm font-bold font-mono shrink-0 shadow-sm">
              {user.initials || 'EV'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-white leading-snug break-words">
                  {user.name || 'Elena Vance'}
                </p>
                <p className="text-xs font-mono text-slate-400 uppercase tracking-tight leading-snug break-words mt-0.5">
                  {user.role || 'Director of Grid Ops'}
                </p>
              </div>
            )}
          </NavLink>
          {!isCollapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="w-10 h-10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                logout
              </span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
