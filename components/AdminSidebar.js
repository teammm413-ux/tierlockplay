'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import { playNotificationSound } from '@/lib/sound';
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  Gamepad2,
  Users,
  MessageSquare,
  Megaphone,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const prevTotalRef = useRef(null);
  const [stats, setStats] = useState({
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingGameTransactions: 0,
    unreadChat: 0,
  });

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success && data.stats) {
          const deposits = data.stats.pendingDepositsCount || 0;
          const withdrawals = data.stats.pendingWithdrawalsCount || 0;
          const games = data.stats.pendingGameTransactionsCount || 0;
          const chat = data.stats.unreadChatMessages || 0;
          const currentTotal = deposits + withdrawals + games + chat;

          // Play crisp casino alert sound whenever a new request or message arrives
          if (prevTotalRef.current !== null && currentTotal > prevTotalRef.current) {
            playNotificationSound('admin_request');
          }
          prevTotalRef.current = currentTotal;

          setStats({
            pendingDeposits: deposits,
            pendingWithdrawals: withdrawals,
            pendingGameTransactions: games,
            unreadChat: chat,
          });
        }
      } catch (err) {
        // silent fail
      }
    };

    fetchCounters();
    // Fast real-time polling every 4 seconds so badges and alerts update live
    const interval = setInterval(fetchCounters, 4000);
    return () => clearInterval(interval);
  }, []);

  // Close drawer on path change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    {
      label: 'Wallet Deposits',
      href: '/admin/deposits',
      icon: ArrowDownLeft,
      badge: stats.pendingDeposits,
      badgeColor: 'bg-[#FFCC00] text-slate-950 shadow-[0_0_12px_rgba(255,204,0,0.5)]',
    },
    {
      label: 'Wallet Withdrawals',
      href: '/admin/withdrawals',
      icon: ArrowUpRight,
      badge: stats.pendingWithdrawals,
      badgeColor: 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    },
    {
      label: 'Game Transactions',
      href: '/admin/game-transactions',
      icon: Gamepad2,
      badge: stats.pendingGameTransactions,
      badgeColor: 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
    },
    { label: 'Game Platforms', href: '/admin/games', icon: Gamepad2 },
    { label: 'Player Management', href: '/admin/users', icon: Users },
    { label: 'Admin Accounts', href: '/admin/admins', icon: ShieldCheck },
    {
      label: 'WhatsApp Chat Desk',
      href: '/admin/chat',
      icon: MessageSquare,
      badge: stats.unreadChat,
      badgeColor: 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    },
    { label: 'Promo Campaigns', href: '/admin/promotions', icon: Megaphone },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full select-none">
      <div>
        {/* Brand Logo with Tierlock luxury style */}
        <div className="mb-4 px-2 flex items-center justify-between">
          <Logo size="small" href="/admin" theme="dark" />
          {mobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mb-4 px-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/25 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00] animate-ping"></span>
            <span>ADMIN CONTROL CENTER</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#FFCC00] text-slate-950 font-black shadow-[0_4px_20px_rgba(255,204,0,0.25)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge > 0 ? (
                  <span
                    className={`${item.badgeColor} font-black text-[10px] px-2 py-0.5 rounded-full min-w-[22px] text-center shrink-0`}
                  >
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sign Out */}
      <div className="pt-4 border-t border-white/10 mt-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Exit Admin Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Toggle Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0c0d12]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#FFCC00] hover:bg-white/10"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size="small" href="/admin" theme="dark" />
        </div>

        <div className="flex items-center gap-2">
          {stats.pendingDeposits + stats.pendingWithdrawals + stats.pendingGameTransactions > 0 && (
            <span className="bg-[#FFCC00] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
              {stats.pendingDeposits + stats.pendingWithdrawals + stats.pendingGameTransactions} Pending
            </span>
          )}
          {stats.unreadChat > 0 && (
            <Link
              href="/admin/chat"
              className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{stats.unreadChat}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#0c0d12] border-r border-white/10 min-h-screen p-4 flex-col justify-between shadow-2xl">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#0c0d12] border-r border-white/10 p-5 h-full overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
