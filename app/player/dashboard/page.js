'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PlayerHeader from '@/components/PlayerHeader';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import {
  Wallet,
  User as UserIcon,
  CheckCircle2,
  Gamepad2,
  Gift,
  Languages,
  Share2,
  Copy,
  Check
} from 'lucide-react';

export default function PlayerDashboard() {
  const [user, setUser] = useState(null);
  const [platformCount, setPlatformCount] = useState(12);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFreeplayOpen, setIsFreeplayOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (err) {}
  };

  useEffect(() => {
    refreshUserData();

    fetch('/api/games/platforms')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.platforms) {
          setPlatformCount(d.platforms.length);
        }
      })
      .catch(() => {});
  }, []);

  const balance = Number(user?.wallet_balance || 0).toFixed(2);
  const username = user?.username || 'alex';
  const lastLoginTime = user?.last_login_time || '2026-10-01 11:10:22';
  const lastLoginIp = user?.last_login_ip || '182.190.183.135';
  const lastLoginDevice = user?.last_login_device || 'macos';
  const accountStatus = user?.account_status || 'Active';
  const userInviteCode = user?.invite_code || 'VIP777';

  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/sign-up?ref=${userInviteCode}`
    : `https://app.tierlockplay.com/sign-up?ref=${userInviteCode}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
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
          showLoginToast={true}
        />

        {/* Content Area */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-6">
          {/* Welcome Card */}
          <div className="bg-[#101117] rounded-3xl p-6 sm:p-8 shadow-sm border border-white/10">
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

          {/* 4 Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Wallet Balance */}
            <div className="bg-[#101117] rounded-3xl p-6 border border-[#FFCC00]/30 hover:border-[#FFCC00] transition shadow-[0_0_25px_rgba(255,204,0,0.06)]">
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

            {/* Card 4: Platforms */}
            <div className="bg-[#101117] rounded-3xl p-6 border border-white/10 hover:border-[#FFCC00]/40 transition">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <span className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-3.5 h-3.5" />
                </span>
                <span>Platforms</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-3 font-mono">
                {platformCount}
              </div>
            </div>
          </div>

          {/* VIP Referral & Invite Program Card */}
          <div className="bg-[#101117] rounded-3xl p-6 sm:p-8 border border-[#FFCC00]/25 shadow-[0_0_30px_rgba(255,204,0,0.05)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Your VIP Referral & Invite Link
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
              <div className="flex-1 w-full truncate font-mono text-xs text-slate-300 bg-[#07080b] border border-white/10 rounded-xl px-3.5 py-2.5 select-all">
                {referralUrl}
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

      {/* Freeplay Bonus Claim Modal */}
      <FreeplayModal
        isOpen={isFreeplayOpen}
        onClose={() => setIsFreeplayOpen(false)}
        user={user}
        onClaimed={refreshUserData}
      />
    </div>
  );
}
