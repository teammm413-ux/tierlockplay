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
  Languages
} from 'lucide-react';

export default function PlayerDashboard() {
  const [user, setUser] = useState(null);
  const [platformCount, setPlatformCount] = useState(12);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFreeplayOpen, setIsFreeplayOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 flex">
      {/* Left Sidebar matching Screenshot image copy 3 */}
      <Sidebar user={user} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header matching Screenshot */}
        <PlayerHeader
          user={user}
          onOpenChat={() => setIsChatOpen(true)}
          showLoginToast={true}
        />

        {/* Content Area */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-6">
          {/* Welcome Card matching Screenshot image copy 3 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
              Welcome back, {username}!
            </h1>

            {/* Inner Details Container */}
            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-100 divide-y divide-slate-200/70">
              <div className="flex items-center justify-between py-3 first:pt-0">
                <span className="text-xs sm:text-sm text-slate-500 font-medium">Last Login Time</span>
                <span className="text-xs sm:text-sm text-slate-900 font-bold font-mono">{lastLoginTime}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs sm:text-sm text-slate-500 font-medium">Last Login IP</span>
                <span className="text-xs sm:text-sm text-slate-900 font-bold font-mono">{lastLoginIp}</span>
              </div>
              <div className="flex items-center justify-between py-3 last:pb-0">
                <span className="text-xs sm:text-sm text-slate-500 font-medium">Device</span>
                <span className="text-xs sm:text-sm text-slate-900 font-bold">{lastLoginDevice}</span>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards Grid matching Screenshot image copy 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Wallet Balance */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-3.5 h-3.5" />
                </span>
                <span>Wallet Balance</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 font-mono">
                ${balance}
              </div>
            </div>

            {/* Card 2: Username */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <UserIcon className="w-3.5 h-3.5" />
                </span>
                <span>Username</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 truncate">
                {username}
              </div>
            </div>

            {/* Card 3: Account Status */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <span>Account Status</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
                {accountStatus}
              </div>
            </div>

            {/* Card 4: Platforms */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <span className="w-5 h-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-3.5 h-3.5" />
                </span>
                <span>Platforms</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 font-mono">
                {platformCount}
              </div>
            </div>
          </div>
        </main>
      </div>


      {/* Floating Translation Widget on Right Edge */}
      <div className="fixed right-2 top-1/2 -translate-y-1/2 z-30">
        <button
          className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition"
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
