'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PlayerHeader from '@/components/PlayerHeader';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import {
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

export default function GamePlatformsPage() {
  const [user, setUser] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // { type: 'bind' | 'deposit' | 'withdraw', platform: obj }
  const [inGameIdInput, setInGameIdInput] = useState('');
  const [amountInput, setAmountInput] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalNotice, setModalNotice] = useState({ text: '', isError: false });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFreeplayOpen, setIsFreeplayOpen] = useState(false);

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) setUser(data.user);
    } catch (err) {}
  };

  const loadPlatforms = async () => {
    try {
      const res = await fetch('/api/games/platforms');
      const data = await res.json();
      if (data.success) setPlatforms(data.platforms || []);
    } catch (err) {}
  };

  useEffect(() => {
    refreshUserData();
    loadPlatforms();
  }, []);

  const openModal = (type, platform) => {
    setActiveModal({ type, platform });
    setInGameIdInput(platform.boundAccountId || '');
    setAmountInput('20');
    setModalNotice({ text: '', isError: false });
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalNotice({ text: '', isError: false });
  };

  // 1. Bind in-game account ID (Screenshot image copy 7 & 9)
  const handleBindSubmit = async (e) => {
    e.preventDefault();
    if (!inGameIdInput.trim()) {
      setModalNotice({ text: 'Please enter your in-game account ID or username', isError: true });
      return;
    }

    setIsSubmitting(true);
    setModalNotice({ text: '', isError: false });

    try {
      const res = await fetch('/api/games/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId: activeModal.platform.id || activeModal.platform._id,
          inGameAccountId: inGameIdInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalNotice({ text: data.message, isError: false });
        loadPlatforms();
        setTimeout(closeModal, 1200);
      } else {
        setModalNotice({ text: data.message || 'Binding failed', isError: true });
      }
    } catch (err) {
      setModalNotice({ text: 'Connection error', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Deposit from Wallet into Game Platform
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0) {
      setModalNotice({ text: 'Enter a valid transfer amount', isError: true });
      return;
    }

    if (!user || user.wallet_balance < amt) {
      setModalNotice({
        text: `Insufficient wallet balance ($${Number(user?.wallet_balance || 0).toFixed(2)}). Please deposit first.`,
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);
    setModalNotice({ text: '', isError: false });

    try {
      const res = await fetch('/api/games/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: activeModal.platform.name,
          gameAccount: activeModal.platform.boundAccountId || inGameIdInput.trim(),
          amount: amt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalNotice({ text: data.message, isError: false });
        refreshUserData();
        loadPlatforms();
        setTimeout(closeModal, 1500);
      } else {
        setModalNotice({ text: data.message || 'Transfer failed', isError: true });
      }
    } catch (err) {
      setModalNotice({ text: 'Connection error', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Redeem / Withdraw from Game Platform to Wallet
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0) {
      setModalNotice({ text: 'Enter a valid redemption amount', isError: true });
      return;
    }

    setIsSubmitting(true);
    setModalNotice({ text: '', isError: false });

    try {
      const res = await fetch('/api/games/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: activeModal.platform.name,
          gameAccount: activeModal.platform.boundAccountId || inGameIdInput.trim(),
          amount: amt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalNotice({ text: data.message, isError: false });
        refreshUserData();
        loadPlatforms();
        setTimeout(closeModal, 1500);
      } else {
        setModalNotice({ text: data.message || 'Redemption failed', isError: true });
      }
    } catch (err) {
      setModalNotice({ text: 'Connection error', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 flex">
      {/* Left Sidebar */}
      <Sidebar user={user} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <PlayerHeader
          user={user}
          onOpenChat={() => setIsChatOpen(true)}
        />

        {/* Page Content */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Title matching Screenshot image copy 7 */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Game Platforms
            </h1>
          </div>

          {/* Platforms Table Container */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    <th className="py-4 px-6 w-12 text-center">#</th>
                    <th className="py-4 px-6 w-28">LOGO</th>
                    <th className="py-4 px-6">PLATFORM NAME</th>
                    <th className="py-4 px-6">DOWNLOAD</th>
                    <th className="py-4 px-6">ACCOUNT</th>
                    <th className="py-4 px-6 text-right pr-8">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {platforms.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        Loading game platforms...
                      </td>
                    </tr>
                  ) : (
                    platforms.map((platform, idx) => {
                      const isBound = Boolean(platform.boundAccountId);
                      const isImageLogo = platform.logo_url && (platform.logo_url.startsWith('/') || platform.logo_url.startsWith('http'));

                      return (
                        <tr
                          key={platform.id || platform._id || idx}
                          className="hover:bg-slate-50/60 transition group"
                        >
                          {/* 1. Number # */}
                          <td className="py-4 px-6 text-center text-slate-600 font-medium">
                            {idx + 1}
                          </td>

                          {/* 2. Logo */}
                          <td className="py-4 px-6">
                            <div className="w-20 h-11 rounded-lg overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center shadow-sm">
                              {isImageLogo ? (
                                <img
                                  src={platform.logo_url}
                                  alt={platform.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/images/games/juwa.jpg';
                                  }}
                                />
                              ) : (
                                <span className="text-xl">{platform.logo_url || '🎰'}</span>
                              )}
                            </div>
                          </td>

                          {/* 3. Platform Name */}
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{platform.name}</span>
                            </div>
                            {platform.tagline && (
                              <div className="text-[11px] text-slate-400 font-normal line-clamp-1">
                                {platform.tagline}
                              </div>
                            )}
                          </td>

                          {/* 4. Download Link */}
                          <td className="py-4 px-6">
                            {platform.download_url ? (
                              <a
                                href={platform.download_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#0077d8] hover:text-[#005fb0] hover:underline flex items-center gap-1 font-medium break-all"
                              >
                                <span>{platform.download_url}</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          {/* 5. In-Game Account */}
                          <td className="py-4 px-6">
                            {isBound ? (
                              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-200">
                                <span>{platform.boundAccountId}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium text-sm">—</span>
                            )}
                          </td>

                          {/* 6. Actions (Deposit, Withdrawal, Bind) */}
                          <td className="py-4 px-6 text-right pr-8">
                            <div className="inline-flex items-center gap-2">
                              {/* Deposit button */}
                              {isBound ? (
                                <button
                                  onClick={() => openModal('deposit', platform)}
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
                                >
                                  Deposit
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#e8edf4] text-slate-400 cursor-not-allowed"
                                >
                                  Deposit
                                </button>
                              )}

                              {/* Withdrawal button */}
                              {isBound ? (
                                <button
                                  onClick={() => openModal('withdraw', platform)}
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0077d8] hover:bg-[#0066be] text-white shadow-sm transition active:scale-95"
                                >
                                  Withdrawal
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#e8edf4] text-slate-400 cursor-not-allowed"
                                >
                                  Withdrawal
                                </button>
                              )}

                              {/* Bind / Change button */}
                              <button
                                onClick={() => openModal('bind', platform)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm active:scale-95 ${
                                  isBound
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                    : 'bg-[#0077d8] hover:bg-[#0066be] text-white'
                                }`}
                              >
                                {isBound ? 'Change' : 'Bind'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Floating Orange $5 Freeplay Button */}
      <FreeplayModal
        isOpen={isFreeplayOpen}
        onClose={() => setIsFreeplayOpen(false)}
        onClaimSuccess={refreshUserData}
      />

      {/* WhatsApp Support Live Chat Drawer */}
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />

      {/* Action Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0077d8] flex items-center justify-center font-bold">
                  {activeModal.type === 'bind' && <LinkIcon className="w-4 h-4" />}
                  {activeModal.type === 'deposit' && <ArrowDownLeft className="w-4 h-4 text-emerald-600" />}
                  {activeModal.type === 'withdraw' && <ArrowUpRight className="w-4 h-4 text-blue-600" />}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeModal.type === 'bind' && `Bind Account: ${activeModal.platform.name}`}
                  {activeModal.type === 'deposit' && `Transfer to ${activeModal.platform.name}`}
                  {activeModal.type === 'withdraw' && `Redeem from ${activeModal.platform.name}`}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice banner */}
            {modalNotice.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  modalNotice.isError
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {modalNotice.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{modalNotice.text}</span>
              </div>
            )}

            {/* Modal Form: Bind */}
            {activeModal.type === 'bind' && (
              <form onSubmit={handleBindSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Game Username or In-Game Account ID
                  </label>
                  <input
                    type="text"
                    value={inGameIdInput}
                    onChange={(e) => setInGameIdInput(e.target.value)}
                    placeholder="e.g. alex_slots99"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter the exact username you use inside {activeModal.platform.name}.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#0077d8] hover:bg-[#0066be] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save & Bind'}
                  </button>
                </div>
              </form>
            )}

            {/* Modal Form: Deposit from Wallet to Game */}
            {activeModal.type === 'deposit' && (
              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Available Wallet Balance:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    ${Number(user?.wallet_balance || 0).toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Transfer Amount ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="Enter amount"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {['10', '20', '50', '100'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmountInput(amt)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                        amountInput === amt
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Transferring...' : 'Transfer to Game'}
                  </button>
                </div>
              </form>
            )}

            {/* Modal Form: Withdraw from Game to Wallet */}
            {activeModal.type === 'withdraw' && (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Game Platform:</span>
                    <span className="font-bold text-slate-800">{activeModal.platform.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bound Account:</span>
                    <span className="font-bold text-blue-600">
                      {activeModal.platform.boundAccountId || 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Redemption Amount ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="Enter amount"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#0077d8] hover:bg-[#0066be] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Redeeming...' : 'Redeem to Wallet'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
