'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PlayerHeader from '@/components/PlayerHeader';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import PromotionalModal from '@/components/PromotionalModal';
import {
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  ShieldCheck,
  Download,
  Wallet,
  Loader2
} from 'lucide-react';

export default function GamePlatformsPage() {
  const [user, setUser] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // { type: 'deposit', platform: obj }
  const [amountInput, setAmountInput] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalNotice, setModalNotice] = useState({ text: '', isError: false });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFreeplayOpen, setIsFreeplayOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedItem, setCopiedItem] = useState(null);

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

  const openDepositModal = (platform) => {
    setActiveModal({ type: 'deposit', platform });
    setAmountInput('20');
    setModalNotice({ text: '', isError: false });
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalNotice({ text: '', isError: false });
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0) {
      setModalNotice({ text: 'Enter a valid transfer amount', isError: true });
      return;
    }

    if (!user || user.wallet_balance < amt) {
      setModalNotice({
        text: `Insufficient wallet balance ($${Number(user?.wallet_balance || 0).toFixed(2)}). Please deposit to wallet first.`,
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
          amount: amt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalNotice({ text: data.message, isError: false });
        refreshUserData();
        loadPlatforms();
        setTimeout(closeModal, 2000);
      } else {
        setModalNotice({ text: data.message || 'Transfer failed', isError: true });
      }
    } catch (err) {
      setModalNotice({ text: 'Connection error submitting game load request', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text, key) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedItem(key);
      setTimeout(() => setCopiedItem(null), 2000);
    }
  };

  const togglePasswordVisibility = (platformId) => {
    setShowPasswords((prev) => ({ ...prev, [platformId]: !prev[platformId] }));
  };

  const activeAccounts = platforms.filter((p) => p.hasAccount);

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

        {/* Page Content */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Header Title & Records Links */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                <Gamepad2 className="w-7 h-7 text-[#FFCC00]" />
                <span>Sweepstakes Game Platforms</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Request in-game accounts, view your game credentials, and load credits directly from your Tierlock wallet.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/player/game-platforms/deposit-records"
                className="text-xs font-bold text-slate-950 bg-[#FFCC00] hover:bg-yellow-300 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Game Deposit Records</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* MY GAME ACCOUNTS & CREDENTIALS SECTION */}
          {activeAccounts.length > 0 && (
            <div className="bg-[#101117] rounded-3xl p-6 sm:p-7 border border-[#FFCC00]/30 shadow-[0_0_40px_rgba(255,204,0,0.06)] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-wide">
                      My Game Accounts &amp; Credentials
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Use these credentials to log in to the official game apps. Kept safe and confidential.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#FFCC00] bg-[#FFCC00]/10 border border-[#FFCC00]/30 px-3 py-1 rounded-full">
                  {activeAccounts.length} Active {activeAccounts.length === 1 ? 'Account' : 'Accounts'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAccounts.map((p) => {
                  const isVisible = showPasswords[p.id];
                  return (
                    <div
                      key={p.id}
                      className="bg-[#181922] border border-white/10 hover:border-[#FFCC00]/40 rounded-2xl p-4 space-y-3 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0">
                          <img
                            src={p.logo_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/images/games/juwa.jpg'; }}
                          />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <h3 className="font-bold text-white text-sm truncate">{p.name}</h3>
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            Account Ready
                          </span>
                        </div>
                      </div>

                      {/* Credentials Box */}
                      <div className="bg-[#0e0f15] border border-white/5 rounded-xl p-3 space-y-2 text-xs">
                        {/* Username */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Username:</span>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-[#FFCC00]">
                            <span>{p.game_username}</span>
                            <button
                              onClick={() => copyToClipboard(p.game_username, `${p.id}-user`)}
                              className="text-slate-400 hover:text-white p-1"
                              title="Copy Username"
                            >
                              {copiedItem === `${p.id}-user` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Password */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Password:</span>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-200">
                            <span>{isVisible ? p.game_password : '••••••••'}</span>
                            <button
                              onClick={() => togglePasswordVisibility(p.id)}
                              className="text-slate-400 hover:text-white p-1"
                              title={isVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(p.game_password, `${p.id}-pass`)}
                              className="text-slate-400 hover:text-white p-1"
                              title="Copy Password"
                            >
                              {copiedItem === `${p.id}-pass` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => openDepositModal(p)}
                          className="flex-1 py-2 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Load Credits</span>
                        </button>
                        <a
                          href={p.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition"
                          title="Download APK / Play Game"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ALL GAME PLATFORMS GRID */}
          <div className="space-y-4">
            <h2 className="text-base font-black text-white uppercase tracking-wide">
              All Available Sweepstakes Platforms
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {platforms.map((p) => (
                <div
                  key={p.id}
                  className="group bg-[#101117] rounded-3xl border border-white/10 hover:border-[#FFCC00]/50 p-4 transition-all duration-300 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    {/* Artwork Box */}
                    <div className="w-full h-44 rounded-2xl overflow-hidden mb-3.5 bg-black relative border border-white/10">
                      <img
                        src={p.logo_url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = '/images/games/juwa.jpg'; }}
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-[#FFCC00] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#FFCC00]/30">
                        {p.rtp || '97% RTP'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-bold text-white group-hover:text-[#FFCC00] transition">
                        {p.name}
                      </h3>
                      {p.hasAccount ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          Account Created
                        </span>
                      ) : p.hasPendingRequest ? (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>Load Pending</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          Ready to Load
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1">
                      {p.tagline || 'Popular fish games & slot reels with high sweepstakes payouts.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center gap-2">
                    <a
                      href={p.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1"
                      title="Download APK / Web Play"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>App</span>
                    </a>

                    <button
                      onClick={() => openDepositModal(p)}
                      className="flex-1 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wide rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>{p.hasAccount ? 'Load Credits' : 'Create & Load'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* GAME DEPOSIT / LOAD MODAL */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101117] border border-[#FFCC00]/30 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Load {activeModal.platform.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Wallet to Game Credit Transfer
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* User Wallet Balance Snapshot */}
            <div className="bg-[#181922] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Available Wallet Balance:</span>
              <span className="font-mono font-black text-[#FFCC00] text-sm">
                ${Number(user?.wallet_balance || 0).toFixed(2)} USD
              </span>
            </div>

            {/* Informational Message */}
            <div className="p-3 bg-[#FFCC00]/10 border border-[#FFCC00]/25 rounded-2xl text-[11px] text-[#FFCC00] leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                {activeModal.platform.hasAccount ? (
                  <span>Credits will be loaded to your active game account: <strong>{activeModal.platform.game_username}</strong> upon admin approval.</span>
                ) : (
                  <span>Admin will create your new official game account, configure your username &amp; password, and load your credits. Your credentials will appear directly on your dashboard.</span>
                )}
              </div>
            </div>

            {modalNotice.text && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                modalNotice.isError
                  ? 'bg-red-950/40 border border-red-500/40 text-red-400'
                  : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-400'
              }`}>
                {modalNotice.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{modalNotice.text}</span>
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Load Amount (USD)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['10', '20', '50', '100'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountInput(val)}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition ${
                        amountInput === val
                          ? 'bg-[#FFCC00] text-slate-950 font-black shadow-sm'
                          : 'bg-[#181922] text-slate-300 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="Enter custom amount"
                    className="w-full bg-[#181922] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <span>Submit Game Load Request (${amountInput || '0'})</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Chat & Freeplay Modals */}
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />
      <FreeplayModal
        isOpen={isFreeplayOpen}
        onClose={() => setIsFreeplayOpen(false)}
        user={user}
        onClaimed={refreshUserData}
      />
      <PromotionalModal />
    </div>
  );
}
