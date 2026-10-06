'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
    <div className="min-h-screen bg-[#131f32] flex flex-col justify-between py-10 px-4 sm:px-6 relative">
      <div className="flex-1 flex items-center justify-center">
        {/* Main Card */}
        <div className="bg-white rounded-3xl max-w-md w-full p-8 sm:p-10 shadow-2xl">
          {/* Logo Badge */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1c304d] text-white flex items-center justify-center text-2xl font-bold shadow-md">
              T
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">TRP Game Wallet</h1>
            <p className="text-xs text-gray-500 mt-1">Sign Up</p>
            <div className="w-8 h-0.5 bg-gray-400 mx-auto mt-2 rounded-full"></div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Case 1: No invite code provided (Screenshot "image.png") */}
          {!hasInvite ? (
            <div className="space-y-6 text-center py-4">
              <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
                Registration requires an invite code. Please contact your sponsor to get one.
              </p>

              <div>
                <Link
                  href="/sign-in"
                  className="inline-block border border-gray-300 hover:bg-gray-50 text-gray-800 text-sm font-semibold px-8 py-2.5 rounded-xl transition shadow-sm"
                >
                  Sign in here
                </Link>
              </div>

              {/* Convenience fallback for testing */}
              <div className="pt-4 border-t border-gray-100">
                {!showManualInput ? (
                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowManualInput(true)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Have an invite code? Click here
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasInvite(true);
                        setInviteCode('VIP777');
                      }}
                      className="text-[11px] text-gray-400 hover:text-gray-600"
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
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-[#1c304d] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#253f63]"
                    >
                      Continue
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* Case 2: Invite code present (Screenshot "image copy 2.png") */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Verify Code with Captcha */}
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={formData.verifyCode}
                    onChange={(e) => setFormData({ ...formData, verifyCode: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <div
                    onClick={refreshCaptcha}
                    title="Click to refresh verification code"
                    className="bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-2 flex items-center justify-center cursor-pointer select-none relative overflow-hidden group hover:border-gray-300 transition"
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <line x1="5%" y1="15%" x2="90%" y2="85%" stroke="#64748b" strokeWidth="1" />
                        <line x1="10%" y1="80%" x2="85%" y2="20%" stroke="#94a3b8" strokeWidth="1" />
                      </svg>
                    </div>
                    <span className="font-serif text-lg tracking-[0.35em] text-gray-800 font-bold select-none pl-1">
                      {captchaCode.split('').join(' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign Up Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1c304d] hover:bg-[#253f63] text-white font-semibold py-3.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </div>

              {/* Link back to Sign In */}
              <div className="text-center text-xs text-gray-600 pt-2">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-[#1d4ed8] font-bold hover:underline">
                  Sign in here
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-4">
        Copyright © 2026 TRP. All rights reserved.
      </footer>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#131f32]"></div>}>
      <SignUpContent />
    </Suspense>
  );
}
