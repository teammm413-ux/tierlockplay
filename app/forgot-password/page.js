'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import WhatsAppChat from '@/components/WhatsAppChat';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 request, 2 reset
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('4911');
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState({ text: '', isError: false });
  const [devTokenHint, setDevTokenHint] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const refreshCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setVerifyCode('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const requestResetCode = async () => {
    setNotice({ text: '', isError: false });
    setDevTokenHint('');

    if (verifyCode !== captchaCode) {
      setNotice({ text: 'Incorrect verify code. Enter the 4 digits shown.', isError: true });
      refreshCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: usernameOrEmail.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.email) {
          setAccountEmail(data.email);
          setMaskedEmail(data.maskedEmail || data.email);
        }
        setStep(2);
        setResendCooldown(60);
        if (data.token) {
          setDevTokenHint(data.token);
        }
        setNotice({
          text: data.message || 'Check your email for the 6-digit code.',
          isError: false,
        });
        refreshCaptcha();
      } else {
        setNotice({ text: data.message || 'Could not send reset code', isError: true });
        refreshCaptcha();
      }
    } catch {
      setNotice({ text: 'Connection error. Please try again.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !usernameOrEmail.trim()) return;
    setIsLoading(true);
    setNotice({ text: '', isError: false });
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: usernameOrEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.email) setAccountEmail(data.email);
        if (data.maskedEmail) setMaskedEmail(data.maskedEmail);
        if (data.token) setDevTokenHint(data.token);
        setResendCooldown(60);
        setNotice({ text: data.message || 'New code sent.', isError: false });
      } else {
        setNotice({ text: data.message || 'Resend failed', isError: true });
      }
    } catch {
      setNotice({ text: 'Connection error', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const submitNewPassword = async (e) => {
    e.preventDefault();
    setNotice({ text: '', isError: false });

    if (!accountEmail) {
      setNotice({ text: 'Session expired. Start again from step 1.', isError: true });
      setStep(1);
      return;
    }

    if (resetCode.trim().length !== 6) {
      setNotice({ text: 'Enter the 6-digit code from your email', isError: true });
      return;
    }

    if (newPassword.length < 6) {
      setNotice({ text: 'Password must be at least 6 characters', isError: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice({ text: 'Passwords do not match', isError: true });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: accountEmail,
          token: resetCode.trim(),
          newPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setNotice({ text: data.message, isError: false });
        setTimeout(() => router.push('/sign-in'), 2200);
      } else {
        setNotice({ text: data.message || 'Reset failed', isError: true });
      }
    } catch {
      setNotice({ text: 'Connection error', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col justify-between py-4 sm:py-10 px-3.5 sm:px-6 relative font-sans overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] sm:h-[350px] bg-gradient-to-b from-yellow-500/15 via-yellow-500/5 to-transparent blur-[100px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center relative z-10 my-auto">
        <div className="bg-[#101117] border border-yellow-500/25 rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-[0_0_50px_rgba(255,204,0,0.08)] backdrop-blur-md">
          <div className="flex justify-center mb-3 sm:mb-5">
            <Logo size="medium" href="/sign-in" theme="dark" />
          </div>

          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
              {step === 1 ? 'Forgot Password' : 'Set New Password'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
              {step === 1
                ? 'Enter your username or email — we email a reset code to your registered address'
                : maskedEmail
                ? `Code sent to ${maskedEmail}`
                : 'Enter the code from your email'}
            </p>
            <div className="w-10 h-0.5 sm:h-1 bg-[#FFCC00] mx-auto mt-2 rounded-full shadow-[0_0_10px_rgba(255,204,0,0.5)]" />
          </div>

          {notice.text && (
            <div
              className={`mb-4 flex items-start gap-2 text-xs p-3 rounded-lg border ${
                notice.isError
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}
            >
              {notice.isError ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{notice.text}</span>
            </div>
          )}

          {devTokenHint && (
            <div className="mb-4 text-xs p-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-200">
              Dev / SMTP off — reset code: <strong className="tracking-widest">{devTokenHint}</strong>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">
                  Username or Email
                </label>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500/50 outline-none"
                  placeholder="e.g. alex or you@email.com"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">Verify Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="flex-1 bg-[#07080b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-yellow-500/50 outline-none"
                    placeholder="4 digits"
                  />
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="px-3 rounded-xl border border-yellow-500/30 bg-black/40 text-yellow-400 text-sm font-bold min-w-[88px]"
                    title="Refresh code"
                  >
                    {captchaCode.split('').join(' ')}
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading || !usernameOrEmail.trim()}
                onClick={requestResetCode}
                className="w-full bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm transition shadow-[0_4px_20px_rgba(255,204,0,0.35)] disabled:opacity-50 uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Send Reset Code
              </button>
            </div>
          ) : (
            <form onSubmit={submitNewPassword} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">6-Digit Email Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-4 py-3 text-sm text-white tracking-[0.35em] text-center font-bold focus:border-yellow-500/50 outline-none"
                  placeholder="000000"
                />
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleResend}
                  className="mt-2 text-[11px] text-yellow-400 hover:text-yellow-300 disabled:text-slate-500"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">New Password</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:border-yellow-500/50 outline-none"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-white"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">Confirm Password</label>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm text-white focus:border-yellow-500/50 outline-none"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm transition disabled:opacity-50 uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Update Password
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setNotice({ text: '', isError: false });
                }}
                className="w-full text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </form>
          )}

          <div className="text-center mt-5">
            <Link href="/sign-in" className="text-[11px] sm:text-xs text-[#FFCC00] font-bold hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center text-[10px] sm:text-xs text-slate-500 py-2 relative z-10">
        Copyright © 2026 TierlockPlay. All rights reserved.
      </footer>

      <WhatsAppChat />
    </div>
  );
}
