'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PlayerHeader from '@/components/PlayerHeader';
import WhatsAppChat from '@/components/WhatsAppChat';
import PromotionalModal from '@/components/PromotionalModal';
import ChromeNotificationPrompt from '@/components/ChromeNotificationPrompt';
import {
  Wallet,
  User as UserIcon,
  CheckCircle2,
  Gamepad2,
  Languages,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Eye,
  EyeOff,
  Download,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function PlayerDashboard() {
  const [user, setUser] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralUrl, setReferralUrl] = useState('');

  // Credentials visibility & copy states
  const [showPasswords, setShowPasswords] = useState({});
  const [copiedItem, setCopiedItem] = useState(null);

  // Quick Load Credits modal right from dashboard (Requirement 17)
  const [loadModalPlatform, setLoadModalPlatform] = useState(null);
  const [amountInput, setAmountInput] = useState('20');
  const [isSubmittingLoad, setIsSubmittingLoad] = useState(false);
  const [loadNotice, setLoadNotice] = useState({ text: '', isError: false });

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (err) {}
  };

  const loadPlatformsData = async () => {
    try {
      const res = await fetch('/api/games/platforms');
      const data = await res.json();
      if (data.success && data.platforms) {
        setPlatforms(data.platforms);
      }
    } catch (err) {}
  };

  const [activePromo, setActivePromo] = useState(null);

  useEffect(() => {
    refreshUserData();
    loadPlatformsData();
    const interval = setInterval(loadPlatformsData, 4000);

    fetch('/api/promotions/latest')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.promo) setActivePromo(d.promo);
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  const [currentDevice, setCurrentDevice] = useState('This Device');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      let dName = 'Web Browser';
      if (ua.includes('iphone')) dName = 'iPhone (iOS)';
      else if (ua.includes('ipad')) dName = 'iPad (iPadOS)';
      else if (ua.includes('android')) {
        const match = window.navigator.userAgent.match(/Android[^;]+;\s*([^;)]+)/);
        let model = match && match[1] ? match[1].trim() : '';
        if (model.includes('Build/')) model = model.split('Build/')[0].trim();
        dName = model && !model.toLowerCase().includes('k') ? `Android (${model})` : 'Android Mobile';
      } else if (ua.includes('macintosh') || ua.includes('mac os x')) dName = 'macOS (Desktop)';
      else if (ua.includes('windows')) dName = 'Windows (PC)';
      setCurrentDevice(dName);
    }
  }, []);

  const balance = Number(user?.wallet_balance || 0).toFixed(2);
  const username = user?.username || 'alex';
  const lastLoginTime = user?.last_login_time || new Date().toISOString().replace('T', ' ').substring(0, 19);
  const lastLoginIp = user?.last_login_ip || '127.0.0.1';
  const lastLoginDevice = (user?.last_login_device && user.last_login_device.toLowerCase() !== 'macos')
    ? user.last_login_device
    : currentDevice;
  const accountStatus = user?.account_status || 'Active';
  const userInviteCode = user?.invite_code || 'VIP777';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReferralUrl(`${window.location.origin}/sign-up?ref=${userInviteCode}`);
    }
  }, [userInviteCode]);

  const handleCopyLink = () => {
    const linkToCopy = referralUrl || (typeof window !== 'undefined' ? `${window.location.origin}/sign-up?ref=${userInviteCode}` : '');
    if (typeof navigator !== 'undefined' && navigator.clipboard && linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
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

  const handleOpenLoadModal = (platform) => {
    setLoadModalPlatform(platform);
    setAmountInput('20');
    setLoadNotice({ text: '', isError: false });
  };

  const handleCloseLoadModal = () => {
    setLoadModalPlatform(null);
    setLoadNotice({ text: '', isError: false });
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0) {
      setLoadNotice({ text: 'Enter a valid transfer amount', isError: true });
      return;
    }

    if (!user || user.wallet_balance < amt) {
      setLoadNotice({
        text: `Insufficient wallet balance ($${Number(user?.wallet_balance || 0).toFixed(2)}). Please deposit to wallet first.`,
        isError: true,
      });
      return;
    }

    setIsSubmittingLoad(true);
    setLoadNotice({ text: '', isError: false });

    try {
      const res = await fetch('/api/games/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: loadModalPlatform.name,
          amount: amt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLoadNotice({ text: data.message, isError: false });
        refreshUserData();
        loadPlatformsData();
        setTimeout(handleCloseLoadModal, 2000);
      } else {
        setLoadNotice({ text: data.message || 'Transfer failed', isError: true });
      }
    } catch (err) {
      setLoadNotice({ text: 'Connection error submitting load request', isError: true });
    } finally {
      setIsSubmittingLoad(false);
    }
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
          showLoginToast={true}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto flex flex-col space-y-6">
          {/* Mobile-Only Top Wallet Balance Card */}
          <div className="order-1 sm:hidden bg-[#101117] rounded-3xl p-6 border border-[#FFCC00]/30 shadow-[0_0_25px_rgba(255,204,0,0.06)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <span className="w-6 h-6 rounded-lg bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center shrink-0">
                  <Wallet className="w-3.5 h-3.5" />
                </span>
                <span>Wallet Balance</span>
              </div>
              <Link
                href="/player/wallet/deposit"
                className="text-[11px] font-black uppercase text-slate-950 bg-[#FFCC00] hover:bg-yellow-300 px-3 py-1 rounded-lg transition"
              >
                + Deposit
              </Link>
            </div>
            <div className="text-3xl font-black text-[#FFCC00] mt-3 font-mono drop-shadow-[0_0_10px_rgba(255,204,0,0.3)]">
              ${balance}
            </div>
          </div>

          {/* Welcome Card - On Desktop: top (sm:order-1), On Mobile: below game accounts & stats (order-4) */}
          <div className="order-4 sm:order-1 bg-[#101117] rounded-3xl p-6 sm:p-8 shadow-sm border border-white/10">
            <h1 className="text-xl sm:text-2xl font-black text-white mb-6 uppercase tracking-tight">
              Welcome back, <span className="text-[#FFCC00]">{username}</span>!
            </h1>

            {/* Inner Details Container */}
            <div className="bg-[#181922] rounded-2xl p-6 border border-white/5 divide-y divide-white/10">
              <div className="flex items-center justify-between py-3 first:pt-0">
                <span className="text-xs sm:text-sm text-slate-400 font-medium">Last Login Time</span>
                <span className="text-xs sm:text-sm text-slate-200 font-bold font-mono">{lastLoginTime}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs sm:text-sm text-slate-400 font-medium">Last Login IP</span>
                <span className="text-xs sm:text-sm text-slate-200 font-bold font-mono">{lastLoginIp}</span>
              </div>
              <div className="flex items-center justify-between py-3 last:pb-0">
                <span className="text-xs sm:text-sm text-slate-400 font-medium">Device</span>
                <span className="text-xs sm:text-sm text-slate-200 font-bold">{lastLoginDevice}</span>
              </div>
            </div>
          </div>

          {/* Stat Cards Grid - On Desktop: sm:order-2 (all 4 in row), On Mobile: order-3 (Username, Status, Accounts below Game Accounts) */}
          <div className="order-3 sm:order-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Wallet Balance (Desktop only, mobile has it pinned at order-1) */}
            <div className="hidden sm:block bg-[#101117] rounded-3xl p-6 border border-[#FFCC00]/30 hover:border-[#FFCC00] transition shadow-[0_0_25px_rgba(255,204,0,0.06)]">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <span className="w-6 h-6 rounded-lg bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center shrink-0">
                  <Wallet className="w-3.5 h-3.5" />
                </span>
                <span>Wallet Balance</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#FFCC00] mt-3 font-mono drop-shadow-[0_0_10px_rgba(255,204,0,0.3)]">
                ${balance}
              </div>
            </div>

            {/* Card 2: Username */}
            <div className="bg-[#101117] rounded-3xl p-6 border border-white/10 hover:border-[#FFCC00]/40 transition">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </span>
                <span>Username</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-3 truncate">
                {username}
              </div>
            </div>

            {/* Card 3: Account Status */}
            <div className="bg-[#101117] rounded-3xl p-6 border border-white/10 hover:border-[#FFCC00]/40 transition">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <span>Account Status</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-3">
                {accountStatus}
              </div>
            </div>

            {/* Card 4: Active Game Accounts */}
            <div className="bg-[#101117] rounded-3xl p-6 border border-white/10 hover:border-[#FFCC00]/40 transition">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <span className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-3.5 h-3.5" />
                </span>
                <span>Active Game Accounts</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-3 font-mono flex items-baseline gap-2">
                <span>{activeAccounts.length}</span>
                <span className="text-xs text-slate-400 font-normal">/ {platforms.length || 12} Total</span>
              </div>
            </div>
          </div>

          {/* REQUIREMENT 17: MY CREATED GAME ACCOUNTS & CREDENTIALS ON DASHBOARD - On Mobile: order-2 (MOVED UP), On Desktop: sm:order-3 */}
          <div className="order-2 sm:order-3 bg-[#101117] rounded-3xl p-6 sm:p-8 border border-[#FFCC00]/30 shadow-[0_0_40px_rgba(255,204,0,0.06)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center shrink-0 border border-[#FFCC00]/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                    My Game Accounts &amp; Credentials
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your approved sweepstakes game logins. Load credits directly or download the game apps.
                  </p>
                </div>
              </div>

              <Link
                href="/player/game-platforms"
                className="text-xs font-bold text-slate-950 bg-[#FFCC00] hover:bg-yellow-300 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                <span>Browse All Platforms</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {activeAccounts.length === 0 ? (
              <div className="bg-[#181922] border border-white/5 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 mx-auto flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-[#FFCC00]" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase">
                  No Game Accounts Registered Yet
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Request in-game accounts for popular sweepstakes platforms like Juwa, Fire Kirin, Game Vault &amp; Orion Stars. Once created by admin, your credentials and direct load buttons will appear right here.
                </p>
                <div className="pt-2">
                  <Link
                    href="/player/game-platforms"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md"
                  >
                    <span>Create Your First Game Account</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeAccounts.map((p) => {
                  const isVisible = showPasswords[p.id];
                  return (
                    <div
                      key={p.id}
                      className="bg-[#181922] border border-white/10 hover:border-[#FFCC00]/40 rounded-2xl p-5 space-y-4 transition-all shadow-sm"
                    >
                      {/* Platform Header */}
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
                          <h3 className="font-bold text-white text-base truncate">{p.name}</h3>
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block mt-0.5">
                            Account Ready
                          </span>
                        </div>
                      </div>

                      {/* Credentials Box */}
                      <div className="bg-[#0e0f15] border border-white/5 rounded-xl p-3.5 space-y-2.5 text-xs">
                        {/* Username */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Username:</span>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-[#FFCC00]">
                            <span>{p.game_username}</span>
                            <button
                              onClick={() => copyToClipboard(p.game_username, `${p.id}-user`)}
                              className="text-slate-400 hover:text-white p-1 rounded-md transition"
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
                              className="text-slate-400 hover:text-white p-1 rounded-md transition"
                              title={isVisible ? 'Hide Password' : 'Show Password'}
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(p.game_password, `${p.id}-pass`)}
                              className="text-slate-400 hover:text-white p-1 rounded-md transition"
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

                      {/* Requirement 17: Load credits button inside the account card + Download App */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleOpenLoadModal(p)}
                          className="flex-1 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-98 uppercase tracking-wide"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Load Credits</span>
                        </button>
                        <a
                          href={p.download_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shrink-0 border border-white/10 hover:border-white/30"
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
            )}
          </div>

          {/* Active Promo Announcement Banner (if admin has published a promo) */}
          {activePromo && (
            <div className="order-5 sm:order-4 bg-gradient-to-r from-[#FFCC00]/15 via-[#181922] to-[#101117] border border-[#FFCC00]/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_35px_rgba(255,204,0,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FFCC00]/20 text-[#FFCC00] flex items-center justify-center shrink-0 border border-[#FFCC00]/30 shadow-[0_0_20px_rgba(255,204,0,0.2)]">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Promotion
                    </span>
                    {activePromo.promoCode && (
                      <span className="text-[11px] font-mono font-black text-[#FFCC00] bg-[#FFCC00]/15 px-2.5 py-0.5 rounded-lg border border-[#FFCC00]/30">
                        Code: {activePromo.promoCode}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-white mt-1 leading-snug">
                    {activePromo.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                    {activePromo.message}
                  </p>
                </div>
              </div>

              <Link
                href="/player/promotions"
                className="px-5 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 shadow-md"
              >
                <span>View Promotion</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* VIP Referral & Invite Program Card - On Mobile: order-6, On Desktop: sm:order-5 */}
          <div className="order-6 sm:order-5 bg-[#101117] rounded-3xl p-6 sm:p-8 border border-[#FFCC00]/25 shadow-[0_0_30px_rgba(255,204,0,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Your VIP Referral &amp; Invite Link
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Share this link with your players. Anyone who clicks will open sign-up directly with your sponsor code verified!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-400 font-medium">Your Code:</span>
                <span className="px-3.5 py-1.5 bg-[#FFCC00]/15 border border-[#FFCC00]/40 text-[#FFCC00] font-mono font-black rounded-xl text-xs uppercase tracking-wider">
                  {userInviteCode}
                </span>
              </div>
            </div>

            {/* Direct Referral URL Bar */}
            <div className="bg-[#181922] border border-white/10 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center gap-2.5">
              <div
                suppressHydrationWarning
                className="flex-1 w-full truncate font-mono text-xs text-slate-300 bg-[#07080b] border border-white/10 rounded-xl px-3.5 py-2.5 select-all"
              >
                {referralUrl || `https://tierlockplay.com/sign-up?ref=${userInviteCode}`}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-[0_2px_12px_rgba(255,204,0,0.3)] shrink-0 uppercase tracking-wide"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-slate-950" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* QUICK LOAD CREDITS MODAL FROM DASHBOARD */}
      {loadModalPlatform && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101117] border border-[#FFCC00]/30 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Load {loadModalPlatform.name} Credits
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Instant transfer from your Tierlock wallet
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseLoadModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadNotice.text && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  loadNotice.isError
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                }`}
              >
                {loadNotice.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{loadNotice.text}</span>
              </div>
            )}

            <div className="bg-[#181922] p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Available Balance:</span>
                <span className="font-mono font-bold text-[#FFCC00]">
                  ${Number(user?.wallet_balance || 0).toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">In-Game Username:</span>
                <span className="font-mono font-bold text-white">
                  {loadModalPlatform.game_username || 'Active Account'}
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
                disabled={isSubmittingLoad || !amountInput || parseFloat(amountInput) <= 0}
                className="w-full py-3.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 disabled:opacity-50"
              >
                {isSubmittingLoad ? (
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

      {/* Floating Translation Widget on Right Edge */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-30">
        <button
          className="w-8 h-8 rounded-full bg-[#181922] hover:bg-[#FFCC00] text-slate-300 hover:text-slate-950 border border-white/10 hover:border-[#FFCC00] flex items-center justify-center shadow-lg transition"
          title="Change Language"
        >
          <Languages className="w-4 h-4" />
        </button>
      </div>

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
