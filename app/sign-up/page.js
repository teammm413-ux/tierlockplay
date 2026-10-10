'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ShieldCheck, Gift } from 'lucide-react';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read invite / referral code from standard query params (?ref=, ?invite_code=, ?invite=, ?code=)
  const urlInviteCode =
    searchParams.get('ref') ||
    searchParams.get('invite_code') ||
    searchParams.get('invite') ||
    searchParams.get('code') ||
    '';

  const [inviteCode, setInviteCode] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlMessage, setUrlMessage] = useState('');

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

  // If user opens via a referral link, validate it and prefill
  useEffect(() => {
    refreshCaptcha();

    if (urlInviteCode && urlInviteCode.trim()) {
      const cleanUrlCode = urlInviteCode.trim();
      setInviteCode(cleanUrlCode.toUpperCase());
      setIsValidatingUrl(true);

      fetch(`/api/auth/validate-invite?code=${encodeURIComponent(cleanUrlCode)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.valid) {
            setInviteCode(data.code);
            setSponsorName(data.sponsor || 'Official VIP Sponsor');
            setUrlMessage(`VIP Referral link applied: Sponsor is ${data.sponsor || 'Official Sponsor'}`);
          } else {
            // Not a blocker - user can still sign up without code
            setUrlMessage(`Note: Referral code "${cleanUrlCode}" is not active. You can still register directly.`);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsValidatingUrl(false);
        });
    }
  }, [urlInviteCode]);

  // Handle registration form submit
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.verifyCode !== captchaCode) {
      setFormError('Incorrect verify code. Please enter the 4 digits shown.');
      refreshCaptcha();
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
          inviteCode: inviteCode.trim() || undefined,
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
    <div className="min-h-screen bg-[#07080b] flex flex-col justify-between py-10 px-4 sm:px-6 relative font-sans overflow-hidden">
      {/* Background radial gold glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFCC00]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center relative z-10">
        {/* Main Card */}
        <div className="bg-[#101117] border border-[#FFCC00]/25 rounded-3xl max-w-md w-full p-8 sm:p-10 shadow-[0_0_50px_rgba(255,204,0,0.08)]">
          {/* Official Logo Badge */}
          <div className="flex justify-center mb-6">
            <Logo size="large" href="/sign-in" theme="dark" />
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Create Game Wallet</h1>
            <p className="text-xs text-[#FFCC00] font-semibold tracking-wider uppercase mt-1">
              VIP Player Registration • TierlockPlay
            </p>
            <div className="w-12 h-0.5 bg-[#FFCC00] mx-auto mt-2 rounded-full shadow-[0_0_8px_#FFCC00]"></div>
          </div>

          {/* Referral Link Notification (if arrived via referral link) */}
          {sponsorName && (
            <div className="mb-4 p-3 bg-[#FFCC00]/10 border border-[#FFCC00]/30 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-[#FFCC00] shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400 font-medium">Referral Code: </span>
                  <span className="font-mono font-bold text-[#FFCC00] tracking-wider uppercase">{inviteCode}</span>
                  <span className="text-slate-400 text-[11px] block truncate">
                    Sponsor: <span className="font-semibold text-white">{sponsorName}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInviteCode('');
                  setSponsorName('');
                  setUrlMessage('');
                }}
                className="text-[11px] font-semibold text-slate-400 hover:text-white underline ml-2 shrink-0"
              >
                Clear
              </button>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmitRegistration} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
              <input
                type="text"
                required
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-[#181922] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#181922] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Create password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#181922] border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#FFCC00] focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-[#181922] border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#FFCC00] focus:outline-none transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Invite / Referral Code (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Invite / Referral Code</span>
                <span className="text-[10px] text-[#FFCC00] font-normal uppercase">Optional</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter code (or leave empty)"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    if (sponsorName) setSponsorName('');
                  }}
                  className="w-full bg-[#181922] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 transition font-mono uppercase tracking-wider"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Gift className="w-4 h-4 text-[#FFCC00]/70" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 pl-1">
                Optional: If you don't have a code, you can register without one.
              </p>
            </div>

            {/* Verify Code with Captcha */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Verify Code</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Enter code"
                  value={formData.verifyCode}
                  onChange={(e) => setFormData({ ...formData, verifyCode: e.target.value })}
                  className="w-full bg-[#181922] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 transition font-mono tracking-widest text-center"
                />
                <div
                  onClick={refreshCaptcha}
                  title="Click to refresh verification code"
                  className="bg-[#181922] border border-white/15 rounded-xl px-4 py-2 flex items-center justify-center cursor-pointer select-none relative overflow-hidden group hover:border-[#FFCC00]/40 transition"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <line x1="5%" y1="20%" x2="90%" y2="80%" stroke="#FFCC00" strokeWidth="1" />
                      <line x1="10%" y1="85%" x2="85%" y2="15%" stroke="#FFCC00" strokeWidth="1" />
                    </svg>
                  </div>
                  <span className="font-serif text-lg tracking-[0.35em] text-[#FFCC00] font-black select-none pl-1 drop-shadow-[0_0_6px_rgba(255,204,0,0.4)]">
                    {captchaCode.split('').join(' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Sign Up Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black py-3.5 rounded-xl text-sm transition shadow-[0_4px_20px_rgba(255,204,0,0.35)] disabled:opacity-50 tracking-wider uppercase flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Game Wallet</span>
                )}
              </button>
            </div>

            {/* Link back to Sign In */}
            <div className="text-center text-xs text-slate-400 pt-2">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-[#FFCC00] font-bold hover:underline">
                Sign in here
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4 relative z-10">
        Copyright © 2026 TierlockPlay. All rights reserved. • When Trust Matters, Choose Tierlock
      </footer>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080b]"></div>}>
      <SignUpContent />
    </Suspense>
  );
}
