'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PlayerHeader from '@/components/PlayerHeader';
import WhatsAppChat from '@/components/WhatsAppChat';
import {
  Sparkles,
  Gift,
  Copy,
  Check,
  CreditCard,
  MessageCircle,
  Clock,
  RefreshCw,
  Tag,
  Flame,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function PlayerPromotionsPage() {
  const [user, setUser] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'codes' | 'bonus'

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) setUser(data.user);
    } catch (err) {}
  };

  const loadPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/promotions');
      const data = await res.json();
      if (data.success) {
        setPromotions(data.promotions || []);
      }
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
    loadPromotions();
  }, []);

  const handleCopyCode = (code, id) => {
    if (!code) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filteredPromos = promotions.filter((p) => {
    if (filter === 'codes') return Boolean(p.promo_code);
    if (filter === 'bonus') return Number(p.bonus_amount || 0) > 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col font-sans">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Desktop Sidebar & Mobile Drawer */}
        <Sidebar user={user} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <PlayerHeader
            user={user}
            onOpenChat={() => setIsChatOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center shrink-0 border border-[#FFCC00]/30 shadow-[0_0_15px_rgba(255,204,0,0.15)]">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    Promotions &amp; Exclusive Bonuses
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Live reload matches, weekend freeplay drops, and official promo codes. Enter codes during deposit or claim with live chat.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={loadPromotions}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl bg-[#101117] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  title="Refresh Promotions"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FFCC00]' : ''}`} />
                  <span>Refresh</span>
                </button>

                <Link
                  href="/player/wallet/deposit"
                  className="px-4 py-2 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wide rounded-xl transition shadow-md flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Deposit Now</span>
                </Link>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                { id: 'all', label: 'All Promotions', count: promotions.length },
                { id: 'codes', label: 'Promo Codes', count: promotions.filter(p => p.promo_code).length },
                { id: 'bonus', label: 'Cashback & Freeplay', count: promotions.filter(p => Number(p.bonus_amount || 0) > 0).length },
              ].map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#FFCC00] text-slate-950 font-black shadow-md'
                        : 'bg-[#101117] text-slate-300 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-white/10 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Promotions List / Grid */}
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#FFCC00] animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Checking live promotion feeds...</p>
              </div>
            ) : filteredPromos.length === 0 ? (
              <div className="bg-[#101117] border border-white/10 rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-xl">
                <div className="w-16 h-16 rounded-3xl bg-[#FFCC00]/10 border border-[#FFCC00]/30 text-[#FFCC00] mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(255,204,0,0.1)]">
                  <Gift className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    No Active Promotions Right Now
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Our team regularly launches reload matches, weekend freeplay bonuses, and VIP gifts. Keep an eye on this tab or reach out to 24/7 Live Support!
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/player/wallet/deposit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wide rounded-xl transition shadow-md"
                  >
                    Deposit To Wallet
                  </Link>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition border border-white/10 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ask Live Support</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPromos.map((promo) => {
                  const hasBonus = Number(promo.bonus_amount || 0) > 0;
                  const isCopied = copiedId === promo.id;
                  const dateStr = promo.created_at
                    ? new Date(promo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Active Now';

                  return (
                    <div
                      key={promo.id}
                      className="bg-[#101117] border border-white/10 hover:border-[#FFCC00]/40 rounded-3xl p-6 transition-all duration-200 shadow-xl flex flex-col justify-between space-y-5 relative overflow-hidden group"
                    >
                      {/* Top ambient gold glow on hover */}
                      <div className="absolute top-0 right-0 w-36 h-36 bg-[#FFCC00]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FFCC00]/10 transition" />

                      <div className="space-y-3.5 relative z-10">
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Promo
                            </span>
                            {hasBonus && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFCC00]/15 text-[#FFCC00] border border-[#FFCC00]/30 font-mono">
                                <Flame className="w-3 h-3 text-[#FFCC00]" />
                                +${Number(promo.bonus_amount).toFixed(2)} Bonus
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {dateStr}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-base sm:text-lg font-black text-white leading-snug tracking-tight group-hover:text-[#FFCC00] transition">
                          {promo.title}
                        </h2>

                        {/* Message Description */}
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-[#181922] p-4 rounded-2xl border border-white/5">
                          {promo.message}
                        </p>

                        {/* Promo Code Box (if present) */}
                        {promo.promo_code && (
                          <div className="p-3.5 rounded-2xl bg-[#0a0b10] border border-[#FFCC00]/30 flex items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Promo Code
                              </span>
                              <span className="text-sm sm:text-base font-black text-[#FFCC00] font-mono tracking-widest">
                                {promo.promo_code}
                              </span>
                            </div>

                            <button
                              onClick={() => handleCopyCode(promo.promo_code, promo.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                                isCopied
                                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                                  : 'bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black shadow-sm'
                              }`}
                              title="Copy Promo Code"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>COPIED!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>COPY CODE</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 relative z-10">
                        <Link
                          href="/player/wallet/deposit"
                          className="flex-1 py-2.5 px-4 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-98"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Deposit &amp; Claim</span>
                        </Link>

                        <button
                          onClick={() => setIsChatOpen(true)}
                          className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition border border-white/10 flex items-center gap-1.5 shrink-0"
                          title="Chat with Support about this promo"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden sm:inline">Ask Support</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating 24/7 WhatsApp Chat Support */}
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />
    </div>
  );
}
