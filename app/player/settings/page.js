'use client';

import React, { useState, useEffect } from 'react';
import PlayerHeader from '@/components/PlayerHeader';
import Sidebar from '@/components/Sidebar';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import {
  User,
  Lock,
  CreditCard,
  Laptop,
  Globe,
  Edit2,
  Copy,
  Check,
  Key,
  X,
  Eye,
  EyeOff,
  Wallet,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Plus
} from 'lucide-react';

export default function AccountSettingsPage() {
  const [user, setUser] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Password state & visibility toggles
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState({ text: '', isError: false });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Email Verification Modal state (Screenshot 20)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailToken, setEmailToken] = useState('900866');
  const [tokenInput, setTokenInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSendingToken, setIsSendingToken] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [emailNotice, setEmailNotice] = useState({ text: '', isError: false });

  // Payout Method Modal state (Screenshot 19)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedMethodType, setSelectedMethodType] = useState(null);
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [isSavingMethod, setIsSavingMethod] = useState(false);
  const [payoutNotice, setPayoutNotice] = useState('');

  // Edit Email Modal state
  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setNewEmailInput(data.user.email || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const res = await fetch('/api/wallet/payment-methods');
      const data = await res.json();
      if (data.success) {
        setPaymentMethods(data.methods || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshUserData();
    loadPaymentMethods();
  }, []);

  // Open Email Verification Modal & generate token (Screenshot 20)
  const handleOpenEmailVerification = async () => {
    setIsEmailModalOpen(true);
    setIsSendingToken(true);
    setEmailNotice({ text: '', isError: false });
    try {
      const res = await fetch('/api/auth/send-email-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setEmailToken(data.token);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingToken(false);
    }
  };

  const handleCopyToken = () => {
    if (!emailToken) return;
    navigator.clipboard.writeText(emailToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsVerifyingToken(true);
    setEmailNotice({ text: '', isError: false });

    try {
      const res = await fetch('/api/auth/verify-email-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, token: tokenInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailNotice({ text: data.message, isError: false });
        refreshUserData();
        setTimeout(() => {
          setIsEmailModalOpen(false);
          setTokenInput('');
          setEmailNotice({ text: '', isError: false });
        }, 1500);
      } else {
        setEmailNotice({ text: data.message || 'Invalid token', isError: true });
      }
    } catch (err) {
      setEmailNotice({ text: 'Error connecting to server', isError: true });
    } finally {
      setIsVerifyingToken(false);
    }
  };

  // Password update handler
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordNotice({ text: '', isError: false });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordNotice({ text: 'New passwords do not match', isError: true });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordNotice({ text: 'Password successfully updated!', isError: false });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordNotice({ text: data.message || 'Failed to update password', isError: true });
      }
    } catch (err) {
      setPasswordNotice({ text: 'Error updating password', isError: true });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Save Payout Method handler (Screenshot 19)
  const handleSavePayoutMethod = async () => {
    if (!accountIdentifier.trim() || !selectedMethodType) return;
    setIsSavingMethod(true);
    setPayoutNotice('');

    try {
      const res = await fetch('/api/wallet/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedMethodType,
          accountIdentifier: accountIdentifier.trim(),
          isDefault: paymentMethods.length === 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPayoutModalOpen(false);
        setSelectedMethodType(null);
        setAccountIdentifier('');
        loadPaymentMethods();
      } else {
        setPayoutNotice(data.message || 'Failed to save method');
      }
    } catch (err) {
      setPayoutNotice('Error saving method');
    } finally {
      setIsSavingMethod(false);
    }
  };

  // Delete Payment Method
  const handleDeletePaymentMethod = async (id) => {
    try {
      await fetch(`/api/wallet/payment-methods?id=${id}`, { method: 'DELETE' });
      loadPaymentMethods();
    } catch (err) {}
  };

  // Update Email handler
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!newEmailInput.trim()) return;
    setIsUpdatingEmail(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmailInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditEmailOpen(false);
        refreshUserData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex">
      {/* Left Sidebar */}
      <Sidebar user={user} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <PlayerHeader
          user={user}
          onOpenChat={() => setIsChatOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Account Settings</h1>
            <p className="text-xs text-slate-400 mt-1">Manage your security credentials, payment receiving methods, and sessions.</p>
          </div>

          {/* Top Section: 2 Cards (Profile Information + Update Password) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Profile Information */}
            <div className="bg-[#101117] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <span className="w-7 h-7 rounded-lg bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center">
                  <User className="w-4 h-4" />
                </span>
                <span>Profile Information</span>
              </div>

              <div className="space-y-4 text-sm divide-y divide-white/5">
                {/* KYC Name */}
                <div className="flex items-center pt-2">
                  <span className="w-32 text-slate-400 font-medium">KYC Name:</span>
                  <span className="text-white font-semibold">{user?.kyc_name || '-'}</span>
                </div>

                {/* Username */}
                <div className="flex items-center pt-3">
                  <span className="w-32 text-slate-400 font-medium">Username:</span>
                  <span className="text-white font-semibold font-mono">{user?.username || 'alex'}</span>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-center">
                    <span className="w-32 text-slate-400 font-medium">Email:</span>
                    <span className="text-white font-semibold">{user?.email || 'ahmadnabeel634@gmail.com'}</span>
                  </div>
                  <button
                    onClick={() => setIsEditEmailOpen(true)}
                    className="text-slate-400 hover:text-[#FFCC00] p-1 rounded-md transition"
                    title="Edit Email"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Email Status */}
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-center">
                    <span className="w-32 text-slate-400 font-medium">Email Status:</span>
                    {user?.is_email_verified ? (
                      <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-lg">
                        VERIFIED
                      </span>
                    ) : (
                      <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold px-3 py-1 rounded-lg">
                        UNVERIFIED
                      </span>
                    )}
                  </div>
                  {!user?.is_email_verified && (
                    <button
                      onClick={handleOpenEmailVerification}
                      className="text-xs font-bold text-[#FFCC00] hover:underline transition"
                    >
                      Verify Email
                    </button>
                  )}
                </div>

                {/* KYC Status */}
                <div className="flex items-center pt-3">
                  <span className="w-32 text-slate-400 font-medium">KYC Status:</span>
                  <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold px-3 py-1 rounded-lg">
                    {user?.kyc_status || 'INCOMPLETE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Update Password */}
            <div className="bg-[#101117] rounded-3xl border border-white/10 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                <span className="w-7 h-7 rounded-lg bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </span>
                <span>Update Password</span>
              </div>

              {passwordNotice.text && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordNotice.isError ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {passwordNotice.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{passwordNotice.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Current Password Field */}
                <div className="relative border border-white/10 rounded-xl px-3 pt-2.5 pb-2 bg-[#181922] focus-within:border-[#FFCC00] transition">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Current Password
                  </label>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      placeholder="Enter your current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full text-xs sm:text-sm text-white focus:outline-none placeholder-slate-500 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="text-slate-400 hover:text-white focus:outline-none"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div className="relative border border-white/10 rounded-xl px-3 pt-2.5 pb-2 bg-[#181922] focus-within:border-[#FFCC00] transition">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    New Password
                  </label>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      placeholder="Enter your new password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full text-xs sm:text-sm text-white focus:outline-none placeholder-slate-500 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="text-slate-400 hover:text-white focus:outline-none"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="relative border border-white/10 rounded-xl px-3 pt-2.5 pb-2 bg-[#181922] focus-within:border-[#FFCC00] transition">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Confirm Password
                  </label>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Confirm your new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full text-xs sm:text-sm text-white focus:outline-none placeholder-slate-500 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-slate-400 hover:text-white focus:outline-none"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="bg-[#FFCC00] hover:bg-[#e6b800] text-slate-950 font-black text-xs sm:text-sm px-7 py-2.5 rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50"
                  >
                    {isUpdatingPassword ? 'Saving...' : 'Save Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Section: Payment Methods */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-white">
                  <CreditCard className="w-5 h-5 text-[#FFCC00]" />
                  <span>Payout & Receiving Methods</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage the accounts you use to receive wallet withdrawals
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedMethodType(null);
                  setAccountIdentifier('');
                  setIsPayoutModalOpen(true);
                }}
                className="bg-[#FFCC00] hover:bg-[#e6b800] text-slate-950 text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition self-start sm:self-auto shadow-lg shadow-yellow-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Receiving Method</span>
              </button>
            </div>

            {/* Empty or List State */}
            {paymentMethods.length === 0 ? (
              <div className="bg-[#101117] rounded-3xl border border-white/10 p-12 flex flex-col items-center justify-center text-center">
                <Wallet className="w-10 h-10 text-slate-500 mb-3 stroke-1" />
                <span className="text-sm text-slate-400 font-medium">No receiving methods added yet.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentMethods.map((m) => (
                  <div key={m._id || m.id} className="bg-[#101117] rounded-2xl border border-white/10 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-black text-sm bg-[#FFCC00]">
                        {m.type === 'Cash App' ? '$' : m.type === 'PayPal' ? 'P' : '💳'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{m.type}</div>
                        <div className="text-xs font-mono text-slate-400">{m.account_identifier}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePaymentMethod(m._id || m.id)}
                      className="text-slate-400 hover:text-rose-400 p-1.5 transition"
                      title="Remove method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Browser Sessions */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <Laptop className="w-5 h-5 text-[#FFCC00]" />
                <span>Browser Sessions</span>
              </div>
            </div>

            <div className="bg-[#101117] rounded-3xl border border-white/10 p-6 space-y-5">
              <p className="text-xs text-slate-400 leading-relaxed">
                If necessary, you may log out all of your other browser sessions across all of your devices. Some of your recent sessions are listed below. If you feel your account has been compromised, you should also update your password.
              </p>

              {/* Session Item */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FFCC00]">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">macOS</span>
                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      This device
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>{user?.last_login_ip || '182.190.183.135'}</span>
                    <span>·</span>
                    <span>{user?.last_login_time || '2026-10-02 12:10'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL 1: Choose Payout Method */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#101117] border border-white/10 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Choose Payout Method</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Select how you&apos;d like to receive your payouts
              </p>
            </div>

            {!selectedMethodType ? (
              /* Method Selection Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cash App */}
                <button
                  type="button"
                  onClick={() => setSelectedMethodType('Cash App')}
                  className="flex items-center gap-3.5 p-4 rounded-2xl border border-white/10 bg-[#181922] hover:border-[#FFCC00] transition text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00d632] flex items-center justify-center text-white font-black text-lg">
                    $
                  </div>
                  <span className="font-bold text-sm text-white group-hover:text-[#FFCC00] transition">
                    Cash App
                  </span>
                </button>

                {/* Chime */}
                <button
                  type="button"
                  onClick={() => setSelectedMethodType('Chime')}
                  className="flex items-center gap-3.5 p-4 rounded-2xl border border-white/10 bg-[#181922] hover:border-[#FFCC00] transition text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25c974]/20 text-[#25c974] flex items-center justify-center font-black text-xs">
                    chime
                  </div>
                  <span className="font-bold text-sm text-white group-hover:text-[#FFCC00] transition">
                    Chime
                  </span>
                </button>

                {/* Paypal */}
                <button
                  type="button"
                  onClick={() => setSelectedMethodType('Paypal')}
                  className="flex items-center gap-3.5 p-4 rounded-2xl border border-white/10 bg-[#181922] hover:border-[#FFCC00] transition text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0070ba] flex items-center justify-center text-white font-black text-sm">
                    P
                  </div>
                  <span className="font-bold text-sm text-white group-hover:text-[#FFCC00] transition">
                    Paypal
                  </span>
                </button>

                {/* Debit Card */}
                <button
                  type="button"
                  onClick={() => setSelectedMethodType('Debit Card')}
                  className="flex items-center gap-3.5 p-4 rounded-2xl border border-white/10 bg-[#181922] hover:border-[#FFCC00] transition text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#FFCC00] font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-white group-hover:text-[#FFCC00] transition">
                    Debit Card
                  </span>
                </button>
              </div>
            ) : (
              /* Account Identifier Input Step */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-sm font-bold text-white">
                    Entering details for {selectedMethodType}
                  </span>
                  <button
                    onClick={() => setSelectedMethodType(null)}
                    className="text-xs text-[#FFCC00] hover:underline font-bold"
                  >
                    Change method
                  </button>
                </div>

                <div className="relative border border-white/10 rounded-xl px-4 py-2.5 bg-[#181922] focus-within:border-[#FFCC00]">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {selectedMethodType === 'Cash App'
                      ? 'Cashtag ($name)'
                      : selectedMethodType === 'Paypal'
                      ? 'PayPal Email'
                      : selectedMethodType === 'Chime'
                      ? 'Chime Sign / Email'
                      : 'Card Ending in 4 digits'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      selectedMethodType === 'Cash App'
                        ? '$alex_winner'
                        : selectedMethodType === 'Paypal'
                        ? 'payouts@gmail.com'
                        : selectedMethodType === 'Chime'
                        ? '$chimeuser'
                        : 'Ending in 4829'
                    }
                    value={accountIdentifier}
                    onChange={(e) => setAccountIdentifier(e.target.value)}
                    className="w-full text-sm text-white focus:outline-none font-mono bg-transparent"
                  />
                </div>

                {payoutNotice && (
                  <p className="text-xs text-rose-400 font-medium">{payoutNotice}</p>
                )}

                <button
                  type="button"
                  onClick={handleSavePayoutMethod}
                  disabled={isSavingMethod}
                  className="w-full bg-[#FFCC00] hover:bg-[#e6b800] text-slate-950 font-black py-3 rounded-xl transition shadow-lg shadow-yellow-500/20 text-sm disabled:opacity-50"
                >
                  {isSavingMethod ? 'Saving...' : `Save ${selectedMethodType} Method`}
                </button>
              </div>
            )}

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => {
                setIsPayoutModalOpen(false);
                setSelectedMethodType(null);
              }}
              className="w-full bg-[#181922] hover:bg-white/5 text-slate-300 border border-white/10 font-bold py-3 rounded-xl transition text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Email Verification */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#101117] border border-white/10 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Email Verification</h2>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              A verification token has been generated. Copy the token and paste it below to complete email verification.
            </p>

            {/* Token Display Box with Copy Button */}
            <div className="bg-[#181922] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <span className="font-mono text-lg sm:text-xl font-bold tracking-wider text-[#FFCC00]">
                {emailToken}
              </span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-slate-400 hover:text-white p-2 rounded-lg transition"
                title="Copy token"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Valid for 30 minutes (expires in 30 minutes)
            </p>

            {emailNotice.text && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                emailNotice.isError ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {emailNotice.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{emailNotice.text}</span>
              </div>
            )}

            {/* Outlined Input with Notch Label & Key Icon */}
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              <div className="relative border border-white/10 rounded-xl px-4 pt-2.5 pb-2 bg-[#181922] focus-within:border-[#FFCC00] transition">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Verification Token
                </label>
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Paste verification token"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full text-sm text-white focus:outline-none placeholder-slate-500 bg-transparent font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    setTokenInput('');
                    setEmailNotice({ text: '', isError: false });
                  }}
                  className="text-sm font-semibold text-slate-400 hover:text-white px-4 py-2 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!tokenInput.trim() || isVerifyingToken}
                  className="bg-[#FFCC00] hover:bg-[#e6b800] text-slate-950 font-black text-sm px-6 py-2.5 rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isVerifyingToken ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Email Modal */}
      {isEditEmailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#101117] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-black text-white uppercase tracking-tight">Update Email Address</h3>
              <button onClick={() => setIsEditEmailOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">New Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="w-full border border-white/10 bg-[#181922] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFCC00]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditEmailOpen(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-white px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmail}
                  className="bg-[#FFCC00] hover:bg-[#e6b800] text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl transition shadow-lg shadow-yellow-500/20"
                >
                  {isUpdatingEmail ? 'Saving...' : 'Update Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FreeplayModal onBonusClaimed={(newBal) => setUser((prev) => ({ ...prev, wallet_balance: newBal }))} />
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />
    </div>
  );
}
