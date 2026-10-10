'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col justify-between py-10 px-4 sm:px-6 relative font-sans overflow-hidden">
      {/* Ambient Yellow/Gold Glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-yellow-500/15 via-yellow-500/5 to-transparent blur-[120px] pointer-events-none"></div>

      <div className="flex-1 flex items-center justify-center relative z-10">
        {/* Centered Yellow & Black Card */}
        <div className="bg-[#101117] border border-yellow-500/25 rounded-3xl max-w-md w-full p-8 sm:p-10 shadow-[0_0_60px_rgba(255,204,0,0.08)] backdrop-blur-md">
          {/* Official Tierlock Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="large" href="/sign-in" theme="dark" />
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Game Wallet Sign In</h1>
            <p className="text-xs text-slate-400 mt-1">Access your 12 sweepstakes platforms with one master wallet</p>
            <div className="w-12 h-1 bg-[#FFCC00] mx-auto mt-2.5 rounded-full shadow-[0_0_10px_rgba(255,204,0,0.5)]"></div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / Email
              </label>
              <input
                type="text"
                required
                placeholder="Enter your username or email"
                value={formData.usernameOrEmail}
                onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
                className="w-full bg-[#181922] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
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

            {/* Verify Code with Captcha Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Verify Code
              </label>
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

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black py-3.5 rounded-xl text-sm transition shadow-[0_4px_20px_rgba(255,204,0,0.35)] disabled:opacity-50 tracking-wider uppercase flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>

            {/* Links */}
            <div className="text-center space-y-2 pt-2">
              <Link
                href="/player/settings"
                className="text-xs text-yellow-400 hover:text-yellow-300 font-medium block transition-colors"
              >
                Forgot your password?
              </Link>
              <div className="text-xs text-slate-400">
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="text-[#FFCC00] font-bold hover:underline">
                  Sign up here
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4 relative z-10">
        Copyright © 2026 TierlockPlay (tierlockplay.com). All rights reserved.
      </footer>
    </div>
  );
}
