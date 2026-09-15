import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTheme } from '@/lib/theme-provider';
import { api } from '@/lib/api-client';
import { formatTimestamp } from '@/lib/utils';
import { Link } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const { branding, refreshBranding } = useTheme();
  const [activeTab, setActiveTab] = useState<'org' | 'branding' | 'smtp' | 'sms' | 'ocpi' | 'backups'>('org');

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: allSettings, refetch: refetchSettings } = useQuery<Record<string, any>>({
    queryKey: ['all-settings'],
    queryFn: async (): Promise<Record<string, any>> => {
      try {
        return await api.get<Record<string, any>>('/settings');
      } catch {
        return {};
      }
    },
  });

  // Tab 1: Organization & Legal State
  const [companyName, setCompanyName] = useState(branding.company_name || '');
  const [legalEntity, setLegalEntity] = useState('');
  const [taxVatId, setTaxVatId] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [invoicingEmail, setInvoicingEmail] = useState('');
  const [supportHotline, setSupportHotline] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [timezone, setTimezone] = useState('UTC');

  // Tab 2: Brand Studio State
  const [appTitle, setAppTitle] = useState(branding.app_title || 'Charge Station Management System');
  const [portalTagline, setPortalTagline] = useState(branding.portal_tagline || 'Enterprise EV Charging Management (CSMS)');
  const [primaryColor, setPrimaryColor] = useState(branding.primary_color || '#4edea3');
  const [secondaryColor, setSecondaryColor] = useState(branding.secondary_color || '#1e293b');
  const [accentColor, setAccentColor] = useState(branding.accent_color || '#3b82f6');
  const [bgColor, setBgColor] = useState(branding.bg_color || '#0b1326');
  const [cardColor, setCardColor] = useState(branding.card_color || '#171f33');
  const [logoUrl, setLogoUrl] = useState(branding.logo_url || '');
  const [logoDataUri, setLogoDataUri] = useState(branding.logo_data_uri || '');
  const [faviconUrl, setFaviconUrl] = useState(branding.favicon_url || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tab 3: SMTP State
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromAddress, setSmtpFromAddress] = useState('');
  const [smtpFromName, setSmtpFromName] = useState(branding.app_title || 'Charge Station Management System');
  const [smtpTls, setSmtpTls] = useState(true);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Tab 4: SMS & Alerts State
  const [smsProvider, setSmsProvider] = useState('twilio');
  const [smsAccountSid, setSmsAccountSid] = useState('');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsSenderId, setSmsSenderId] = useState(branding.company_name ? branding.company_name.slice(0, 11) : 'CSMS');
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [otpCodeLength, setOtpCodeLength] = useState(6);
  const [otpTtlSeconds, setOtpTtlSeconds] = useState(300);

  // Tab 5: OCPI Roaming Identity State
  const [ocpiCountryCode, setOcpiCountryCode] = useState('US');
  const [ocpiPartyId, setOcpiPartyId] = useState('CPO');
  const [ocpiRole, setOcpiRole] = useState('CPO');
  const [ocpiOperatorName, setOcpiOperatorName] = useState(branding.company_name || '');
  const [ocpiBaseUrl, setOcpiBaseUrl] = useState('http://localhost:8000');
  const [ocpiVersionsPath, setOcpiVersionsPath] = useState('/ocpi/versions');

  // Tab 6: Payouts & Backups State
  const [autoSettlement, setAutoSettlement] = useState(true);
  const [defaultSplitPct, setDefaultSplitPct] = useState(15.0);
  const [payoutSchedule, setPayoutSchedule] = useState('monthly');
  const [minimumPayout, setMinimumPayout] = useState(50.0);

  // Diagnostic Test Modals
  const [isSmtpTestModalOpen, setIsSmtpTestModalOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [smtpTestResult, setSmtpTestResult] = useState<any | null>(null);

  const [isSmsTestModalOpen, setIsSmsTestModalOpen] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [smsTestResult, setSmsTestResult] = useState<any | null>(null);

  // Sync state from allSettings when loaded
  useEffect(() => {
    if (!allSettings) return;

    if (allSettings.organization) {
      const org = allSettings.organization;
      if (org.company_name) setCompanyName(org.company_name);
      if (org.legal_entity) setLegalEntity(org.legal_entity);
      if (org.tax_vat_id) setTaxVatId(org.tax_vat_id);
      if (org.registration_number) setRegNumber(org.registration_number);
      if (org.address_line1) setAddressLine1(org.address_line1);
      if (org.address_line2) setAddressLine2(org.address_line2);
      if (org.city) setCity(org.city);
      if (org.state_province) setStateProvince(org.state_province);
      if (org.postal_code) setPostalCode(org.postal_code);
      if (org.country) setCountry(org.country);
      if (org.invoicing_email) setInvoicingEmail(org.invoicing_email);
      if (org.support_hotline) setSupportHotline(org.support_hotline);
      if (org.website_url) setWebsiteUrl(org.website_url);
      if (org.currency) setCurrency(org.currency);
      if (org.timezone) setTimezone(org.timezone);
    }

    if (allSettings.branding) {
      const b = allSettings.branding;
      if (b.app_title) setAppTitle(b.app_title);
      if (b.portal_tagline) setPortalTagline(b.portal_tagline);
      if (b.primary_color) setPrimaryColor(b.primary_color);
      if (b.secondary_color) setSecondaryColor(b.secondary_color);
      if (b.accent_color) setAccentColor(b.accent_color);
      if (b.bg_color) setBgColor(b.bg_color);
      if (b.card_color) setCardColor(b.card_color);
      if (b.logo_url) setLogoUrl(b.logo_url);
      if (b.logo_data_uri) setLogoDataUri(b.logo_data_uri);
      if (b.favicon_url) setFaviconUrl(b.favicon_url);
    }

    if (allSettings.smtp) {
      const s = allSettings.smtp;
      if (s.host) setSmtpHost(s.host);
      if (s.port) setSmtpPort(Number(s.port));
      if (s.user) setSmtpUser(s.user);
      if (s.password) setSmtpPassword(s.password);
      if (s.from_address) setSmtpFromAddress(s.from_address);
      if (s.from_name) setSmtpFromName(s.from_name);
      if (s.tls !== undefined) setSmtpTls(Boolean(s.tls));
    }

    if (allSettings.sms) {
      const sms = allSettings.sms;
      if (sms.provider) setSmsProvider(sms.provider);
      if (sms.account_sid) setSmsAccountSid(sms.account_sid);
      if (sms.api_key) setSmsApiKey(sms.api_key);
      if (sms.sender_id) setSmsSenderId(sms.sender_id);
      if (sms.otp_enabled !== undefined) setOtpEnabled(Boolean(sms.otp_enabled));
      if (sms.otp_code_length) setOtpCodeLength(Number(sms.otp_code_length));
      if (sms.otp_ttl_seconds) setOtpTtlSeconds(Number(sms.otp_ttl_seconds));
    }

    if (allSettings.ocpi) {
      const ocpi = allSettings.ocpi;
      if (ocpi.country_code) setOcpiCountryCode(ocpi.country_code);
      if (ocpi.party_id) setOcpiPartyId(ocpi.party_id);
      if (ocpi.role) setOcpiRole(ocpi.role);
      if (ocpi.operator_name) setOcpiOperatorName(ocpi.operator_name);
      if (ocpi.base_url) setOcpiBaseUrl(ocpi.base_url);
      if (ocpi.versions_path) setOcpiVersionsPath(ocpi.versions_path);
    }

    if (allSettings.payouts) {
      const p = allSettings.payouts;
      if (p.auto_settlement !== undefined) setAutoSettlement(Boolean(p.auto_settlement));
      if (p.default_split_pct !== undefined) setDefaultSplitPct(Number(p.default_split_pct));
      if (p.payout_schedule) setPayoutSchedule(p.payout_schedule);
      if (p.minimum_payout !== undefined) setMinimumPayout(Number(p.minimum_payout));
    }
  }, [allSettings]);

  // ── Save Handlers ──────────────────────────────────────────────────────────

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/settings/organization', {
        value: {
          company_name: companyName,
          legal_entity: legalEntity,
          tax_vat_id: taxVatId,
          registration_number: regNumber,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state_province: stateProvince,
          postal_code: postalCode,
          country,
          invoicing_email: invoicingEmail,
          support_hotline: supportHotline,
          website_url: websiteUrl,
          currency,
          timezone,
        },
      });
      await refreshBranding();
      refetchSettings();
      showToast('Organization & Legal Profile saved successfully!');
    } catch (err: any) {
      showToast(`Failed to save organization profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/settings/branding', {
        value: {
          company_name: companyName,
          app_title: appTitle,
          portal_tagline: portalTagline,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          accent_color: accentColor,
          bg_color: bgColor,
          card_color: cardColor,
          logo_url: logoUrl,
          logo_data_uri: logoDataUri,
          favicon_url: faviconUrl,
          support_email: invoicingEmail,
          legal_entity: legalEntity,
          vat_number: taxVatId,
        },
      });
      await refreshBranding();
      refetchSettings();
      showToast('Brand Studio visual tokens saved and live CSS properties updated!');
    } catch (err: any) {
      showToast(`Failed to save branding: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.upload<any>('/settings/logo', formData);
      if (res.logo_url) setLogoUrl(res.logo_url);
      if (res.logo_data_uri) setLogoDataUri(res.logo_data_uri);
      await refreshBranding();
      showToast('Company logo uploaded and persisted successfully!');
    } catch (err: any) {
      showToast(`Logo upload failed: ${err.message}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/settings/smtp', {
        value: {
          host: smtpHost,
          port: Number(smtpPort),
          user: smtpUser,
          password: smtpPassword,
          from_address: smtpFromAddress,
          from_name: smtpFromName,
          tls: smtpTls,
          security_mode: smtpTls ? 'STARTTLS' : 'Plain',
        },
      });
      refetchSettings();
      showToast('SMTP Communications settings saved successfully!');
    } catch (err: any) {
      showToast(`Failed to save SMTP: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/settings/sms', {
        value: {
          provider: smsProvider,
          account_sid: smsAccountSid,
          api_key: smsApiKey,
          sender_id: smsSenderId,
          otp_enabled: otpEnabled,
          otp_code_length: Number(otpCodeLength),
          otp_ttl_seconds: Number(otpTtlSeconds),
        },
      });
      refetchSettings();
      showToast('SMS & Alert Gateway configuration saved successfully!');
    } catch (err: any) {
      showToast(`Failed to save SMS: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOcpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/settings/ocpi', {
        value: {
          country_code: ocpiCountryCode.toUpperCase(),
          party_id: ocpiPartyId.toUpperCase(),
          role: ocpiRole,
          operator_name: ocpiOperatorName,
          base_url: ocpiBaseUrl,
          versions_path: ocpiVersionsPath,
        },
      });
      refetchSettings();
      showToast('OCPI Roaming identity parameters saved successfully!');
    } catch (err: any) {
      showToast(`Failed to save OCPI: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePayouts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/settings/payouts', {
        value: {
          auto_settlement: autoSettlement,
          default_split_pct: Number(defaultSplitPct),
          payout_schedule: payoutSchedule,
          currency,
          minimum_payout: Number(minimumPayout),
        },
      });
      refetchSettings();
      showToast('Site Host Revenue Split parameters saved successfully!');
    } catch (err: any) {
      showToast(`Failed to save payouts: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Diagnostic Test Mutations ──────────────────────────────────────────────

  const smtpTestMutation = useMutation({
    mutationFn: async (toEmail: string) => {
      return api.post<any>('/settings/smtp/test', { to_email: toEmail });
    },
    onSuccess: (data) => {
      setSmtpTestResult(data);
    },
    onError: (err: any) => {
      setSmtpTestResult({ ok: false, error: err.message, host: smtpHost, port: smtpPort, tls: smtpTls });
    },
  });

  const smsTestMutation = useMutation({
    mutationFn: async (phone: string) => {
      return api.post<any>('/settings/sms/test', { phone });
    },
    onSuccess: (data) => {
      setSmsTestResult(data);
    },
    onError: (err: any) => {
      setSmsTestResult({ ok: false, error: err.message, provider: smsProvider });
    },
  });

  // ── Backup Management Query & Mutations ────────────────────────────────────

  const { data: rawBackups, isLoading: isBackupsLoading, refetch: refetchBackups } = useQuery({
    queryKey: ['admin-backups'],
    queryFn: () => api.get<any>('/admin/backups').catch(() => ({ backups: [] })),
    enabled: activeTab === 'backups',
  });

  const backups = rawBackups?.backups || [];

  const createBackupMutation = useMutation({
    mutationFn: () => api.post('/admin/backups', {}),
    onSuccess: () => {
      showToast('Database & ISO 15118 PKI snapshot created successfully!');
      refetchBackups();
    },
    onError: (err: any) => {
      showToast(`Backup snapshot failed: ${err.message}`);
    },
  });

  const restoreBackupMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/backups/${id}/restore`, {}),
    onSuccess: () => {
      showToast('Database restore sequence dispatched.');
      refetchBackups();
    },
    onError: (err: any) => {
      showToast(`Restore failed: ${err.message}`);
    },
  });

  return (
    <div className="space-y-6 max-w-6xl font-body">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 material-card bg-surface-container-highest/90 backdrop-blur-xl border border-primary/40 text-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-mono text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
            Platform Configuration & Settings
          </h1>
          <p className="text-sm text-on-surface-variant font-body mt-1">
            Enterprise organization identity, white-label brand studio, transactional communications, and PKI backup engine.
          </p>
        </div>
      </div>

      {/* 6 Responsive Navigation Tabs */}
      <div className="flex border-b border-white/5 space-x-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('org')}
          className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'org'
              ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">domain</span>
          Organization & Legal
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'branding'
              ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">palette</span>
          Brand & Logo Studio
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
          className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'smtp'
              ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">mail</span>
          Email & SMTP
        </button>

        <button
          onClick={() => setActiveTab('sms')}
          className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sms'
              ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">sms</span>
          SMS & Alerts
        </button>

        <button
          onClick={() => setActiveTab('ocpi')}
          className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ocpi'
              ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">hub</span>
          Roaming & OCPI
        </button>

        <button
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'backups'
              ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">cloud_sync</span>
          Splits & Backups
        </button>
      </div>

      {/* ── TAB 1: Organization & Legal ────────────────────────────────────── */}
      {activeTab === 'org' && (
        <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-6 font-body">
          <div className="border-b border-white/5 pb-3">
            <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">domain</span>
              Organization & Legal Business Profile
            </h2>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">
              Legal entity details bound to automated driver PDF invoices, charge receipts, and regulatory compliance reports.
            </p>
          </div>

          <form onSubmit={handleSaveOrg} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Trading / Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Charge Network"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Registered Legal Entity
                </label>
                <input
                  type="text"
                  value={legalEntity}
                  onChange={(e) => setLegalEntity(e.target.value)}
                  placeholder="e.g. Acme Energy Solutions B.V."
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Tax / VAT Identification No.
                </label>
                <input
                  type="text"
                  value={taxVatId}
                  onChange={(e) => setTaxVatId(e.target.value)}
                  placeholder="e.g. NL859612345B01, GB123456789"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Company Registration No. (CRN)
                </label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. 74839201"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Registered Physical Address Line 1
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street address, building number"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Address Line 2 (Suite / Unit / Floor)
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Suite or Unit"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  City / Municipality
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Amsterdam"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  State / Province
                </label>
                <input
                  type="text"
                  value={stateProvince}
                  onChange={(e) => setStateProvince(e.target.value)}
                  placeholder="e.g. North Holland"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 1016 EK"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Country (ISO 2-letter)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="e.g. NL, US, DE, GB"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Invoicing & Billing Email
                </label>
                <input
                  type="email"
                  value={invoicingEmail}
                  onChange={(e) => setInvoicingEmail(e.target.value)}
                  placeholder="billing@yourcompany.com"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Customer Support Hotline
                </label>
                <input
                  type="text"
                  value={supportHotline}
                  onChange={(e) => setSupportHotline(e.target.value)}
                  placeholder="+1 (555) 0199"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Corporate Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                  <option value="CHF">CHF (Fr) - Swiss Franc</option>
                  <option value="SEK">SEK (kr) - Swedish Krona</option>
                  <option value="NOK">NOK (kr) - Norwegian Krone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Operating Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Europe/Amsterdam">Europe/Amsterdam (CET/CEST)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/5">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary text-[#070d19] font-headline font-bold text-sm rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                Save Organization Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: Brand & Logo Studio ────────────────────────────────────── */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-body">
          <div className="lg:col-span-2 material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-6">
            <div className="border-b border-white/5 pb-3">
              <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">palette</span>
                Brand Visual Identity & Dynamic Token Studio
              </h2>
              <p className="text-xs text-on-surface-variant font-body mt-0.5">
                Dynamic CSS variable engine propagates real-time tokens to Header, Sidebar, Login, and Background Watermark.
              </p>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-5">
              {/* Logo Upload Section */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">
                  Company Logo (PNG, SVG, WebP, ICO - Max 5MB)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 rounded-2xl bg-[#070d19]/80 border border-white/10 flex items-center justify-center overflow-hidden p-2 shadow-sm shrink-0">
                    {logoDataUri || logoUrl ? (
                      <img
                        src={logoDataUri || logoUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-[32px]">image</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest border border-white/10 text-on-surface rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">upload_file</span>
                        {isUploadingLogo ? 'Uploading...' : 'Choose Logo File'}
                      </button>
                      {(logoUrl || logoDataUri) && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl('');
                            setLogoDataUri('');
                          }}
                          className="p-2.5 rounded-xl bg-surface-container-high hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="Remove Logo"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Uploaded logos automatically fill the background at 40% opacity with ambient blur glassmorphism.
                    </p>
                  </div>
                </div>
              </div>

              {/* Portal Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Portal Display Title
                  </label>
                  <input
                    type="text"
                    value={appTitle}
                    onChange={(e) => setAppTitle(e.target.value)}
                    placeholder="e.g. Charge Station Management System"
                    className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Portal Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={portalTagline}
                    onChange={(e) => setPortalTagline(e.target.value)}
                    placeholder="e.g. Enterprise EV Charging Management (CSMS)"
                    className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Color Palette Selectors */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <label className="block text-sm font-semibold text-slate-200">
                  Color Tokens & Theme Customization
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#070d19]/80 border border-white/10 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-slate-200 block">Primary Brand Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full bg-transparent text-sm font-mono text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#070d19]/80 border border-white/10 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-slate-200 block">Secondary Surface</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full bg-transparent text-sm font-mono text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#070d19]/80 border border-white/10 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-slate-200 block">Electric Accent</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-full bg-transparent text-sm font-mono text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-white/5">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-primary text-[#070d19] font-headline font-bold text-sm rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                  Save & Apply Branding
                </button>
              </div>
            </form>
          </div>

          {/* Real-time Interactive Live Simulation Widget */}
          <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">visibility</span>
                  Live Simulation Preview
                </h3>
                <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 font-bold">
                  REAL-TIME
                </span>
              </div>

              {/* Simulated Sidebar Tile */}
              <div className="p-4 rounded-xl border border-white/10 bg-surface-container-lowest/90 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-sm shrink-0 overflow-hidden"
                    style={{ backgroundColor: primaryColor, color: '#000' }}
                  >
                    {logoDataUri || logoUrl ? (
                      <img src={logoDataUri || logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      companyName ? companyName.charAt(0).toUpperCase() : '⚡'
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-sm text-white block truncate">{companyName || '—'}</span>
                    <span className="text-xs font-mono text-slate-400 block truncate">{appTitle}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <span
                    className="px-2 py-1 rounded-lg text-xs font-bold font-mono"
                    style={{ backgroundColor: `${primaryColor}25`, color: primaryColor, border: `1px solid ${primaryColor}40` }}
                  >
                    ONLINE
                  </span>
                  <span
                    className="px-2 py-1 rounded-lg text-xs font-bold font-mono"
                    style={{ backgroundColor: `${accentColor}25`, color: accentColor, border: `1px solid ${accentColor}40` }}
                  >
                    22.0 kW
                  </span>
                </div>
              </div>

              {/* Simulated Mobile Driver Screen Card */}
              <div className="p-4 rounded-xl border border-white/10 bg-slate-950/80 space-y-2.5 font-mono text-xs">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex justify-between">
                  <span>Driver Mobile View</span>
                  <span style={{ color: primaryColor }}>{currency} 0.42 / kWh</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-high/60 border border-white/5 flex items-center justify-between">
                  <span className="text-white font-bold">Fast Charger #01</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: primaryColor, color: '#000' }}
                  >
                    START
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs font-mono text-on-surface-variant text-center pt-2">
              Preview updates automatically as you pick colors or upload your company logo.
            </p>
          </div>
        </div>
      )}

      {/* ── TAB 3: Email & SMTP ────────────────────────────────────────────── */}
      {activeTab === 'smtp' && (
        <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-6 font-body">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">mail</span>
                Transactional Email & SMTP Relay
              </h2>
              <p className="text-xs text-on-surface-variant font-body mt-0.5">
                Outbound gateway for automated session receipts, VAT monthly invoices, and station fault alerts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTestEmailAddress(invoicingEmail || 'admin@example.com');
                setSmtpTestResult(null);
                setIsSmtpTestModalOpen(true);
              }}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-white/10 text-on-surface font-sans text-xs rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">send</span>
              Send Test Email
            </button>
          </div>

          <form onSubmit={handleSaveSmtp} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  SMTP Host
                </label>
                <input
                  type="text"
                  placeholder="e.g. smtp.sendgrid.net, smtp.mailgun.org, smtp.gmail.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Port (587 STARTTLS / 465 SSL)
                </label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  SMTP User / Username
                </label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="e.g. apikey or user@domain.com"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  SMTP Password / API Key
                </label>
                <div className="relative">
                  <input
                    type={showSmtpPassword ? 'text' : 'password'}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 pl-4 pr-10 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showSmtpPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Security Protocol
                </label>
                <select
                  value={smtpTls ? 'tls' : 'plain'}
                  onChange={(e) => setSmtpTls(e.target.value === 'tls')}
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="tls">STARTTLS / TLS (Recommended)</option>
                  <option value="plain">Plain / Unencrypted</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Sender From Address
                </label>
                <input
                  type="email"
                  placeholder="no-reply@yourcompany.com"
                  value={smtpFromAddress}
                  onChange={(e) => setSmtpFromAddress(e.target.value)}
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme EV Charging System"
                  value={smtpFromName}
                  onChange={(e) => setSmtpFromName(e.target.value)}
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/5">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary text-[#070d19] font-headline font-bold text-sm rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                Save SMTP Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 4: SMS & Alerts ────────────────────────────────────────────── */}
      {activeTab === 'sms' && (
        <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-6 font-body">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">sms</span>
                SMS Gateway & One-Time Passcode (OTP)
              </h2>
              <p className="text-xs text-on-surface-variant font-body mt-0.5">
                Provider integration for passwordless phone login, receipt links, and critical charger emergency alerts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTestPhoneNumber('+31612345678');
                setSmsTestResult(null);
                setIsSmsTestModalOpen(true);
              }}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-white/10 text-on-surface font-sans text-xs rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">send_to_mobile</span>
              Send Test SMS
            </button>
          </div>

          <form onSubmit={handleSaveSms} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  SMS Provider
                </label>
                <select
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="twilio">Twilio Programmable SMS</option>
                  <option value="messagebird">Bird (MessageBird)</option>
                  <option value="infobip">Infobip Enterprise Gateway</option>
                  <option value="aws_sns">AWS Simple Notification Service (SNS)</option>
                  <option value="webhook">Custom Webhook Relay</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Account SID / Workspace ID
                </label>
                <input
                  type="text"
                  value={smsAccountSid}
                  onChange={(e) => setSmsAccountSid(e.target.value)}
                  placeholder="e.g. ACxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Auth Token / API Key
                </label>
                <input
                  type="password"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Sender ID / Alphanumeric Originator
                </label>
                <input
                  type="text"
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value)}
                  placeholder="e.g. CHARGE"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  OTP Code Length
                </label>
                <select
                  value={otpCodeLength}
                  onChange={(e) => setOtpCodeLength(Number(e.target.value))}
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value={6}>6 Digits (Standard Enterprise)</option>
                  <option value={4}>4 Digits (Fast Driver Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  OTP Expiry TTL (Seconds)
                </label>
                <input
                  type="number"
                  min="60"
                  max="900"
                  value={otpTtlSeconds}
                  onChange={(e) => setOtpTtlSeconds(Number(e.target.value))}
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/5">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary text-[#070d19] font-headline font-bold text-sm rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                Save SMS Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 5: Roaming & OCPI ────────────────────────────────────────── */}
      {activeTab === 'ocpi' && (
        <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-6 font-body">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">hub</span>
                OCPI 2.2.1 Node Identity & Federation
              </h2>
              <p className="text-xs text-on-surface-variant font-body mt-0.5">
                Global roaming identification parameters for eMSP clearinghouses (Hubject, Gireve, Shell Recharge).
              </p>
            </div>
            <Link
              to="/roaming"
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-white/10 text-on-surface font-sans text-xs rounded-xl font-bold flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">open_in_new</span>
              Open Roaming Partner Hub
            </Link>
          </div>

          <form onSubmit={handleSaveOcpi} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Country Code (ISO 2-letter)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={ocpiCountryCode}
                  onChange={(e) => setOcpiCountryCode(e.target.value.toUpperCase())}
                  placeholder="e.g. US, NL, DE, FR"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Party ID (3-letter CPO Code)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={ocpiPartyId}
                  onChange={(e) => setOcpiPartyId(e.target.value.toUpperCase())}
                  placeholder="e.g. CPO, ACM, EVN"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Operator Public Name
                </label>
                <input
                  type="text"
                  value={ocpiOperatorName}
                  onChange={(e) => setOcpiOperatorName(e.target.value)}
                  placeholder="e.g. Acme EV Network"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Public Base URL
                </label>
                <input
                  type="url"
                  value={ocpiBaseUrl}
                  onChange={(e) => setOcpiBaseUrl(e.target.value)}
                  placeholder="https://api.yourcompany.com"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Versions Endpoint Path
                </label>
                <input
                  type="text"
                  value={ocpiVersionsPath}
                  onChange={(e) => setOcpiVersionsPath(e.target.value)}
                  placeholder="/ocpi/versions"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/5">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary text-[#070d19] font-headline font-bold text-sm rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving && <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>}
                Save OCPI Identity
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 6: Splits & Backups ────────────────────────────────────────── */}
      {activeTab === 'backups' && (
        <div className="space-y-6 font-body">
          {/* Site Host Revenue Splits */}
          <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-6">
            <div className="border-b border-white/5 pb-3">
              <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">payments</span>
                Site Host Revenue Splits & Auto Settlement
              </h2>
              <p className="text-xs text-on-surface-variant font-body mt-0.5">
                Automated compensation and commission calculations for property owners hosting your EVSE chargers.
              </p>
            </div>

            <form onSubmit={handleSavePayouts} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-[#070d19]/80 border border-white/10 rounded-xl">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200">Auto-Settlement Engine</label>
                    <span className="text-xs text-on-surface-variant">
                      Auto-generate monthly host payout credit notes
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSettlement}
                    onChange={(e) => setAutoSettlement(e.target.checked)}
                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Default Host Revenue Split (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultSplitPct}
                    onChange={(e) => setDefaultSplitPct(Number(e.target.value))}
                    className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Payout Schedule
                  </label>
                  <select
                    value={payoutSchedule}
                    onChange={(e) => setPayoutSchedule(e.target.value)}
                    className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                    <option value="weekly">Weekly Settlement</option>
                    <option value="monthly">Monthly Calendar Close</option>
                    <option value="quarterly">Quarterly Tranche</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Minimum Payout Threshold ({currency})
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={minimumPayout}
                    onChange={(e) => setMinimumPayout(Number(e.target.value))}
                    className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-white/5">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-primary text-[#070d19] font-headline font-bold text-sm rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  Save Revenue Split Rules
                </button>
              </div>
            </form>
          </div>

          {/* Database & PKI Backups */}
          <div className="material-card bg-surface-container/70 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">cloud_sync</span>
                  Cryptographic Database & PKI Snapshots
                </h2>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">
                  Full binary database dumps combined with ISO 15118 PKI certificate archives.
                </p>
              </div>
              <button
                type="button"
                disabled={createBackupMutation.isPending}
                onClick={() => createBackupMutation.mutate()}
                className="px-5 py-2.5 bg-primary text-[#070d19] font-headline font-bold text-xs rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">archive</span>
                Create Snapshot Backup
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-surface-container-high/40 text-on-surface-variant uppercase text-xs tracking-wider">
                    <th className="px-4 py-3 font-semibold">Archive Filename</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Size</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-on-surface">
                  {isBackupsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-on-surface-variant">
                        Loading backup records...
                      </td>
                    </tr>
                  ) : backups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-on-surface-variant">
                        No backup archives found. Click &apos;Create Snapshot Backup&apos; to generate one.
                      </td>
                    </tr>
                  ) : (
                    backups.map((b: any) => (
                      <tr key={b.id} className="hover:bg-surface-container-high/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-primary font-mono">{b.filename || `backup_${b.id}.tar.gz`}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{formatTimestamp(b.created_at)}</td>
                        <td className="px-4 py-3">{b.size_bytes ? `${(b.size_bytes / 1024).toFixed(1)} KB` : '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-xs uppercase font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                            {b.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                if (window.confirm(`Restore from ${b.filename}? This will synchronize state.`)) {
                                  restoreBackupMutation.mutate(b.id);
                                }
                              }}
                              disabled={restoreBackupMutation.isPending}
                              className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-on-surface font-bold text-xs transition-colors cursor-pointer"
                            >
                              Restore
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Diagnostic SMTP Test Modal ──────────────────────────────────────── */}
      {isSmtpTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in font-body">
          <div className="material-card bg-surface-container-high/95 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">mark_email_read</span>
                Diagnostic SMTP Handshake Test
              </h3>
              <button
                onClick={() => setIsSmtpTestModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Recipient Destination Email
                </label>
                <input
                  type="email"
                  required
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="admin@yourdomain.com"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              {smtpTestResult && (
                <div
                  className={`p-3.5 rounded-xl border space-y-2 font-mono text-xs ${
                    smtpTestResult.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{smtpTestResult.ok ? '✓ HANDSHAKE SUCCESSFUL' : '✗ TEST FAILED'}</span>
                    <span>{smtpTestResult.elapsed_ms}ms</span>
                  </div>
                  <p className="text-xs break-words">
                    {smtpTestResult.message || smtpTestResult.error}
                  </p>
                  <div className="text-xs text-on-surface-variant pt-1 border-t border-white/10 flex justify-between">
                    <span>Host: {smtpTestResult.host}:{smtpTestResult.port}</span>
                    <span>TLS: {smtpTestResult.tls ? 'YES' : 'NO'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSmtpTestModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-on-surface-variant text-sm cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!testEmailAddress || smtpTestMutation.isPending}
                onClick={() => smtpTestMutation.mutate(testEmailAddress)}
                className="px-5 py-2 bg-primary text-[#070d19] font-headline font-bold text-sm rounded-xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {smtpTestMutation.isPending && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                )}
                Dispatch Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Diagnostic SMS Test Modal ───────────────────────────────────────── */}
      {isSmsTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in font-body">
          <div className="material-card bg-surface-container-high/95 backdrop-blur-2xl border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">sms</span>
                Diagnostic SMS Gateway Test
              </h3>
              <button
                onClick={() => setIsSmsTestModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Destination Phone Number (E.164 format)
                </label>
                <input
                  type="text"
                  required
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="+31612345678 or +14155552671"
                  className="w-full bg-[#070d19]/80 border border-white/10 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>

              {smsTestResult && (
                <div
                  className={`p-3.5 rounded-xl border space-y-2 font-mono text-xs ${
                    smsTestResult.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{smsTestResult.ok ? '✓ DISPATCH SUCCESS' : '✗ DISPATCH FAILED'}</span>
                    <span>{smsTestResult.elapsed_ms}ms</span>
                  </div>
                  <p className="text-xs break-words">
                    {smsTestResult.message || smsTestResult.error}
                  </p>
                  <div className="text-xs text-on-surface-variant pt-1 border-t border-white/10 flex justify-between">
                    <span>Provider: {smsTestResult.provider}</span>
                    <span>Target: {smsTestResult.sent_to}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSmsTestModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-on-surface-variant text-sm cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!testPhoneNumber || smsTestMutation.isPending}
                onClick={() => smsTestMutation.mutate(testPhoneNumber)}
                className="px-5 py-2 bg-primary text-[#070d19] font-headline font-bold text-sm rounded-xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {smsTestMutation.isPending && (
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                )}
                Dispatch Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
