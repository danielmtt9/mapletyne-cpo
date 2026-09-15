import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Bell, 
  ChevronRight
} from 'lucide-react';
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
  const { branding } = useTheme();
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
      className="h-16 w-full material-titlebar z-40 flex items-center justify-between px-6 shrink-0 select-none"
      role="banner"
    >
      {/* Left: Dynamic Linked Breadcrumbs & Wayfinding */}
      <div className="flex items-center gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium">
          <Link 
            to="/" 
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>{branding.company_name || 'Home'}</span>
          </Link>

          {pathnames.length === 0 ? (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-white font-semibold">Dashboard</span>
            </>
          ) : (
            pathnames.map((name, index) => {
              const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              const displayName = routeNameMap[name] || name;

              return (
                <React.Fragment key={routeTo}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  {isLast ? (
                    <span className="text-white font-semibold truncate max-w-[200px]">
                      {displayName}
                    </span>
                  ) : (
                    <Link
                      to={routeTo}
                      className="text-slate-400 hover:text-white transition-colors"
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

      {/* Center / Search & Command Palette Trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-xl mx-6">
        {/* Quick Search Trigger (⌘K) */}
        <button
          onClick={onOpenCommand}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-white/10 hover:border-blue-500/40 rounded-xl text-xs text-slate-400 transition-all shadow-apple-sm group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span className="truncate">Quick jump or search...</span>
          </div>
          <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Header Controls */}
      <div className="flex items-center gap-3">
        {/* Site Location Selector */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs transition-all shadow-apple-sm ${
          selectedSite !== 'all' 
            ? 'bg-blue-600/15 border-blue-500/30 text-blue-300' 
            : 'bg-slate-900/50 border-white/10 text-slate-300'
        }`}>
          <MapPin className={`w-3.5 h-3.5 ${selectedSite !== 'all' ? 'text-blue-400' : 'text-slate-400'}`} />
          <select
            value={selectedSite}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
          >
            <option value="all" className="bg-slate-900 text-slate-200">All Locations</option>
            {siteCtx.availableSites.map((site) => (
              <option key={site.id} value={site.id} className="bg-slate-900 text-slate-200">
                {site.name} {site.count && site.count > 0 ? `(${site.count})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Live Clock / Today Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/50 border border-white/10 rounded-xl text-xs font-mono text-slate-300 shadow-apple-sm">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{timeStr || 'Live'}</span>
        </div>

        {/* Notification Bell */}
        <button
          className="w-8 h-8 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors relative cursor-pointer"
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        {/* User Avatar & Status */}
        <Link
          to="/settings"
          title={`${user.name} (${user.role})`}
          className="flex items-center gap-2 pl-1 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600/30 to-primary/30 border border-blue-400/30 text-blue-300 flex items-center justify-center text-xs font-bold font-mono group-hover:border-blue-400/60 shadow-apple-sm transition-all">
            {user.initials || 'DA'}
          </div>
        </Link>
      </div>
    </header>
  );
};
