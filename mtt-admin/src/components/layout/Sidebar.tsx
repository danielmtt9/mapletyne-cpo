import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '@/lib/theme-provider';
import { useAuth } from '@/context/AuthContext';
import { 
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
  LogOut,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';

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

  const navGroups = [
    {
      title: 'Operations',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Chargers', path: '/chargers', icon: Zap },
        { label: 'Sessions', path: '/sessions', icon: Receipt },
      ],
    },
    {
      title: 'Energy & EMS',
      items: [
        { label: 'Energy (EMS)', path: '/ems', icon: Activity },
        { label: 'Tariffs', path: '/tariffs', icon: Coins },
      ],
    },
    {
      title: 'Fleet & Access',
      items: [
        { label: 'RFID & Fleet', path: '/fleet', icon: Users },
        { label: 'Vehicles', path: '/vehicles', icon: Car },
      ],
    },
    {
      title: 'Security & Network',
      items: [
        { label: 'PKI Vault', path: '/pki', icon: ShieldCheck },
        { label: 'Roaming (OCPI)', path: '/roaming', icon: Globe },
      ],
    },
  ];

  return (
    <aside 
      className={`h-screen ${
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      } material-sidebar flex flex-col z-30 select-none transition-all duration-300 ease-out shrink-0`}
    >
      {/* Brand Header */}
      <div className={`p-4 mb-1 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-white/5`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-primary/20 border border-white/10 text-white flex items-center justify-center font-bold text-base shadow-apple-sm shrink-0 overflow-hidden">
            {branding.logo_data_uri || branding.logo_url ? (
              <img
                src={branding.logo_data_uri || branding.logo_url}
                alt={branding.company_name || 'Logo'}
                className="w-full h-full object-contain p-0.5"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-primary font-headline text-sm font-extrabold">
                {branding.company_name ? branding.company_name.charAt(0).toUpperCase() : '⚡'}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              {branding.company_name ? (
                <span className="font-semibold text-sm tracking-tight text-white block truncate">
                  {branding.company_name}
                </span>
              ) : null}
              <span className="text-[11px] font-sans font-medium tracking-tight text-slate-400 block truncate">
                {branding.app_title || 'Charge Station Management System'}
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 px-2.5 py-2 space-y-4 overflow-y-auto" aria-label="Main Navigation">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25 shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Status & User Profile */}
      <div className="mt-auto p-3 border-t border-white/5 space-y-2 bg-slate-950/40">
        {/* Expand button when collapsed */}
        {onToggleCollapse && isCollapsed && (
          <button
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            className="w-full py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Live Event Bus SSE Indicator */}
        <div 
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between px-2'
          } py-1 text-[11px] font-mono text-slate-400`}
          title={isLiveConnected ? 'SSE Event Bus Streaming' : 'SSE Event Bus Reconnecting'}
        >
          {!isCollapsed && (
            <span className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-slate-400" />
              <span>EVENT BUS</span>
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {!isCollapsed && (
              <span
                className={`text-[10px] uppercase font-bold ${
                  isLiveConnected ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isLiveConnected ? 'Live' : 'Reconnecting'}
              </span>
            )}
          </div>
        </div>

        {/* Settings Link */}
        <NavLink
          to="/settings"
          title={isCollapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            `flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-3'} py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          {!isCollapsed && <span className="ml-3 truncate">Settings</span>}
        </NavLink>

        {/* User Profile Pill */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-2'} pt-2 border-t border-white/5`}>
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600/30 to-primary/30 border border-blue-400/30 text-blue-300 flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-sm">
              {user.initials || 'DA'}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-semibold text-slate-100 truncate" title={user.name}>
                  {user.name}
                </p>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tight truncate" title={user.role}>
                  {user.role}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
