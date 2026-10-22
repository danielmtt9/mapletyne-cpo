import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api-client';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface BrandingConfig {
  company_name?: string;
  app_title?: string;
  logo_url?: string;
  logo_data_uri?: string;
  favicon_url?: string;
  icon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  bg_color?: string;
  card_color?: string;
  support_email?: string;
  legal_entity?: string;
  vat_number?: string;
  portal_tagline?: string;
  currency?: string;
  currency_symbol?: string;
}

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  branding: BrandingConfig;
  refreshBranding: () => Promise<void>;
  currencySymbol: string;
}

const defaultBranding: BrandingConfig = {
  company_name: 'Mapletyne',
  app_title: 'Executive SaaS EV Charging Management',
  logo_url: '',
  logo_data_uri: '',
  favicon_url: '',
  primary_color: '#006948',
  secondary_color: '#0f172a',
  accent_color: '#0284c7',
  bg_color: '#f8fafc',
  card_color: '#ffffff',
  support_email: 'operations@mapletyne.com',
  legal_entity: 'Mapletyne Energy Systems Ltd.',
  vat_number: '',
  portal_tagline: 'Enterprise EV Charging & Microgrid EMS',
  currency: 'USD',
  currency_symbol: '$',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  branding: defaultBranding,
  refreshBranding: async () => {},
  currencySymbol: '$',
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('mapletyne_theme') as ThemeMode;
    return saved === 'dark' || saved === 'light' || saved === 'system' ? saved : 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const saved = localStorage.getItem('mapletyne_theme') as ThemeMode;
    if (saved === 'dark') return 'dark';
    if (saved === 'light') return 'light';
    return getSystemTheme();
  });

  const [branding, setBranding] = useState<BrandingConfig>(() => {
    const cached = localStorage.getItem('opencpo_branding');
    return cached ? JSON.parse(cached) : defaultBranding;
  });

  // Apply dark class to <html> element
  const applyThemeClass = useCallback((resolved: ResolvedTheme) => {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('mapletyne_theme', newTheme);
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, [applyThemeClass]);

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Listen to system theme changes if theme === 'system'
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const sys = getSystemTheme();
        setResolvedTheme(sys);
        applyThemeClass(sys);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyThemeClass]);

  // Initial application of theme on mount
  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    applyThemeClass(resolved);
  }, [theme, applyThemeClass]);

  const updateFavicon = (iconUrl: string) => {
    if (!iconUrl) return;
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = iconUrl;
  };

  const applyTokens = useCallback((cfg: BrandingConfig) => {
    const root = document.documentElement;
    if (cfg.primary_color) {
      root.style.setProperty('--primary', cfg.primary_color);
      root.style.setProperty('--status-online', cfg.primary_color);
    }
    if (cfg.accent_color) {
      root.style.setProperty('--tertiary', cfg.accent_color);
    }
    const displayTitle = cfg.app_title || cfg.company_name || 'Mapletyne EMS';
    const displayTagline = cfg.portal_tagline || 'Executive SaaS EV Charging Management';
    document.title = cfg.company_name ? `${cfg.company_name} — ${displayTitle}` : `${displayTitle} — ${displayTagline}`;
    
    const dynamicIcon = cfg.favicon_url || cfg.logo_data_uri || cfg.logo_url;
    if (dynamicIcon) {
      updateFavicon(dynamicIcon);
    }
  }, []);

  const refreshBranding = async () => {
    try {
      const b = await api.get<any>('/public/branding');
      const updated: BrandingConfig = {
        company_name: b.company_name ?? 'Mapletyne',
        app_title: b.app_title || 'Executive SaaS EV Charging Management',
        logo_url: b.logo_url ?? '',
        logo_data_uri: b.logo_data_uri ?? '',
        favicon_url: b.favicon_url ?? '',
        primary_color: b.primary_color || defaultBranding.primary_color,
        secondary_color: b.secondary_color || defaultBranding.secondary_color,
        accent_color: b.accent_color || defaultBranding.accent_color,
        bg_color: b.bg_color || defaultBranding.bg_color,
        card_color: b.card_color || defaultBranding.card_color,
        support_email: b.support_email ?? 'operations@mapletyne.com',
        legal_entity: b.legal_entity ?? 'Mapletyne Energy Systems Ltd.',
        vat_number: b.vat_number ?? '',
        portal_tagline: b.portal_tagline || 'Enterprise EV Charging & Microgrid EMS',
        currency: b.currency || 'USD',
        currency_symbol: b.currency === 'EUR' ? '€' : b.currency === 'GBP' ? '£' : '$',
      };
      setBranding(updated);
      localStorage.setItem('opencpo_branding', JSON.stringify(updated));
      applyTokens(updated);
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    applyTokens(branding);
    refreshBranding();
  }, [applyTokens]);

  const currencySymbol = branding.currency_symbol || (branding.currency === 'EUR' ? '€' : branding.currency === 'GBP' ? '£' : '$');

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      resolvedTheme, 
      setTheme, 
      toggleTheme, 
      branding, 
      refreshBranding, 
      currencySymbol 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
