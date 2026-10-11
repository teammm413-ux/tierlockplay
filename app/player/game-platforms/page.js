'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PlayerHeader from '@/components/PlayerHeader';
import WhatsAppChat from '@/components/WhatsAppChat';
import PromotionalModal from '@/components/PromotionalModal';
import ChromeNotificationPrompt from '@/components/ChromeNotificationPrompt';
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
  Loader2,
  UserPlus
} from 'lucide-react';

export default function GamePlatformsPage() {
  const [user, setUser] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [activePendingRequest, setActivePendingRequest] = useState(null);
  const [hasAnyPending, setHasAnyPending] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // { type: 'deposit' | 'createAccount', platform: obj }
  const [amountInput, setAmountInput] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalNotice, setModalNotice] = useState({ text: '', isError: false });
  const [isChatOpen, setIsChatOpen] = useState(false);
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
      if (data.success) {
        setPlatforms(data.platforms || []);
        setHasAnyPending(Boolean(data.hasAnyPendingRequest));
        setActivePendingRequest(data.activePendingRequest || null);
      }
    } catch (err) {}
  };

  useEffect(() => {
    refreshUserData();
    loadPlatforms();
    const interval = setInterval(loadPlatforms, 3500);
    return () => clearInterval(interval);
  }, []);

  const openDepositModal = (platform) => {
    if (platform.hasPendingRequest) {
      alert(`Your request for ${platform.name} (Order #${platform.pendingOrderNo}) is currently under review.`);
      return;
    }
    if (hasAnyPending) {
      alert(`Your request (${activePendingRequest?.platform_name} - ${activePendingRequest?.type || 'Deposit'}) is currently under review. You cannot submit another request until this request is approved or rejected by the admin.`);
      return;
    }
    setActiveModal({ type: 'deposit', platform });
    setAmountInput('20');
    setModalNotice({ text: '', isError: false });
  };

  const openCreateAccountModal = (platform) => {
    if (platform.hasPendingRequest) {
      alert(`Your registration request for ${platform.name} is currently under review.`);
      return;
    }
    if (hasAnyPending) {
      alert(`Your request (${activePendingRequest?.platform_name} - ${activePendingRequest?.type || 'Request'}) is currently under review. You cannot submit another request until it is processed.`);
      return;
    }
    setActiveModal({ type: 'createAccount', platform });
    setModalNotice({ text: '', isError: false });
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalNotice({ text: '', isError: false });
  };

  // Requirement 19: Submit account creation request
  const handleCreateAccountSubmit = async (e) => {
    e.preventDefault();
    if (!activeModal || !activeModal.platform) return;

    setIsSubmitting(true);
    setModalNotice({ text: '', isError: false });

    try {
      const res = await fetch('/api/games/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: activeModal.platform.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalNotice({ text: data.message, isError: false });
        loadPlatforms();
        setTimeout(closeModal, 2200);
      } else {
        setModalNotice({ text: data.message || 'Account creation request failed', isError: true });
      }
    } catch (err) {
      setModalNotice({ text: 'Connection error submitting account creation request', isError: true });
    } finally {
      setIsSubmitting(false);
    }
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
                Requesting game acc, view game cred and load credit direct from auto deposit feature.
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

          {/* ACTIVE PENDING REQUEST NOTICE BANNER */}
          {hasAnyPending && activePendingRequest && (
            <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/40 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-[0_0_30px_rgba(245,158,11,0.08)] animate-in fade-in duration-200">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Clock className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <div className="font-black text-sm text-white flex items-center gap-2">
                    <span>Active Request In Review: {activePendingRequest.platform_name}</span>
                    <span className="bg-[#FFCC00] text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {activePendingRequest.type === 'Register' ? 'Account Creation Pending' : 'Deposit Pending'}
                    </span>
                  </div>
                  <p className="text-amber-200/90 mt-1 leading-relaxed text-[11px]">
                    Order <strong>#{activePendingRequest.order_no}</strong> {activePendingRequest.amount > 0 ? `($${Number(activePendingRequest.amount).toFixed(2)})` : ''} is awaiting Admin processing. You cannot submit another request until this request has been processed.
                  </p>
                </div>
              </div>
              <Link
                href="/player/game-platforms/deposit-records"
                className="shrink-0 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold px-4 py-2 rounded-xl border border-amber-400/30 transition flex items-center gap-1.5 text-xs"
              >
                <span>View Status</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

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
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shrink-0 border border-white/10 hover:border-white/30"
                          title="Download App"
                        >
                          <Download className="w-3.5 h-3.5 text-[#FFCC00]" />
                          <span>App</span>
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
                          <span>{p.pendingType === 'Register' ? 'Registration Pending' : 'Load Pending'}</span>
                        </span>
                      ) : (
                        /* Requirement 18: Ready to Register */
                        <span className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          Ready to Register
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
                      title="Download App"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>App</span>
                    </a>

                    {p.hasPendingRequest ? (
                      <button
                        disabled
                        className="flex-1 py-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/35 font-bold text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90 shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>In Review {p.pendingAmount > 0 ? `($${p.pendingAmount})` : ''}</span>
                      </button>
                    ) : hasAnyPending ? (
                      <button
                        onClick={() => p.hasAccount ? openDepositModal(p) : openCreateAccountModal(p)}
                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10 font-bold text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="Another request is currently under review"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Queue Locked</span>
                      </button>
                    ) : p.hasAccount ? (
                      /* Requirement 19: When account created, show Load Credits */
                      <button
                        onClick={() => openDepositModal(p)}
                        className="flex-1 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wide rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Load Credits</span>
                      </button>
                    ) : (
                      /* Requirement 16 & 19: When NO account, show Create Account Only */
                      <button
                        onClick={() => openCreateAccountModal(p)}
                        className="flex-1 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wide rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create Account</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* CREATE ACCOUNT MODAL (Requirement 16, 19) */}
      {activeModal && activeModal.type === 'createAccount' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101117] border border-[#FFCC00]/30 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Create {activeModal.platform.name} Account
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Official sweepstakes player registration
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalNotice.text && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  modalNotice.isError
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
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

            <div className="bg-[#181922] p-4 rounded-2xl border border-white/5 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0">
                  <img
                    src={activeModal.platform.logo_url}
                    alt={activeModal.platform.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/images/games/juwa.jpg'; }}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{activeModal.platform.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    {activeModal.platform.category || 'Fish & Slots'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200/90 text-[11px] leading-relaxed">
                Management will verify your registration and generate your official in-game username &amp; password. Once created, your credentials will appear directly on your dashboard, allowing you to load credits.
              </div>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Confirm &amp; Create Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GAME DEPOSIT / LOAD MODAL (Requirement 19: Available after account created) */}
      {activeModal && activeModal.type === 'deposit' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101117] border border-[#FFCC00]/30 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Load {activeModal.platform.name} Credits
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Instant transfer from your Tierlock wallet
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalNotice.text && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  modalNotice.isError
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
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

            <div className="bg-[#181922] p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Available Wallet Balance:</span>
                <span className="font-mono font-bold text-[#FFCC00]">
                  ${Number(user?.wallet_balance || 0).toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">In-Game Username:</span>
                <span className="font-mono font-bold text-white">
                  {activeModal.platform.game_username || 'Active Account'}
                </span>
              </div>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Select Load Amount (USD)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {['10', '20', '50', '100'].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setAmountInput(preset)}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        amountInput === preset
                          ? 'bg-[#FFCC00] text-slate-950 border-[#FFCC00]'
                          : 'bg-[#181922] text-slate-300 border-white/10 hover:border-white/30'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="Enter custom amount"
                    className="w-full bg-[#181922] border border-white/10 text-white font-mono font-bold text-sm pl-8 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !amountInput || parseFloat(amountInput) <= 0}
                className="w-full py-3.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Submitting Load Request...</span>
                  </>
                ) : (
                  <span>Submit Game Load Request (${amountInput || '0'})</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Chat Drawer */}
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />

      {/* Chrome Push Notification Prompt (Requirement 21) */}
      <ChromeNotificationPrompt />

      {/* Admin Dispatched VIP Promotional Popup Modal */}
      <PromotionalModal />
    </div>
  );
}
