import React, { createContext, useContext, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ensureArray } from '@/lib/utils';

export interface SiteInfo {
  id: string;
  name: string;
  count?: number;
}

interface SiteContextType {
  selectedSite: string;
  setSelectedSite: (site: string) => void;
  availableSites: SiteInfo[];
  filterBySite: <T extends { site?: string }>(items: T[]) => T[];
}

const SiteContext = createContext<SiteContextType>({
  selectedSite: 'all',
  setSelectedSite: () => {},
  availableSites: [],
  filterBySite: (items) => items,
});

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSite, setSelectedSiteState] = useState<string>(() => {
    return localStorage.getItem('opencpo_selected_site') || 'all';
  });

  const setSelectedSite = (site: string) => {
    setSelectedSiteState(site);
    localStorage.setItem('opencpo_selected_site', site);
  };

  const hasToken = !!localStorage.getItem('opencpo_admin_jwt');

  // Fetch chargers to extract all active site names
  const { data: rawChargers } = useQuery({
    queryKey: ['chargers'],
    queryFn: () => api.get<any>('/chargers'),
    enabled: hasToken,
  });

  const chargers = ensureArray<any>(rawChargers, 'chargers');

  // Fetch configured sites from EMS
  const { data: rawEmsSites } = useQuery({
    queryKey: ['ems', 'sites'],
    queryFn: () => api.get<any>('/ems/sites').catch(() => ({ sites: [] })),
    enabled: hasToken,
  });

  const emsSites = ensureArray<any>(rawEmsSites, 'sites');

  // Derive unique sites list
  const availableSites = useMemo<SiteInfo[]>(() => {
    const siteMap = new Map<string, { id: string; name: string; count: number }>();

    // Add EMS configured sites
    emsSites.forEach((s) => {
      if (s && s.id) {
        const key = s.id.toLowerCase();
        const existing = siteMap.get(key);
        if (existing) {
          existing.name = s.name || existing.name;
        } else {
          siteMap.set(key, { id: s.id, name: s.name || s.id, count: 0 });
        }
      }
    });

    // Count chargers per site and include any additional charger sites
    chargers.forEach((c) => {
      const siteVal = c?.site || c?.city || c?.metadata?.city;
      if (siteVal && typeof siteVal === 'string' && siteVal.trim()) {
        const trimmed = siteVal.trim();
        const key = trimmed.toLowerCase();
        const existing = siteMap.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          siteMap.set(key, {
            id: trimmed,
            name: `${trimmed} Hub`,
            count: 1,
          });
        }
      }
    });

    // Default if none found
    if (siteMap.size === 0) {
      siteMap.set('newcastle', { id: 'Newcastle', name: 'Newcastle Hub', count: 0 });
    }

    return Array.from(siteMap.values());
  }, [chargers, emsSites]);

  // Utility to filter items by site
  const filterBySite = <T extends { site?: string; city?: string; metadata?: any }>(items: T[]): T[] => {
    if (!selectedSite || selectedSite === 'all') return items;
    return items.filter((item) => {
      const siteVal = item.site || item.city || item.metadata?.city;
      if (!siteVal) return false;
      return siteVal.toLowerCase() === selectedSite.toLowerCase();
    });
  };

  return (
    <SiteContext.Provider
      value={{
        selectedSite,
        setSelectedSite,
        availableSites,
        filterBySite,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export const useSiteContext = () => useContext(SiteContext);
