import React, { useEffect, useState } from 'react';

/**
 * CookieConsentBanner — M3 bottom banner that appears when no consent has been recorded.
 * Reads `localStorage.getItem('opencpo_cookie_consent')`. If not set, renders a bottom banner
 * with link to `/privacy`, "Essential Only" and "Accept All" buttons (min-h-[44px]).
 * On acceptance saves `opencpo_cookie_consent` and `opencpo_telemetry_opt_in` (respecting
 * `(navigator as any).globalPrivacyControl`).
 */
export const CookieConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('opencpo_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleEssentialOnly = () => {
    localStorage.setItem('opencpo_cookie_consent', 'essential');
    // Telemetry is never opted in when user chooses essential only
    localStorage.setItem('opencpo_telemetry_opt_in', 'false');
    setVisible(false);
  };

  const handleAcceptAll = () => {
    // Respect Global Privacy Control (GPC) signal
    const gpcEnabled = !!(navigator as any).globalPrivacyControl;
    const telemetryOptIn = gpcEnabled ? 'false' : 'true';
    localStorage.setItem('opencpo_cookie_consent', 'all');
    localStorage.setItem('opencpo_telemetry_opt_in', telemetryOptIn);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100]">
      <div className="mx-auto max-w-5xl px-4 pb-4 pt-2">
        <div className="tabler-card rounded-2xl border border-outline bg-surface-container-high shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className="shrink-0 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">
              cookies
            </span>
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-on-surface mb-1">
              We use cookies to enhance your experience.
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Essential cookies are always on. You can accept all or manage preferences.
              See our{' '}
              <a href="/privacy" className="text-primary hover:text-primary-container font-semibold underline underline-offset-2 transition-colors">
                Privacy Policy
              </a>{' '}
              for details.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              type="button"
              onClick={handleEssentialOnly}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-outline text-on-surface font-semibold hover:bg-surface-container transition-colors cursor-pointer whitespace-nowrap"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors cursor-pointer whitespace-nowrap"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
