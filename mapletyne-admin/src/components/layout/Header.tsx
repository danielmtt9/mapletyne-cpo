import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useSiteContext } from '@/context/SiteContext';
import { useTheme } from '@/lib/theme-provider';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
  selectedSite?: string;
  onSiteChange?: (site: string) => void;
  onOpenCommand?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  selectedSite: propSelectedSite, 
  onSiteChange: propOnSiteChange,
  onOpenCommand,
}) => {
  const location = useLocation();
  const [timeStr, setTimeStr] = useState('');
  const siteCtx = useSiteContext();
  const { branding, theme, resolvedTheme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const selectedSite = propSelectedSite ?? siteCtx.selectedSite;
  const handleSiteChange = (site: string) => {
    siteCtx.setSelectedSite(site);
    propOnSiteChange?.(site);
  };

  // Generate dynamic breadcrumb segments
  const pathnames = location.pathname.split('/').filter((x) => x);
  const routeNameMap: Record<string, string> = {
    chargers: 'Hardware Chargers',
    sessions: 'Sessions & Ledger',
    tariffs: 'Tariffs & Pricing',
    fleet: 'RFID & Fleet',
    vehicles: 'Fleet Vehicles',
    pki: 'PKI Security Vault',
    ems: 'Energy Flow (EMS)',
    roaming: 'OCPI Roaming',
    settings: 'System Settings',
    profile: 'Operator Profile',
    onboarding: 'Site Onboarding',
    terms: 'Terms of Service',
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header 
      className="h-16 w-full tabler-header z-40 flex items-center justify-between px-6 shrink-0 select-none bg-surface-container border-b border-outline"
      role="banner"
    >
      {/* Left: Dynamic Linked Breadcrumbs & Wayfinding */}
      <div className="flex items-center gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-medium">
          <Link 
            to="/" 
            className="text-lg font-bold text-on-surface hover:text-primary transition-colors flex items-center gap-1"
          >
            <span>{branding.company_name || 'Home'}</span>
          </Link>

          {pathnames.length === 0 ? (
            <>
              <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">
                chevron_right
              </span>
              <span className="text-on-surface font-semibold text-sm">Executive Dashboard</span>
            </>
          ) : (
            pathnames.map((name, index) => {
              const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              const displayName = routeNameMap[name] || name;

              return (
                <React.Fragment key={routeTo}>
                  <span className="material-symbols-outlined text-xs text-on-surface-variant" aria-hidden="true">
                    chevron_right
                  </span>
                  {isLast ? (
                    <span className="text-on-surface font-semibold text-sm whitespace-nowrap">
                      {displayName}
                    </span>
                  ) : (
                    <Link
                      to={routeTo}
                      className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
                    >
                      {displayName}
                    </Link>
                  )}
                </React.Fragment>
              );
            })
          )}
        </nav>
      </div>

      {/* Center: Search & Command Palette Trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-lg mx-6">
        <button
          onClick={onOpenCommand}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest border border-outline rounded-xl text-sm text-on-surface-variant transition-all shadow-sm group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-on-surface-variant group-hover:text-primary transition-colors" aria-hidden="true">
              search
            </span>
            <span className="text-sm whitespace-nowrap">Quick jump or search...</span>
          </div>
          <kbd className="bg-surface-container px-2 py-0.5 rounded text-micro font-mono text-on-surface-variant border border-outline">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Telemetry Status, Theme Toggle & Profile */}
      <div className="flex items-center gap-3">
        {/* Live EMS System Health Pill (12px) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>EMS Online - 99.98%</span>
        </div>

        {/* Site Location Selector (14px) */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm transition-all shadow-sm ${
          selectedSite !== 'all' 
            ? 'bg-primary/10 border-primary/30 text-primary' 
            : 'bg-surface-container-high border-outline text-on-surface'
        }`}>
          <span className="material-symbols-outlined text-base text-on-surface-variant" aria-hidden="true">
            location_on
          </span>
          <select
            value={selectedSite}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="bg-transparent text-sm text-on-surface focus:outline-none cursor-pointer pr-1"
          >
            <option value="all" className="bg-surface-container text-on-surface">All Facilities</option>
            {siteCtx.availableSites.map((site) => (
              <option key={site.id} value={site.id} className="bg-surface-container text-on-surface">
                {site.name} {site.count && site.count > 0 ? `(${site.count})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Live Clock (12px) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high border border-outline rounded-xl text-xs font-mono text-on-surface shadow-sm">
          <span className="material-symbols-outlined text-sm text-emerald-500" aria-hidden="true">
            schedule
          </span>
          <span>{timeStr || 'Live'}</span>
        </div>

        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer shadow-sm"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode (Current: ${theme})`}
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Notification Bell */}
        <button
          className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors relative cursor-pointer shadow-sm"
          title="Notifications & Alerts"
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            notifications
          </span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" />
        </button>

        {/* User Avatar & Status Link to Profile */}
        <Link
          to="/profile"
          title={`${user.name || 'Elena Vance'} (${user.role || 'Super Admin'})`}
          className="flex items-center gap-2 pl-1 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/30 to-primary/30 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-sm font-bold font-mono group-hover:border-emerald-500/60 shadow-sm transition-all">
            {user.initials || 'EV'}
          </div>
        </Link>
      </div>
    </header>
  );
};
