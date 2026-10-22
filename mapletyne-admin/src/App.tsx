import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('opencpo_admin_jwt');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './lib/theme-provider';
import { SiteProvider } from './context/SiteContext';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ChargersPage } from './pages/ChargersPage';
import { SessionsPage } from './pages/SessionsPage';
import { TariffsPage } from './pages/TariffsPage';
import { RfidFleetPage } from './pages/RfidFleetPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { PkiVaultPage } from './pages/PkiVaultPage';
import { EmsPage } from './pages/EmsPage';
import { RoamingPage } from './pages/RoamingPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TermsPage } from './pages/TermsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ReactPuckEditor } from './pages/ReactPuckEditor';
import { ReactPostsPage, ReactPostDetailPage } from './pages/ReactPostsPages';
import { ReactLivePage } from './pages/ReactLivePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SiteProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/editor/:pageId"
                    element={
                      <AuthGuard>
                        <ReactPuckEditor />
                      </AuthGuard>
                    }
                  />
                  <Route path="/" element={<AppShell />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="chargers" element={<ChargersPage />} />
                    <Route path="sessions" element={<SessionsPage />} />
                    <Route path="tariffs" element={<TariffsPage />} />
                    <Route path="fleet" element={<RfidFleetPage />} />
                    <Route path="rfid-fleet" element={<RfidFleetPage />} />
                    <Route path="vehicles" element={<VehiclesPage />} />
                    <Route path="pki" element={<PkiVaultPage />} />
                    <Route path="pki-vault" element={<PkiVaultPage />} />
                    <Route path="ems" element={<EmsPage />} />
                    <Route path="roaming" element={<RoamingPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="settings/branding" element={<SettingsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="onboarding" element={<OnboardingPage />} />
                    <Route path="terms" element={<TermsPage />} />
                    <Route path="posts" element={<ReactPostsPage />} />
                    <Route path="posts/:slug" element={<ReactPostDetailPage />} />
                  </Route>
                  {/* Public CMS pages — must be outside AppShell so customer-facing pages render standalone */}
                  <Route path="pages/:slug" element={<ReactLivePage />} />
                  {/* Catch-all 404 — must be outside AppShell so unauthenticated users can see it */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </BrowserRouter>
            </SiteProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
