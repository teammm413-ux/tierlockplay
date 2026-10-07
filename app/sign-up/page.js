'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryInvite = searchParams.get('invite_code');

  const [hasInvite, setHasInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [customInviteInput, setCustomInviteInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const refreshCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setFormData((prev) => ({ ...prev, verifyCode: '' }));
  };

  useEffect(() => {
    refreshCaptcha();
    if (queryInvite && queryInvite.trim()) {
      setHasInvite(true);
      setInviteCode(queryInvite.trim());
    }
  }, [queryInvite]);

  const handleApplyInvite = (e) => {
    e.preventDefault();
    if (customInviteInput.trim()) {
      setHasInvite(true);
      setInviteCode(customInviteInput.trim());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (formData.verifyCode !== captchaCode) {
      setErrorMsg('Incorrect verify code. Please enter the 4 digits shown.');
      refreshCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          inviteCode: inviteCode || 'VIP777',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Account registered successfully! Redirecting...');
        setTimeout(() => {
          router.push('/player/dashboard');
          router.refresh();
        }, 1200);
      } else {
        setErrorMsg(data.message || 'Registration failed');
        refreshCaptcha();
      }
    } catch (err) {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
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
              {hasInvite ? `VIP Invite Code Activated: ${inviteCode}` : 'VIP Player Registration'}
            </p>
            <div className="w-10 h-0.5 bg-amber-500 mx-auto mt-2 rounded-full"></div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Case 1: No invite code provided */}
          {!hasInvite ? (
            <div className="space-y-6 text-center py-4">
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

              {/* Convenience fallback for testing */}
              <div className="pt-4 border-t border-slate-100">
                {!showManualInput ? (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowManualInput(true)}
                      className="text-xs text-amber-600 font-semibold hover:underline"
                    >
                      Have an invite code? Click here
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasInvite(true);
                        setInviteCode('VIP777');
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      (Or test with default code: VIP777)
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyInvite} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter invite code (e.g. 1AZu1O)"
                      value={customInviteInput}
                      onChange={(e) => setCustomInviteInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800"
                    >
                      Continue
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* Case 2: Invite code present */
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md disabled:opacity-50 tracking-wide uppercase"
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
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
