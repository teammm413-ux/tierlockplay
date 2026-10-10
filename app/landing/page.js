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
    <div className="min-h-screen bg-[#07080b] text-slate-100 selection:bg-[#FFCC00] selection:text-slate-950 font-sans">
      {/* Top Navbar in Sleek Dark Obsidian */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07080b]/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Logo size="medium" theme="dark" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#games" className="hover:text-[#FFCC00] transition">Game Platforms</a>
            <a href="#how-it-works" className="hover:text-[#FFCC00] transition">How It Works</a>
            <a href="#security" className="hover:text-[#FFCC00] transition">Security &amp; Cashout</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 bg-[#FFCC00] hover:bg-yellow-300 shadow-[0_4px_16px_rgba(255,204,0,0.35)] flex items-center gap-1.5 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Get $5 Freeplay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden bg-[#07080b]">
        {/* Soft Ambient Radial Gold Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#FFCC00]/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFCC00]/10 border border-[#FFCC00]/30 text-[#FFCC00] text-xs font-bold mb-6 shadow-sm">
            <Flame className="w-4 h-4 text-[#FFCC00] fill-[#FFCC00]" />
            <span className="tracking-wider uppercase">WHEN TRUST MATTERS, CHOOSE TIERLOCK</span>
          </div>

          {/* Big Hero Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-white uppercase">
            WHEN TRUST MATTERS, <br />
            <span className="text-[#FFCC00] drop-shadow-[0_0_40px_rgba(255,204,0,0.35)]">
              CHOOSE TIERLOCK
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-10 leading-relaxed font-normal">
            Official master wallet for <span className="text-white font-bold">TierlockPlay</span> (<span className="text-[#FFCC00] font-semibold">tierlockplay.com</span>). Instant funding and verified cashouts across 12+ legendary sweepstakes platforms: Juwa, Fire Kirin, Orion Stars, Game Vault, and Panda Master.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-slate-950 bg-[#FFCC00] hover:bg-yellow-300 shadow-[0_8px_24px_rgba(255,204,0,0.35)] flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition active:scale-98"
            >
              <Gift className="w-5 h-5 text-slate-950" />
              <span>Claim $5 Freeplay Bonus</span>
            </Link>
            <a
              href="#games"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold bg-[#101117] hover:bg-[#161822] border border-white/10 text-white flex items-center justify-center gap-2 transition hover:border-[#FFCC00]/40"
            >
              <Gamepad2 className="w-5 h-5 text-[#FFCC00]" />
              <span>Explore 12 Game Platforms</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-[#101117] border border-white/10 hover:border-[#FFCC00]/40 shadow-xs flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-xl bg-[#FFCC00]/10 border border-[#FFCC00]/30 text-[#FFCC00] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Instant Load</div>
                <div className="text-[11px] text-slate-400">Cash App &amp; Chime</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#101117] border border-white/10 hover:border-[#FFCC00]/40 shadow-xs flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">5-Min Payouts</div>
                <div className="text-[11px] text-slate-400">Guaranteed 24/7</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#101117] border border-white/10 hover:border-[#FFCC00]/40 shadow-xs flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-xl bg-[#25d366]/10 border border-[#25d366]/30 text-[#25d366] flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">WhatsApp Live</div>
                <div className="text-[11px] text-slate-400">Real Human Support</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#101117] border border-white/10 hover:border-[#FFCC00]/40 shadow-xs flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-xl bg-[#FFCC00]/10 border border-[#FFCC00]/30 text-[#FFCC00] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">USA Compliant</div>
                <div className="text-[11px] text-slate-400">Tierlock Sweepstakes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Platforms Section with Real Images */}
      <section id="games" className="py-20 bg-[#0c0d13] border-t border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black text-[#FFCC00] uppercase tracking-widest bg-[#FFCC00]/10 px-3 py-1 rounded-full border border-[#FFCC00]/30">
              OFFICIAL PARTNERS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
              12 Premier Sweepstakes Platforms
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Connect your favorite game IDs and instantly transfer credits to and from your TierlockPlay wallet.
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
                  className="group bg-[#101117] rounded-2xl border border-white/10 hover:border-[#FFCC00]/50 p-4 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,204,0,0.15)] transform hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Game Artwork Box */}
                    <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-black relative border border-white/10 shadow-xs">
                      <img
                        src={imageSrc}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/games/juwa.jpg';
                        }}
                      />
                      <div className="absolute top-2.5 right-2.5 bg-black/85 backdrop-blur-xs text-[#FFCC00] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#FFCC00]/30">
                        {p.rtp || '97% RTP'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-bold text-white group-hover:text-[#FFCC00] transition">
                        {p.name}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {p.tagline || 'Popular fish games & slot reels with high sweepstakes payouts.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <a
                      href={p.download_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                    <Link
                      href="/sign-in"
                      className="text-xs font-bold text-slate-950 bg-[#FFCC00] hover:bg-yellow-300 flex items-center gap-1 px-3 py-1.5 rounded-lg transition"
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
      <section id="how-it-works" className="py-20 bg-[#07080b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-[#FFCC00] uppercase tracking-widest bg-[#FFCC00]/10 px-3 py-1 rounded-full border border-[#FFCC00]/30">
              EASY 3 STEPS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
              How TierlockPlay Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Start playing in under 2 minutes with seamless wallet management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#101117] p-8 rounded-2xl border border-white/10 text-center relative hover:border-[#FFCC00]/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-[#FFCC00] text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-yellow-500/20">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Create Account &amp; Claim $5</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up with your phone number and email to receive an instant $5 Welcome Freeplay Bonus in your wallet.
              </p>
            </div>

            <div className="bg-[#101117] p-8 rounded-2xl border border-white/10 text-center relative hover:border-[#FFCC00]/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-[#FFCC00] text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-yellow-500/20">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Load Funds with Cash App</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deposit instantly using Cash App or TapTapUp automated gateway. Credits appear in your wallet in real time.
              </p>
            </div>

            <div className="bg-[#101117] p-8 rounded-2xl border border-white/10 text-center relative hover:border-[#FFCC00]/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-[#FFCC00] text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-yellow-500/20">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Play Games &amp; Cashout in 5 Mins</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transfer credits to your favorite game platforms and request fast cashouts directly to your Cash App tag.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#050608] border-t border-white/10 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          <Logo size="small" theme="dark" />
          <p className="max-w-md text-slate-400 leading-relaxed">
            TierlockPlay (<span className="text-[#FFCC00]">tierlockplay.com</span>) is an authorized entertainment sweepstakes wallet operating legally within the United States. Must be 21+ to participate.
          </p>
          <div className="flex items-center gap-6 text-slate-300 font-semibold">
            <Link href="/sign-in" className="hover:text-[#FFCC00] transition">Player Login</Link>
            <Link href="/sign-up" className="hover:text-[#FFCC00] transition">Register</Link>
            <Link href="/admin/login" className="hover:text-[#FFCC00] transition">Admin Portal</Link>
          </div>
          <p className="text-slate-500 mt-2">
            © 2026 TierlockPlay • When Trust Matters, Choose Tierlock. All rights reserved.
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
