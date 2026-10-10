'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Wallet,
  LogOut,
  Bell,
  MessageCircle,
  Globe,
  CheckCircle2,
  X
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

        {/* WhatsApp Chat Desk Trigger */}
        <button
          onClick={handleOpenChat}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25d366]/15 text-[#25d366] hover:bg-[#25d366]/25 border border-[#25d366]/40 text-xs font-bold transition shadow-xs"
          title="WhatsApp Live Support"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Support</span>
          {unreadChatCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </button>

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
