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
    { label: 'Wallet Deposits', href: '/admin/deposits', icon: ArrowDownLeft, badge: stats.pendingDeposits, badgeColor: 'bg-amber-500' },
    { label: 'Wallet Withdrawals', href: '/admin/withdrawals', icon: ArrowUpRight, badge: stats.pendingWithdrawals, badgeColor: 'bg-emerald-500' },
    { label: 'Game Platforms', href: '/admin/games', icon: Gamepad2 },
    { label: 'Game Transactions', href: '/admin/game-transactions', icon: Gamepad2 },
    { label: 'Player Management', href: '/admin/users', icon: Users },
    { label: 'Admin Accounts', href: '/admin/admins', icon: ShieldCheck },
    { label: 'WhatsApp Chat Desk', href: '/admin/chat', icon: MessageSquare, badge: stats.unreadChat, badgeColor: 'bg-red-500' },
    { label: 'Promo Campaigns', href: '/admin/promotions', icon: Megaphone },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#080c14] border-r border-[#1a2335] min-h-screen p-4 flex flex-col justify-between">
      <div>
        {/* Brand Logo with Admin Badge */}
        <div className="mb-6 px-2 flex items-center justify-between">
          <Logo size="small" href="/admin" />
        </div>
        <div className="mb-4 px-2">
          <span className="text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded">
            SUPERADMIN PANEL
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 ? (
                  <span className={`${item.badgeColor} text-black font-black text-[10px] px-1.5 py-0.2 rounded-full min-w-[18px] text-center`}>
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sign Out */}
      <div className="pt-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Admin Portal</span>
        </button>
      </div>
    </aside>
  );
}
