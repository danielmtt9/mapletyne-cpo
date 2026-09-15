import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPaletteModal } from './CommandPaletteModal';
import { useLiveEvents } from '@/hooks/use-live-events';
import { useTheme } from '@/lib/theme-provider';

export const AppShell: React.FC = () => {
  const { branding } = useTheme();
  const { isConnected } = useLiveEvents();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const token = localStorage.getItem('opencpo_admin_jwt');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const activeLogo = branding.logo_data_uri || branding.logo_url;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden">
      {/* Dynamic Ambient Background Logo Watermark (40% opacity, blurred glassmorphism) */}
      {activeLogo && (
        <div 
          aria-hidden="true" 
          className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-40 select-none"
        >
          <img 
            src={activeLogo} 
            alt="" 
            className="w-[50vw] max-w-[650px] max-h-[650px] object-contain filter blur-[35px] saturate-150 transform transition-all duration-700 ease-in-out" 
          />
          <div className="absolute inset-0 backdrop-blur-[24px] bg-slate-950/60" />
        </div>
      )}

      {/* WCAG 2.2 Level AA Bypass Link (Skip to main content) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:shadow-apple-lg focus:outline-none focus:ring-2 focus:ring-white text-xs font-semibold"
      >
        Skip to main content
      </a>

      {/* Root Layout: CSS Grid Macro-Architecture */}
      <div 
        className={`grid min-h-screen transition-all duration-300 ease-out ${
          isSidebarCollapsed ? 'grid-cols-[68px_1fr]' : 'grid-cols-[260px_1fr]'
        }`}
      >
        {/* Left Navigation Sidebar */}
        <Sidebar 
          isLiveConnected={isConnected} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Dynamic Main Workspace Canvas with integrated Header */}
        <div className="flex flex-col h-screen min-w-0 overflow-hidden">
          <Header 
            onOpenCommand={() => setIsCommandOpen(true)}
            isSidebarCollapsed={isSidebarCollapsed}
          />
          <main 
            id="main-content" 
            className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950/60 @container outline-none"
            tabIndex={-1}
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global ⌘K Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
};
