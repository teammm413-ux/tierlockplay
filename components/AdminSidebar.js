'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  Gamepad2,
  Users,
  ShieldAlert,
  MessageSquare,
  Megaphone,
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [stats, setStats] = useState({ pendingDeposits: 0, pendingWithdrawals: 0, unreadChat: 0 });

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success && data.stats) {
          setStats({
            pendingDeposits: data.stats.pendingDepositsCount || 0,
            pendingWithdrawals: data.stats.pendingWithdrawalsCount || 0,
            unreadChat: data.stats.unreadChatMessages || 0,
          });
        }
      } catch (err) {
        // ignore
      }
    };
    fetchCounters();
    const interval = setInterval(fetchCounters, 15000);
    return () => clearInterval(interval);
  }, []);

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
    { label: 'Wallet Deposits', href: '/admin/deposits', icon: ArrowDownLeft, badge: stats.pendingDeposits, badgeColor: 'bg-amber-500 text-white' },
    { label: 'Wallet Withdrawals', href: '/admin/withdrawals', icon: ArrowUpRight, badge: stats.pendingWithdrawals, badgeColor: 'bg-emerald-600 text-white' },
    { label: 'Game Platforms', href: '/admin/games', icon: Gamepad2 },
    { label: 'Game Transactions', href: '/admin/game-transactions', icon: Gamepad2 },
    { label: 'Player Management', href: '/admin/users', icon: Users },
    { label: 'Admin Accounts', href: '/admin/admins', icon: ShieldCheck },
    { label: 'WhatsApp Chat Desk', href: '/admin/chat', icon: MessageSquare, badge: stats.unreadChat, badgeColor: 'bg-red-500 text-white' },
    { label: 'Promo Campaigns', href: '/admin/promotions', icon: Megaphone },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-screen p-4 flex flex-col justify-between shadow-xs select-none">
      <div>
        {/* Brand Logo with Admin Badge */}
        <div className="mb-5 px-2 flex items-center justify-between">
          <Logo size="small" href="/admin" theme="light" />
        </div>
        <div className="mb-4 px-2">
          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
            ADMIN MANAGEMENT PORTAL
          </span>
        </div>

        {/* Navigation Items in Clean Light Styling */}
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
                    ? 'bg-amber-50 text-amber-900 border border-amber-200/90 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 ? (
                  <span className={`${item.badgeColor} font-black text-[10px] px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-xs`}>
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sign Out */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin Portal</span>
        </button>
      </div>
    </aside>
  );
}
