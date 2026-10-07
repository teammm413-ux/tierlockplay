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
  X
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
    { label: 'Deposit Records', href: '/player/wallet/deposit-records', icon: FileText },
    { label: 'Withdrawal Records', href: '/player/wallet/withdrawal-records', icon: ArrowUpRight },
    { label: 'Game Deposit Records', href: '/player/game-platforms/deposit-records', icon: Boxes },
    { label: 'Game Withdrawal Records', href: '/player/game-platforms/withdrawal-records', icon: Dice5 },
    { label: 'Settings', href: '/player/settings', icon: Settings },
  ];

  return (
    <>
      {/* 1. Desktop Sidebar (Permanent on lg screens) */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between bg-[#0b1728] border-r border-[#15233a] min-h-screen text-slate-300 select-none">
        <div>
          {/* Brand Header */}
          <div className="p-5 flex items-center gap-3 border-b border-[#142238]/60">
            <div className="w-10 h-10 rounded-full bg-[#1d4ed8] text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
              T
            </div>
            <div>
              <div className="font-bold text-white text-base leading-tight">TRP Wallet</div>
              <div className="text-[11px] text-slate-400 font-medium">JUWA777 Official</div>
            </div>
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#1d4ed8] text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-4 border-t border-[#142238]/80 bg-[#091220]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1e40af] text-white font-bold text-sm flex items-center justify-center shrink-0">
              {user?.username ? user.username[0].toUpperCase() : 'P'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">
                {user?.username || 'alex'}
              </div>
              <div className="mt-0.5">
                <span className="text-[10px] font-semibold bg-[#172554] text-[#60a5fa] px-2 py-0.5 rounded border border-[#1e3a8a]">
                  {user?.account_status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Mobile Responsive Drawer (< lg screens) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Sliding Drawer Content */}
          <aside className="relative w-72 max-w-[85vw] bg-[#0b1728] border-r border-[#15233a] h-full flex flex-col justify-between text-slate-300 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Header with Close X */}
              <div className="p-5 flex items-center justify-between border-b border-[#142238]/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1d4ed8] text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
                    T
                  </div>
                  <div>
                    <div className="font-bold text-white text-base leading-tight">TRP Wallet</div>
                    <div className="text-[11px] text-slate-400 font-medium">JUWA777 Official</div>
                  </div>
                </div>
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
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#1d4ed8] text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Bottom Profile */}
            <div className="p-4 border-t border-[#142238]/80 bg-[#091220]/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1e40af] text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {user?.username ? user.username[0].toUpperCase() : 'P'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.username || 'alex'}
                  </div>
                  <div className="mt-0.5">
                    <span className="text-[10px] font-semibold bg-[#172554] text-[#60a5fa] px-2 py-0.5 rounded border border-[#1e3a8a]">
                      {user?.account_status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
