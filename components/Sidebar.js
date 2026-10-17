'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  CreditCard,
  Banknote,
  Gamepad2,
  FileText,
  ArrowUpRight,
  Boxes,
  Dice5,
  Settings,
  ChevronRight,
  X,
  CirclePlus,
  CircleMinus,
  Receipt,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-close drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Listen to toggle event from PlayerHeader
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    const handleClose = () => setIsMobileOpen(false);

    window.addEventListener('toggle-player-sidebar', handleToggle);
    window.addEventListener('close-player-sidebar', handleClose);

    return () => {
      window.removeEventListener('toggle-player-sidebar', handleToggle);
      window.removeEventListener('close-player-sidebar', handleClose);
    };
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/player/dashboard', icon: Home },
    { label: 'Deposit', href: '/player/wallet/deposit', icon: CreditCard },
    { label: 'Withdrawal', href: '/player/wallet/withdrawal', icon: Banknote },
    { label: 'Game Platforms', href: '/player/game-platforms', icon: Gamepad2 },
    { label: 'Promotions', href: '/player/promotions', icon: Sparkles, badge: 'HOT' },
    { label: 'Deposit Records', href: '/player/wallet/deposit-records', icon: FileText },
    { label: 'Withdrawal Records', href: '/player/wallet/withdrawal-records', icon: ArrowUpRight },
    { label: 'Game Deposit Records', href: '/player/game-platforms/deposit-records', icon: Boxes },
    { label: 'Game Withdrawal Records', href: '/player/game-platforms/withdrawal-records', icon: Dice5 },
    { label: 'Settings', href: '/player/settings', icon: Settings },
  ];

  const mobileBottomNavItems = [
    {
      label: 'Home',
      href: '/player/dashboard',
      icon: Home,
      isActive: (path) => path === '/player/dashboard' || path === '/player'
    },
    {
      label: 'Deposit',
      href: '/player/wallet/deposit',
      icon: CirclePlus,
      isActive: (path) => path.startsWith('/player/wallet/deposit') && !path.includes('records')
    },
    {
      label: 'Withdrawal',
      href: '/player/wallet/withdrawal',
      icon: CircleMinus,
      isActive: (path) => path.startsWith('/player/wallet/withdrawal') && !path.includes('records')
    },
    {
      label: 'Transactions',
      href: '/player/wallet/deposit-records',
      icon: Receipt,
      isActive: (path) => path.includes('records')
    },
    {
      label: 'Settings',
      href: '/player/settings',
      icon: Settings,
      isActive: (path) => path.startsWith('/player/settings')
    },
  ];

  return (
    <>
      {/* 1. Desktop Sidebar (Fixed full-height 100vh on lg screens) */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between bg-[#0a0b10] border-r border-white/10 h-screen fixed left-0 top-0 bottom-0 text-slate-300 select-none z-30 shadow-2xl">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Brand Header */}
          <div className="p-4 border-b border-white/10 flex items-center shrink-0">
            <Link href="/player/dashboard" className="flex items-center justify-center group">
              <img
                src="/images/logo.png"
                alt="TierlockPlay"
                className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,204,0,0.15)] group-hover:scale-105 transition-transform"
              />
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${isActive
                      ? 'bg-[#FFCC00] text-slate-950 font-bold shadow-lg shadow-yellow-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && !isActive && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FFCC00]/15 text-[#FFCC00] border border-[#FFCC00]/30 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-950" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-white/10 bg-[#06070a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFCC00]/20 border border-[#FFCC00]/40 text-[#FFCC00] font-black text-sm flex items-center justify-center shrink-0">
              {user?.username ? user.username[0].toUpperCase() : 'P'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">
                {user?.username || 'alex'}
              </div>
              <div className="mt-0.5">
                <span className="text-[10px] font-semibold bg-[#FFCC00]/15 text-[#FFCC00] px-2 py-0.5 rounded-full border border-[#FFCC00]/30">
                  {user?.account_status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop spacer to preserve layout flow and prevent content overlap */}
      <div className="w-64 shrink-0 hidden lg:block pointer-events-none" aria-hidden="true" />

      {/* 2. Mobile Responsive Drawer (< lg screens) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Sliding Drawer Content */}
          <aside className="relative w-72 max-w-[85vw] bg-[#0a0b10] border-r border-white/10 h-full flex flex-col justify-between text-slate-300 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Header with Close X */}
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                <Link href="/player/dashboard" onClick={() => setIsMobileOpen(false)}>
                  <img
                    src="/images/logo.png"
                    alt="TierlockPlay"
                    className="h-9 w-auto object-contain"
                  />
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav Links */}
              <nav className="p-3 space-y-1 mt-2 overflow-y-auto max-h-[calc(100vh-170px)]">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${isActive
                          ? 'bg-[#FFCC00] text-slate-950 font-bold shadow-lg shadow-yellow-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && !isActive && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FFCC00]/15 text-[#FFCC00] border border-[#FFCC00]/30 animate-pulse">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-950" />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Bottom Profile */}
            <div className="p-4 border-t border-white/10 bg-[#06070a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFCC00]/20 border border-[#FFCC00]/40 text-[#FFCC00] font-black text-sm flex items-center justify-center shrink-0">
                  {user?.username ? user.username[0].toUpperCase() : 'P'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.username || 'alex'}
                  </div>
                  <div className="mt-0.5">
                    <span className="text-[10px] font-semibold bg-[#FFCC00]/15 text-[#FFCC00] px-2 py-0.5 rounded-full border border-[#FFCC00]/30">
                      {user?.account_status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Mobile Bottom Navigation Bar (< lg screens as per sample site) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0c0d14]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] select-none pb-[env(safe-area-inset-bottom,0px)]">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1 items-center">
          {mobileBottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 transition-all group relative ${
                  active ? 'text-[#FFCC00]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#FFCC00] rounded-full shadow-[0_0_10px_#FFCC00]"></span>
                )}
                <div
                  className={`p-1 rounded-xl transition transform ${
                    active ? 'bg-[#FFCC00]/15 scale-110' : 'group-hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-[#FFCC00]' : 'text-slate-400 group-hover:text-white'}`} />
                </div>
                <span className={`text-[10px] font-bold tracking-tight mt-0.5 ${active ? 'text-[#FFCC00] font-black' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
