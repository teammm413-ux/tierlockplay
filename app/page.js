'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import ChromeNotificationPrompt from '@/components/ChromeNotificationPrompt';
import {
  ShieldCheck,
  Zap,
  Gift,
  ArrowRight,
  Flame,
  Star,
  CheckCircle2,
  Gamepad2,
  Lock,
  Headphones
} from 'lucide-react';

export default function HomePage() {
  const [platforms, setPlatforms] = useState([]);

  useEffect(() => {
    fetch('/api/games/platforms')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPlatforms(d.platforms || []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-white selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#1f293d]/80 bg-[#07090e]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo size="medium" />

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-300">
            <a href="#games" className="hover:text-amber-400 transition">Game Platforms</a>
            <a href="#features" className="hover:text-amber-400 transition">How It Works</a>
            <a href="#vip" className="hover:text-amber-400 transition">VIP Rewards</a>
            <Link href="/admin/login" className="text-xs text-gray-500 hover:text-gray-400">Admin</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white hover:text-amber-400 transition"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="btn-gold px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              <span>Get $5 Freeplay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-6 animate-pulse">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>AMERICA'S #1 TRUSTED SWEEPSTAKES & CASINO WALLET</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            THE GOLD STANDARD <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
              USA CASINO WALLET
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-400 mb-10 leading-relaxed">
            One master wallet to fund and cash out from 12+ legendary platforms: Juwa, Fire Kirin, Orion Stars, Game Vault, and Panda Master. Instant Cash App loading &amp; 5-minute guaranteed payouts.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto btn-gold px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-950 flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(245,158,11,0.4)] transform hover:-translate-y-0.5 transition"
            >
              <Gift className="w-5 h-5" />
              <span>Claim $5 Freeplay Bonus</span>
            </Link>
            <Link
              href="/player/game-platforms"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold bg-[#131b26] hover:bg-[#1a2333] border border-gray-800 text-white flex items-center justify-center gap-2 transition"
            >
              <Gamepad2 className="w-5 h-5 text-amber-400" />
              <span>Explore 12 Game Platforms</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-[#0f141f] border border-gray-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Instant Load</div>
                <div className="text-[11px] text-gray-400">Cash App &amp; Chime</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0f141f] border border-gray-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">5-Min Payouts</div>
                <div className="text-[11px] text-gray-400">Guaranteed 24/7</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0f141f] border border-gray-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">WhatsApp Live</div>
                <div className="text-[11px] text-gray-400">Real Human Support</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0f141f] border border-gray-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">USA Compliant</div>
                <div className="text-[11px] text-gray-400">Sweepstakes Model</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Platforms Section */}
      <section id="games" className="py-20 bg-[#0a0e17] border-t border-b border-[#1a2335]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              OFFICIAL PARTNERS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              12 Premier Sweepstakes Platforms
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              Connect your favorite game IDs and instantly transfer credits to and from your Vegas Vault.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {platforms.map((p) => (
              <div
                key={p.id}
                className="group relative bg-[#111723] hover:bg-[#151e2e] border border-gray-800 hover:border-amber-500/40 rounded-2xl p-5 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  {p.logo_url}
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                  {p.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {p.tagline || 'Popular fish games & slot reels with high RTP.'}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-800/80 flex items-center justify-between">
                  <a
                    href={p.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-gray-300 hover:text-amber-400 transition"
                  >
                    Download App
                  </a>
                  <Link
                    href="/sign-in"
                    className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Play Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#05070a] border-t border-gray-900 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          <Logo size="small" />
          <p className="max-w-md text-gray-400 leading-relaxed">
            Vegas Vault is an authorized entertainment sweepstakes wallet. Operating legally within the United States under standard sweepstakes promotional rules. Must be 21+ to participate.
          </p>
          <div className="flex items-center gap-6 text-gray-400 font-medium">
            <Link href="/sign-in" className="hover:text-white">Player Login</Link>
            <Link href="/sign-up" className="hover:text-white">Register</Link>
            <Link href="/admin/login" className="hover:text-white">Admin Portal</Link>
          </div>
          <p className="text-gray-600 mt-4">
            © 2026 Vegas Vault Casino &amp; Game Wallet. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Floating Freeplay & WhatsApp Support */}
      <FreeplayModal />
      <WhatsAppChat />
      <ChromeNotificationPrompt />
    </div>
  );
}
