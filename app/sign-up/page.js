'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read invite / referral code from all standard query params (?ref=, ?invite_code=, ?invite=, ?code=)
  const urlInviteCode =
    searchParams.get('ref') ||
    searchParams.get('invite_code') ||
    searchParams.get('invite') ||
    searchParams.get('code') ||
    '';

  const [hasInvite, setHasInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [manualCodeInput, setManualCodeInput] = useState('');

  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    verifyCode: '',
  });

  const [captchaCode, setCaptchaCode] = useState('4345');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const refreshCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setFormData((prev) => ({ ...prev, verifyCode: '' }));
  };

  // If user opens a direct referral link (e.g. /sign-up?ref=VIP777), validate and go straight to Step 2
  useEffect(() => {
    refreshCaptcha();

    if (urlInviteCode && urlInviteCode.trim()) {
      const codeToTest = urlInviteCode.trim();
      setIsValidatingUrl(true);
      setInviteError('');

      fetch(`/api/auth/validate-invite?code=${encodeURIComponent(codeToTest)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.valid) {
            setHasInvite(true);
            setInviteCode(data.code);
            setSponsorName(data.sponsor || 'Official Sponsor');
          } else {
            setHasInvite(false);
            setInviteError(
              data.message || `Referral code "${codeToTest}" is invalid or expired. Please enter a valid VIP code below.`
            );
          }
        })
        .catch(() => {
          setInviteError('Connection error while validating referral link. Please enter code manually.');
        })
        .finally(() => {
          setIsValidatingUrl(false);
        });
    }
  }, [urlInviteCode]);

  // Handle manual invite code submission on Step 1
  const handleValidateManualCode = async (e) => {
    e.preventDefault();
    setInviteError('');

    const cleanInput = manualCodeInput.trim();
    if (!cleanInput) {
      setInviteError('Please enter an invite code to continue.');
      return;
    }

    setIsValidatingCode(true);
    try {
      const res = await fetch('/api/auth/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanInput }),
      });

      const data = await res.json();
      if (data.success && data.valid) {
        setHasInvite(true);
        setInviteCode(data.code);
        setSponsorName(data.sponsor || 'Official Sponsor');
        setInviteError('');
      } else {
        setHasInvite(false);
        setInviteError(data.message || 'Invalid invite code. Please enter a valid VIP invite code from your sponsor.');
      }
    } catch (err) {
      setInviteError('Network error. Please try again.');
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Handle final registration form submit on Step 2
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.verifyCode !== captchaCode) {
      setFormError('Incorrect verify code. Please enter the 4 digits shown.');
      refreshCaptcha();
      return;
    }

    if (!inviteCode) {
      setFormError('Valid invite code is required to complete registration.');
      setHasInvite(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          inviteCode: inviteCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess('Account registered successfully! Redirecting...');
        setTimeout(() => {
          router.push('/player/dashboard');
          router.refresh();
        }, 1200);
      } else {
        setFormError(data.message || 'Registration failed');
        refreshCaptcha();
      }
    } catch (err) {
      setFormError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-[#e2e8f0] flex flex-col justify-between py-10 px-4 sm:px-6 relative font-sans">
      <div className="flex-1 flex items-center justify-center">
        {/* Main Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl max-w-md w-full p-8 sm:p-10 shadow-xl">
          {/* Official Logo Badge */}
          <div className="flex justify-center mb-5">
            <Logo size="large" href="/sign-in" theme="light" />
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Create Game Wallet</h1>
            <p className="text-xs text-slate-500 mt-1">
              VIP Player Registration
            </p>
            <div className="w-10 h-0.5 bg-amber-500 mx-auto mt-2 rounded-full"></div>
          </div>

          {/* URL Referral Validation Loader */}
          {isValidatingUrl ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Verifying referral invite link...</p>
              <p className="text-xs text-slate-400 font-mono">Code: {urlInviteCode}</p>
            </div>
          ) : !hasInvite ? (
            /* ============================================================
               STEP 1: INVITE CODE GATE (Requires valid code)
               ============================================================ */
            <div className="space-y-6 text-center py-2">
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                Registration requires an invite code. Please contact your sponsor to get one.
              </p>

              <div>
                <Link
                  href="/sign-in"
                  className="inline-block border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold px-8 py-2.5 rounded-xl transition shadow-sm"
                >
                  Sign in here
                </Link>
              </div>

              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{inviteError}</span>
                </div>
              )}

              {/* Code Entry Input & Continue Button matching official UI */}
              <div className="pt-4 border-t border-slate-100">
                <form onSubmit={handleValidateManualCode} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter invite code (e.g. 1AZu10)"
                    value={manualCodeInput}
                    onChange={(e) => {
                      setManualCodeInput(e.target.value);
                      if (inviteError) setInviteError('');
                    }}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono uppercase tracking-wider transition"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingCode || !manualCodeInput.trim()}
                    className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    {isValidatingCode ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* ============================================================
               STEP 2: REGISTRATION DETAILS FORM (Opened directly via referral or valid code)
               ============================================================ */
            <form onSubmit={handleSubmitRegistration} className="space-y-4">
              {/* Verified Sponsor / Invite Code Badge */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-600 font-medium">VIP Code: </span>
                    <span className="font-mono font-bold text-amber-700 tracking-wider uppercase">{inviteCode}</span>
                    {sponsorName && (
                      <span className="text-slate-500 text-[11px] block truncate">
                        Sponsor: <span className="font-semibold text-slate-700">{sponsorName}</span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasInvite(false);
                    setInviteCode('');
                    setSponsorName('');
                    setManualCodeInput('');
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline ml-2 shrink-0"
                >
                  Change
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Username */}
              <div>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Verify Code with Captcha */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Verify code"
                  value={formData.verifyCode}
                  onChange={(e) => setFormData({ ...formData, verifyCode: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition font-mono tracking-widest text-center"
                />
                <div
                  onClick={refreshCaptcha}
                  title="Click to refresh verification code"
                  className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 flex items-center justify-center cursor-pointer select-none relative overflow-hidden group hover:border-slate-300 transition"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-30">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <line x1="5%" y1="20%" x2="90%" y2="80%" stroke="#64748b" strokeWidth="1" />
                      <line x1="10%" y1="85%" x2="85%" y2="15%" stroke="#94a3b8" strokeWidth="1" />
                    </svg>
                  </div>
                  <span className="font-serif text-lg tracking-[0.35em] text-slate-800 font-bold select-none pl-1">
                    {captchaCode.split('').join(' ')}
                  </span>
                </div>
              </div>

              {/* Sign Up Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md disabled:opacity-50 tracking-wide uppercase flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Sign Up</span>
                  )}
                </button>
              </div>

              {/* Link back to Sign In */}
              <div className="text-center text-xs text-slate-600 pt-2">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-slate-900 font-bold hover:underline">
                  Sign in here
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4">
        Copyright © 2026 TRP Vegas Vault. All rights reserved.
      </footer>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-100"></div>}>
      <SignUpContent />
    </Suspense>
  );
}
