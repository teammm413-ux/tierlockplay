'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Wallet,
  LogOut,
  Bell,
  MessageCircle,
  Globe,
  CheckCircle2,
  X,
  ShieldCheck,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function PlayerHeader({ user, onToggleSidebar, onOpenChat, showLoginToast = false }) {
  const router = useRouter();
  const [toastVisible, setToastVisible] = useState(showLoginToast);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    // Check unread messages from admin
    const checkUnread = async () => {
      try {
        const res = await fetch('/api/chat/unread');
        const data = await res.json();
        if (data.success && data.unreadCount > 0) {
          setUnreadChatCount(data.unreadCount);
        }
      } catch (err) {}
    };
    checkUnread();
    const interval = setInterval(checkUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/sign-in');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSidebar = () => {
    if (onToggleSidebar) onToggleSidebar();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggle-player-sidebar'));
    }
  };

  const handleOpenChat = () => {
    if (onOpenChat) onOpenChat();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-chat-support'));
    }
  };

  const balance = Number(user?.wallet_balance || 0).toFixed(2);

  return (
    <header className="h-14 bg-[#0a0b10] border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-30 select-none">
      {/* Left: Sidebar Toggle + Balance Chip */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggleSidebar}
          className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Balance Chip: Gold container with wallet icon and balance */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FFCC00]/10 border border-[#FFCC00]/30 text-[#FFCC00] font-mono font-bold text-xs shadow-[0_0_15px_rgba(255,204,0,0.1)]">
          <Wallet className="w-3.5 h-3.5" />
          <span>${balance}</span>
        </div>
      </div>

      {/* Right: Toast or Action Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Optional Login Successful toast */}
        {toastVisible && (
          <div className="hidden sm:flex items-center gap-2 bg-[#15803d] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Login successful!</span>
            <button
              onClick={() => setToastVisible(false)}
              className="ml-1 hover:opacity-80"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Promotions Tab Button */}
        <Link
          href="/player/promotions"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#FFCC00]/40 bg-[#FFCC00]/10 hover:bg-[#FFCC00]/20 text-[#FFCC00] text-xs font-bold transition shadow-xs"
          title="Active Promotions & Bonuses"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FFCC00] animate-pulse shrink-0" />
          <span>Promos</span>
        </Link>

        {/* KYC Verification Button (Replaces Support button as requested) */}
        <Link
          href="/player/settings"
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-xs ${
            user?.kyc_status === 'VERIFIED'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
              : user?.kyc_status === 'PENDING'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
              : user?.kyc_status === 'REJECTED'
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
              : 'bg-[#FFCC00]/15 text-[#FFCC00] border-[#FFCC00]/40 hover:bg-[#FFCC00]/25'
          }`}
          title="KYC Account Verification"
        >
          {user?.kyc_status === 'VERIFIED' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : user?.kyc_status === 'PENDING' ? (
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : user?.kyc_status === 'REJECTED' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFCC00] shrink-0" />
          )}
          <span>
            {user?.kyc_status === 'VERIFIED'
              ? 'KYC Verified'
              : user?.kyc_status === 'PENDING'
              ? 'KYC Pending'
              : user?.kyc_status === 'REJECTED'
              ? 'KYC Rejected'
              : 'KYC'}
          </span>
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition px-2 py-1 rounded-lg hover:bg-white/5"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
