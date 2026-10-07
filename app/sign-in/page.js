'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    usernameOrEmail: 'alex',
    password: 'alex123',
    verifyCode: '',
  });
  const [captchaCode, setCaptchaCode] = useState('4911');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const refreshCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setFormData((prev) => ({ ...prev, verifyCode: '' }));
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.verifyCode !== captchaCode) {
      setErrorMsg('Incorrect verify code. Please enter the 4 digits shown.');
      refreshCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: formData.usernameOrEmail,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/player/dashboard');
        router.refresh();
      } else {
        setErrorMsg(data.message || 'Login failed. Please check credentials.');
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
        {/* Centered White Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl max-w-md w-full p-8 sm:p-10 shadow-xl">
          {/* Official Logo Badge */}
          <div className="flex justify-center mb-5">
            <Logo size="large" href="/sign-in" theme="light" />
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Game Wallet Sign In</h1>
            <p className="text-xs text-slate-500 mt-1">Access your 12 platforms with one master wallet</p>
            <div className="w-10 h-0.5 bg-amber-500 mx-auto mt-2 rounded-full"></div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username / Email
              </label>
              <input
                type="text"
                required
                placeholder="Enter your username or email"
                value={formData.usernameOrEmail}
                onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
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

            {/* Verify Code with Captcha Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Verify Code
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Enter code"
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
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md disabled:opacity-50 tracking-wide uppercase"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>

            {/* Links */}
            <div className="text-center space-y-2 pt-2">
              <Link
                href="/player/settings"
                className="text-xs text-amber-600 hover:text-amber-700 font-medium block"
              >
                Forgot your password?
              </Link>
              <div className="text-xs text-slate-500">
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="text-slate-900 font-bold hover:underline">
                  Sign up here
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4">
        Copyright © 2026 TRP Vegas Vault. All rights reserved.
      </footer>
    </div>
  );
}
