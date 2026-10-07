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
  Headphones,
  Download,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const [platforms, setPlatforms] = useState([]);
  const [isFreeplayOpen, setIsFreeplayOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetch('/api/games/platforms')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPlatforms(d.platforms || []);
      })
      .catch(() => { });
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Top Navbar in Crisp Light Mode */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo size="medium" theme="light" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#games" className="hover:text-amber-600 transition">Game Platforms</a>
            <a href="#how-it-works" className="hover:text-amber-600 transition">How It Works</a>
            <a href="#security" className="hover:text-amber-600 transition">Security &amp; Cashout</a>
            {/* <Link href="/admin/login" className="text-xs text-slate-400 hover:text-slate-600 font-medium">Admin Portal</Link> */}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-600 hover:bg-slate-50 transition"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-[0_4px_16px_rgba(245,158,11,0.35)] flex items-center gap-1.5 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get $5 Freeplay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-14 pb-20 overflow-hidden bg-gradient-to-b from-white via-amber-50/20 to-[#f8fafc]">
        {/* Soft Ambient Background Highlights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-amber-200/40 via-yellow-100/30 to-emerald-100/30 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/90 text-amber-800 text-xs font-bold mb-6 shadow-xs animate-bounce-subtle">
            <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>AMERICA&apos;S #1 TRUSTED SWEEPSTAKES &amp; CASINO WALLET</span>
          </div>

          {/* Big Hero Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-slate-900">
            THE GOLD STANDARD <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 drop-shadow-xs">
              USA CASINO WALLET
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 mb-10 leading-relaxed font-normal">
            One master wallet to fund and cash out from 12+ legendary sweepstakes platforms: Juwa, Fire Kirin, Orion Stars, Game Vault, and Panda Master. Instant Cash App loading &amp; 5-minute guaranteed payouts.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-[0_8px_24px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition active:scale-98"
            >
              <Gift className="w-5 h-5 text-slate-950" />
              <span>Claim $5 Freeplay Bonus</span>
            </Link>
            <a
              href="#games"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center gap-2 transition shadow-xs hover:shadow-md"
            >
              <Gamepad2 className="w-5 h-5 text-amber-500" />
              <span>Explore 12 Game Platforms</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Instant Load</div>
                <div className="text-[11px] text-slate-500">Cash App &amp; Chime</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">5-Min Payouts</div>
                <div className="text-[11px] text-slate-500">Guaranteed 24/7</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">WhatsApp Live</div>
                <div className="text-[11px] text-slate-500">Real Human Support</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">USA Compliant</div>
                <div className="text-[11px] text-slate-500">Sweepstakes Model</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Platforms Section with Real Images */}
      <section id="games" className="py-20 bg-slate-50 border-t border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-100/60 px-3 py-1 rounded-full border border-amber-200">
              OFFICIAL PARTNERS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3 tracking-tight">
              12 Premier Sweepstakes Platforms
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Connect your favorite game IDs and instantly transfer credits to and from your TierLockPlay wallet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {platforms.map((p) => {
              const imageSrc = p.logo_url && p.logo_url.startsWith('/')
                ? p.logo_url
                : `/images/games/${p.slug || 'juwa'}.jpg`;

              return (
                <div
                  key={p.id || p._id || p.slug}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-amber-400 p-4 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    {/* Game Artwork Box */}
                    <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-slate-950 relative border border-slate-100 shadow-xs">
                      <img
                        src={imageSrc}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/games/juwa.jpg';
                        }}
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-white/10">
                        {p.rtp || '97% RTP'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition">
                        {p.name}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {p.tagline || 'Popular fish games & slot reels with high sweepstakes payouts.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={p.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                    <Link
                      href="/sign-in"
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 hover:bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-200/80 transition"
                    >
                      <span>Play Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-100/60 px-3 py-1 rounded-full border border-amber-200">
              EASY 3 STEPS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              How TierLockPlay Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Start playing in under 2 minutes with seamless wallet management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200/80 text-center relative shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Create Account &amp; Claim $5</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sign up with your phone number and email to receive an instant $5 Welcome Freeplay Bonus in your wallet.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200/80 text-center relative shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Load Funds with Cash App</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deposit instantly using Cash App or TapTapUp automated gateway. Credits appear in your wallet in real time.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200/80 text-center relative shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Play Games &amp; Cashout in 5 Mins</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transfer credits to your favorite game platforms and request fast cashouts directly to your Cash App tag.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          <Logo size="small" theme="light" />
          <p className="max-w-md text-slate-500 leading-relaxed">
            TierLockPlay (Vegas Vault) is an authorized entertainment sweepstakes wallet operating legally within the United States. Must be 21+ to participate.
          </p>
          <div className="flex items-center gap-6 text-slate-600 font-semibold">
            <Link href="/sign-in" className="hover:text-amber-600 transition">Player Login</Link>
            <Link href="/sign-up" className="hover:text-amber-600 transition">Register</Link>
            <Link href="/admin/login" className="hover:text-amber-600 transition">Admin Portal</Link>
          </div>
          <p className="text-slate-400 mt-2">
            © 2026 TierLockPlay Casino &amp; Game Wallet. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Floating Freeplay & WhatsApp Support */}
      <FreeplayModal
        isOpen={isFreeplayOpen}
        onClose={() => setIsFreeplayOpen(false)}
      />
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
      <ChromeNotificationPrompt />
    </div>
  );
}
