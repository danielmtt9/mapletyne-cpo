import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api-client';

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
  branding: BrandingConfig;
  refreshBranding: () => Promise<void>;
  currencySymbol: string;
}

const defaultBranding: BrandingConfig = {
  company_name: '',
  app_title: 'Charge Station Management System',
  logo_url: '',
  logo_data_uri: '',
  favicon_url: '',
  primary_color: '#4edea3',
  secondary_color: '#1e293b',
  accent_color: '#3b82f6',
  bg_color: '#0b1326',
  card_color: '#171f33',
  support_email: '',
  legal_entity: '',
  vat_number: '',
  portal_tagline: 'Enterprise EV Charging Management (CSMS)',
  currency: 'GBP',
  currency_symbol: '£',
};

const ThemeContext = createContext<ThemeContextType>({
  branding: defaultBranding,
  refreshBranding: async () => {},
  currencySymbol: '£',
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    const cached = localStorage.getItem('opencpo_branding');
    return cached ? JSON.parse(cached) : defaultBranding;
  });

  const updateFavicon = (iconUrl: string) => {
    if (!iconUrl) return;

    // 1. Standard rel="icon"
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = iconUrl;

    // 2. Shortcut icon for legacy browser support
    let shortcut = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement;
    if (!shortcut) {
      shortcut = document.createElement('link');
      shortcut.rel = 'shortcut icon';
      document.head.appendChild(shortcut);
    }
    shortcut.href = iconUrl;

    // 3. Apple touch icon for iOS/macOS PWA bookmarks
    let appleTouch = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (!appleTouch) {
      appleTouch = document.createElement('link');
      appleTouch.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouch);
    }
    appleTouch.href = iconUrl;
  };

  const applyTokens = (cfg: BrandingConfig) => {
    const root = document.documentElement;
    if (cfg.primary_color) {
      root.style.setProperty('--primary', cfg.primary_color);
      root.style.setProperty('--primary-container', cfg.primary_color);
      root.style.setProperty('--status-online', cfg.primary_color);
    }
    if (cfg.secondary_color) {
      root.style.setProperty('--secondary', cfg.secondary_color);
    }
    if (cfg.accent_color) {
      root.style.setProperty('--electric-blue', cfg.accent_color);
    }
    if (cfg.bg_color) {
      root.style.setProperty('--background', cfg.bg_color);
    }
    if (cfg.card_color) {
      root.style.setProperty('--surface-container', cfg.card_color);
    }
    const displayTitle = cfg.app_title || cfg.company_name || 'Charge Station Management System';
    const displayTagline = cfg.portal_tagline || 'Enterprise EV Charging Management (CSMS)';
    document.title = cfg.company_name ? `${cfg.company_name} — ${displayTitle}` : `${displayTitle} — ${displayTagline}`;
    
    // Dynamic Favicon & URL Bar / Tab Icon: use uploaded logo or dedicated favicon
    const dynamicIcon = cfg.favicon_url || cfg.logo_data_uri || cfg.logo_url;
    if (dynamicIcon) {
      updateFavicon(dynamicIcon);
    }
  };

  const refreshBranding = async () => {
    try {
      const b = await api.get<any>('/public/branding');
      const updated: BrandingConfig = {
        company_name: b.company_name ?? '',
        app_title: b.app_title || 'Charge Station Management System',
        logo_url: b.logo_url ?? '',
        logo_data_uri: b.logo_data_uri ?? '',
        favicon_url: b.favicon_url ?? '',
        primary_color: b.primary_color || defaultBranding.primary_color,
        accent_color: b.accent_color || defaultBranding.accent_color,
        bg_color: b.bg_color || defaultBranding.bg_color,
        card_color: b.card_color || defaultBranding.card_color,
        support_email: b.support_email ?? '',
        legal_entity: b.legal_entity ?? '',
        vat_number: b.vat_number ?? '',
        portal_tagline: b.portal_tagline || 'Enterprise EV Charging Management (CSMS)',
        currency: b.currency || 'GBP',
        currency_symbol: b.currency === 'EUR' ? '€' : b.currency === 'USD' ? '$' : '£',
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
  }, []);

  const currencySymbol = branding.currency_symbol || (branding.currency === 'EUR' ? '€' : branding.currency === 'USD' ? '$' : '£');

  return (
    <ThemeContext.Provider value={{ branding, refreshBranding, currencySymbol }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
