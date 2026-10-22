import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPaletteModal } from './CommandPaletteModal';
import { useLiveEvents } from '@/hooks/use-live-events';

export const AppShell: React.FC = () => {
  const { isConnected } = useLiveEvents();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const token = localStorage.getItem('opencpo_admin_jwt');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary/20 selection:text-primary relative flex">
      {/* WCAG 2.2 Level AA Bypass Link (Skip to main content) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-primary focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white text-sm font-semibold"
      >
        Skip to main content
      </a>

      {/* Root Layout: Left Sidebar + Main Content Flex */}
      <Sidebar 
        isLiveConnected={isConnected} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Workspace Canvas with Header and Scrollable Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header 
          onOpenCommand={() => setIsCommandOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <main 
          id="main-content" 
          className="flex-1 overflow-y-auto pt-10 pb-16 px-6 lg:pt-12 lg:pb-20 lg:px-10 bg-background @container outline-none"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>

      {/* Global ⌘K Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
};
