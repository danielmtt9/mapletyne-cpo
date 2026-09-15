import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@/lib/api-client';
import { useTheme } from '@/lib/theme-provider';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Building,
  Phone,
  ArrowRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Car,
  Cpu,
  Truck,
  ArrowLeft,
} from 'lucide-react';

interface AuthResponse {
  token?: string;
  access_token?: string;
  refresh_token?: string;
  user?: {
    id?: number;
    email?: string;
    name?: string;
    role?: string;
    roles?: string[];
  };
}

interface RegisterInitiateResponse {
  ok: boolean;
  email: string;
  ttl_seconds: number;
  message: string;
}

type AuthTab = 'login' | 'register';
type UserRole = 'driver' | 'site-operator' | 'fleet-manager';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { branding } = useTheme();

  // Tab State
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Active logo for watermark and header
  const activeLogo = branding.logo_data_uri || branding.logo_url || '';

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('daniel.a@mapletynetechnologies.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('site-operator');
  const [regCompany, setRegCompany] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtpModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, countdown]);

  // Focus first OTP input when modal opens
  useEffect(() => {
    if (showOtpModal) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [showOtpModal]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Helper to store tokens and navigate
  const handleAuthSuccess = (res: AuthResponse) => {
    const jwt = res.access_token || res.token;
    if (jwt) {
      localStorage.setItem('opencpo_admin_jwt', jwt);
      if (res.refresh_token) {
        localStorage.setItem('opencpo_refresh_token', res.refresh_token);
      }
      if (res.user) {
        localStorage.setItem('opencpo_user', JSON.stringify(res.user));
      }
      navigate('/');
    }
  };

  // ── Handle Sign In ────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await api.post<AuthResponse>('/admin/auth/login', {
        email: loginEmail,
        username: loginEmail,
        password: loginPassword,
      });

      const jwt = res.access_token || res.token;
      if (jwt) {
        handleAuthSuccess(res);
      } else {
        setLoginError('Authentication succeeded but no token was received.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setLoginError(err.message || 'Invalid email or password.');
      } else {
        setLoginError('Authentication service unavailable. Please check your credentials.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ── Handle Step 1 Registration (Initiate OTP) ─────────────────────────────
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setRegError(null);

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      setIsRegistering(false);
      return;
    }

    try {
      await api.post<RegisterInitiateResponse>('/admin/auth/register/initiate', {
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        company: regCompany || undefined,
        phone: regPhone || undefined,
      });

      setCountdown(600);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError(null);
      setResendSuccess(null);
      setShowOtpModal(true);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setRegError(err.message || 'Failed to initiate registration.');
      } else {
        setRegError('Registration service temporarily unavailable.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // ── Handle OTP Input Changes (Auto Focus Next) ────────────────────────────
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal && val !== '') return;

    const newDigits = [...otpDigits];
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // ── Handle Step 2 OTP Verification & Auto-Login ───────────────────────────
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setOtpError('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await api.post<AuthResponse>('/admin/auth/register/verify', {
        email: regEmail,
        code: fullCode,
      });

      handleAuthSuccess(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setOtpError(err.message || 'Invalid verification code.');
      } else {
        setOtpError('Verification failed. Please try again.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ── Handle Resend OTP Code ────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    setResendSuccess(null);
    setOtpError(null);

    try {
      await api.post('/admin/auth/register/resend', {
        email: regEmail,
      });
      setResendSuccess('A new 6-digit code has been dispatched to your email.');
      setCountdown(600);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setOtpError(err.message || 'Failed to resend code.');
      } else {
        setOtpError('Could not resend verification email.');
      }
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d19] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(78,222,163,0.15),rgba(255,255,255,0))] flex items-center justify-center p-4 font-body relative overflow-hidden">
      {/* Ambient background logo watermark at 40% opacity with blur */}
      {activeLogo && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-40 select-none">
          <img
            src={activeLogo}
            alt=""
            aria-hidden="true"
            className="w-[60vw] max-w-[700px] max-h-[700px] object-contain filter blur-[40px] saturate-150 transform scale-110"
          />
          <div className="absolute inset-0 backdrop-blur-[24px] bg-slate-950/60" />
        </div>
      )}

      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-lg bg-[#0e172a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6 relative z-10 transition-all duration-300">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          {activeLogo ? (
            <div className="w-16 h-16 rounded-2xl bg-[#070d19]/80 border border-white/10 flex items-center justify-center p-2 mx-auto shadow-lg shadow-primary/20 ring-1 ring-white/20 overflow-hidden">
              <img src={activeLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-gradient-to-tr from-primary to-blue-500 text-surface-dark flex items-center justify-center font-extrabold font-headline text-2xl rounded-2xl mx-auto shadow-lg shadow-primary/20 ring-1 ring-white/20">
              <Zap className="w-7 h-7 text-[#070d19] fill-current" />
            </div>
          )}
          <div>
            <h1 className="font-headline text-2xl font-bold tracking-tight text-white">
              {branding.app_title || branding.company_name || 'Charge Station Management System'}
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-1">
              {branding.portal_tagline || 'Enterprise EV Charging Management (CSMS)'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#070d19]/80 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-primary text-[#070d19] shadow-md shadow-primary/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegError(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-primary text-[#070d19] shadow-md shadow-primary/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* ── SIGN IN TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            {loginError && (
              <div id="error-banner" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form id="login-form" onSubmit={handleLoginSubmit} className="space-y-4 font-body">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-primary" />
                  Email / Operator ID
                </label>
                <div className="relative">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="operator@domain.com"
                    className="w-full bg-[#070d19]/80 border border-white/10 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-primary" />
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#070d19]/80 border border-white/10 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 outline-none transition-all"
                />
              </div>

              <button
                id="submit-btn"
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-emerald-400 text-[#070d19] font-headline font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Sign In to System
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── CREATE ACCOUNT TAB (STEP 1) ─────────────────────────────────── */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            {regError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 font-body">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" />
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-[#070d19]/80 border border-white/10 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-primary" />
                  Work Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-[#070d19]/80 border border-white/10 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-primary" />
                  Password (min 6 characters)
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  placeholder="••••••••••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-[#070d19]/80 border border-white/10 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-xl h-11 px-4 text-slate-100 font-sans text-base placeholder:text-slate-500 outline-none transition-all"
                />
              </div>

              {/* Role Selector Pills */}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Account Role & Workspace
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('site-operator')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center text-center justify-center gap-1.5 cursor-pointer ${
                      regRole === 'site-operator'
                        ? 'bg-primary/15 border-primary text-primary font-semibold shadow-sm'
                        : 'bg-[#070d19]/60 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <span className="text-xs font-semibold leading-tight">Site Operator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('fleet-manager')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center text-center justify-center gap-1.5 cursor-pointer ${
                      regRole === 'fleet-manager'
                        ? 'bg-primary/15 border-primary text-primary font-semibold shadow-sm'
                        : 'bg-[#070d19]/60 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span className="text-xs font-semibold leading-tight">Fleet Manager</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('driver')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center text-center justify-center gap-1.5 cursor-pointer ${
                      regRole === 'driver'
                        ? 'bg-primary/15 border-primary text-primary font-semibold shadow-sm'
                        : 'bg-[#070d19]/60 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span className="text-xs font-semibold leading-tight">EV Driver</span>
                  </button>
                </div>
              </div>

              {/* Optional Company / Phone Details */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-primary" />
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Energy"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    className="w-full bg-[#070d19]/80 border border-white/10 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-xl h-10 px-3 text-slate-100 font-sans text-sm placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+31 6 12345678"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-[#070d19]/80 border border-white/10 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 rounded-xl h-10 px-3 text-slate-100 font-sans text-sm placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-primary to-emerald-400 text-[#070d19] font-headline font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase cursor-pointer disabled:opacity-50"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Continue to Email Verification
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs font-mono text-slate-400 pt-4 border-t border-white/5 flex items-center justify-center gap-2">
          {branding.company_name ? (
            <>
              <span className="font-semibold text-slate-300">{branding.company_name}</span>
              <span>•</span>
            </>
          ) : null}
          <span>ISO 15118 & OCPP 2.0.1</span>
        </div>
      </div>

      {/* ── STEP 2: 6-DIGIT EMAIL OTP VERIFICATION MODAL ─────────────────── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0e172a] border border-primary/30 rounded-2xl p-7 shadow-2xl space-y-6 relative ring-1 ring-primary/20">
            
            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 border border-primary/30 text-primary rounded-xl flex items-center justify-center mx-auto mb-2">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-headline text-xl font-bold text-white">
                Verify Your Email
              </h2>
              <p className="text-xs text-slate-300 font-body">
                We’ve sent a 6-digit verification code to:
              </p>
              <div className="font-mono text-xs font-semibold text-primary bg-primary/10 py-1 px-3 rounded-lg inline-block">
                {regEmail}
              </div>
            </div>

            {/* Error or Success alerts */}
            {otpError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}
            {resendSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {/* 6-Digit Pin Input Matrix */}
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center gap-2.5">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 bg-[#070d19] border border-white/15 focus:border-primary focus:ring-2 focus:ring-primary/40 rounded-xl text-center text-xl font-mono font-bold text-primary outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              {/* Timer info */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                <span>Code expires in:</span>
                <span className={`font-bold ${countdown < 60 ? 'text-red-400 animate-pulse' : 'text-primary'}`}>
                  {formatCountdown(countdown)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpDigits.some((d) => !d)}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-emerald-400 text-[#070d19] font-headline font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-primary/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying & Provisioning...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Complete Registration
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back / Edit Email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResendingOtp || countdown > 540}
                    className="text-xs font-mono text-primary hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
                  >
                    {isResendingOtp ? 'Resending...' : 'Resend Code'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
