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
    <div className="min-h-screen bg-[#f0f4f9] text-[#1e293b] flex">
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
            <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Account Settings</h1>
          </div>

          {/* Top Section: 2 Cards (Profile Information + Update Password) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Profile Information (Screenshot 16) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <User className="w-4 h-4 text-gray-500" />
                <span>Profile Information</span>
              </div>

              <div className="space-y-4 text-sm">
                {/* KYC Name */}
                <div className="flex items-center">
                  <span className="w-32 text-gray-500 font-medium">KYC Name:</span>
                  <span className="text-gray-800 font-semibold">{user?.kyc_name || '-'}</span>
                </div>

                {/* Username */}
                <div className="flex items-center">
                  <span className="w-32 text-gray-500 font-medium">Username:</span>
                  <span className="text-gray-800 font-semibold">{user?.username || 'alex'}</span>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-32 text-gray-500 font-medium">Email:</span>
                    <span className="text-gray-800 font-semibold">{user?.email || 'ahmadnabeel634@gmail.com'}</span>
                  </div>
                  <button
                    onClick={() => setIsEditEmailOpen(true)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition"
                    title="Edit Email"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Email Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-32 text-gray-500 font-medium">Email Status:</span>
                    {user?.is_email_verified ? (
                      <span className="bg-[#15803d] text-white text-xs font-bold px-3 py-1 rounded">
                        VERIFIED
                      </span>
                    ) : (
                      <span className="bg-[#451a1a] text-[#f87171] text-xs font-bold px-3 py-1 rounded">
                        UNVERIFIED
                      </span>
                    )}
                  </div>
                  {!user?.is_email_verified && (
                    <button
                      onClick={handleOpenEmailVerification}
                      className="text-sm font-semibold text-[#1d4ed8] hover:text-[#1e40af] transition"
                    >
                      Verify Email
                    </button>
                  )}
                </div>

                {/* KYC Status */}
                <div className="flex items-center">
                  <span className="w-32 text-gray-500 font-medium">KYC Status:</span>
                  <span className="bg-[#451a1a] text-[#f87171] text-xs font-bold px-3 py-1 rounded">
                    {user?.kyc_status || 'INCOMPLETE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Update Password (Screenshot 16) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Lock className="w-4 h-4 text-gray-500" />
                <span>Update Password</span>
              </div>

              {passwordNotice.text && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordNotice.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                  {passwordNotice.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{passwordNotice.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Current Password Field */}
                <div className="relative border border-gray-200 rounded-lg px-3 pt-2 pb-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] font-medium text-gray-500">
                    Current Password
                  </label>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      placeholder="Enter your current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full text-xs sm:text-sm text-gray-800 focus:outline-none placeholder-gray-400 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div className="relative border border-gray-200 rounded-lg px-3 pt-2 pb-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] font-medium text-gray-500">
                    New Password
                  </label>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      placeholder="Enter your new password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full text-xs sm:text-sm text-gray-800 focus:outline-none placeholder-gray-400 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="relative border border-gray-200 rounded-lg px-3 pt-2 pb-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[11px] font-medium text-gray-500">
                    Confirm Password
                  </label>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Confirm your new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full text-xs sm:text-sm text-gray-800 focus:outline-none placeholder-gray-400 bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Save Button (Right-aligned, midnight navy) */}
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="bg-[#1c304d] hover:bg-[#253f63] text-white font-semibold text-sm px-7 py-2.5 rounded-lg transition shadow-sm disabled:opacity-50"
                  >
                    {isUpdatingPassword ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Section: Payment Methods (Screenshot 16 & 19) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-gray-800">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span>Payment Methods</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage the accounts you use to receive withdrawals
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedMethodType(null);
                  setAccountIdentifier('');
                  setIsPayoutModalOpen(true);
                }}
                className="bg-[#1c304d] hover:bg-[#253f63] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition self-start sm:self-auto shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Receiving Method</span>
              </button>
            </div>

            {/* Empty or List State */}
            {paymentMethods.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <Wallet className="w-10 h-10 text-gray-400 mb-3 stroke-1" />
                <span className="text-sm text-gray-500 font-medium">No receiving methods added yet.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentMethods.map((m) => (
                  <div key={m._id || m.id} className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-tr from-[#1c304d] to-[#2c4b77]">
                        {m.type === 'Cash App' ? '$' : m.type === 'PayPal' ? 'P' : '💳'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{m.type}</div>
                        <div className="text-xs font-mono text-gray-500">{m.account_identifier}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePaymentMethod(m._id || m.id)}
                      className="text-gray-400 hover:text-red-500 p-1.5 transition"
                      title="Remove method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Browser Sessions (Screenshot 16) */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 text-base font-bold text-gray-800">
                <Laptop className="w-5 h-5 text-gray-600" />
                <span>Browser Sessions</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <p className="text-xs text-gray-500 leading-relaxed">
                If necessary, you may log out all of your other browser sessions across all of your devices. Some of your recent sessions are listed below, however, this list may not be exhaustive. If you feel your account has been compromised, you should also update your password.
              </p>

              {/* Session Item */}
              <div className="flex items-center gap-3 pt-2">
                <Laptop className="w-6 h-6 text-[#009bf2]" />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">Macos</span>
                    <span className="bg-[#15803d] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      This device
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
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

      {/* MODAL 1: Choose Payout Method (Screenshot 19) */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Choose Payout Method</h2>
              <p className="text-xs sm:text-sm text-gray-500">
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
                  className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:shadow-md transition text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00d632] flex items-center justify-center text-white font-black text-lg">
                    $
                  </div>
                  <span className="font-bold text-sm text-gray-800 group-hover:text-emerald-600 transition">
                    Cash App
                  </span>
                </button>

                {/* Chime */}
                <button
                  type="button"
                  onClick={() => setSelectedMethodType('Chime')}
                  className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:shadow-md transition text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25c974]/20 text-[#25c974] flex items-center justify-center font-black text-xs">
                    chime
                  </div>
                  <span className="font-bold text-sm text-gray-800 group-hover:text-emerald-600 transition">
                    Chime
                  </span>
                </button>

                {/* Paypal */}
                <button
                  type="button"
                  onClick={() => setSelectedMethodType('Paypal')}
                  className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0070ba] flex items-center justify-center text-white font-black text-sm">
                    P
                  </div>
                  <span className="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition">
                    Paypal
                  </span>
                </button>

                {/* Debit Card */}
                <button
                  type="button"
                  onClick={() => setSelectedMethodType('Debit Card')}
                  className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-gray-800 group-hover:text-sky-600 transition">
                    Debit Card
                  </span>
                </button>
              </div>
            ) : (
              /* Account Identifier Input Step */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-800">
                    Entering details for {selectedMethodType}
                  </span>
                  <button
                    onClick={() => setSelectedMethodType(null)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Change method
                  </button>
                </div>

                <div className="relative border border-gray-300 rounded-xl px-4 py-2.5 focus-within:border-blue-500">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
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
                    className="w-full text-sm text-gray-900 focus:outline-none font-mono"
                  />
                </div>

                {payoutNotice && (
                  <p className="text-xs text-red-500 font-medium">{payoutNotice}</p>
                )}

                <button
                  type="button"
                  onClick={handleSavePayoutMethod}
                  disabled={isSavingMethod}
                  className="w-full bg-[#1c304d] hover:bg-[#253f63] text-white font-semibold py-3 rounded-xl transition shadow text-sm disabled:opacity-50"
                >
                  {isSavingMethod ? 'Saving...' : `Save ${selectedMethodType} Method`}
                </button>
              </div>
            )}

            {/* Cancel Button (Cyan/Blue full width) */}
            <button
              type="button"
              onClick={() => {
                setIsPayoutModalOpen(false);
                setSelectedMethodType(null);
              }}
              className="w-full bg-[#009bf2] hover:bg-[#0089d8] text-white font-semibold py-3 rounded-xl transition shadow text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Email Verification (Screenshot 20) */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Email Verification</h2>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              A verification token has been generated (simulated email). Copy the token and paste it below to complete email verification.
            </p>

            {/* Token Display Box with Copy Button */}
            <div className="bg-[#f1f5f9] rounded-2xl p-4 flex items-center justify-between">
              <span className="font-mono text-lg sm:text-xl font-bold tracking-wider text-gray-900">
                {emailToken}
              </span>
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-gray-500 hover:text-gray-800 p-2 rounded-lg transition"
                title="Copy token"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <p className="text-[11px] text-gray-400">
              Valid for 30 minutes (expires in 30 minutes)
            </p>

            {emailNotice.text && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                emailNotice.isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {emailNotice.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{emailNotice.text}</span>
              </div>
            )}

            {/* Outlined Input with Notch Label & Key Icon */}
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              <div className="relative border border-gray-300 rounded-xl px-4 pt-2.5 pb-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
                <label className="absolute -top-2.5 left-4 bg-white px-1 text-[11px] font-medium text-gray-500">
                  Verification Token
                </label>
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Paste verification token"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full text-sm text-gray-800 focus:outline-none placeholder-gray-400 bg-transparent font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons (Right-aligned Cancel & Verify) */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    setTokenInput('');
                    setEmailNotice({ text: '', isError: false });
                  }}
                  className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!tokenInput.trim() || isVerifyingToken}
                  className="bg-[#1c304d] hover:bg-[#253f63] text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Update Email Address</h3>
              <button onClick={() => setIsEditEmailOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">New Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditEmailOpen(false)}
                  className="text-xs font-semibold text-gray-600 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmail}
                  className="bg-[#1c304d] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#253f63] transition"
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
