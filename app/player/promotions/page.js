'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PlayerHeader from '@/components/PlayerHeader';
import WhatsAppChat from '@/components/WhatsAppChat';
import {
  Sparkles,
  Gift,
  CreditCard,
  MessageCircle,
  Clock,
  RefreshCw,
  Flame,
  ChevronRight
} from 'lucide-react';

export default function PlayerPromotionsPage() {
  const [user, setUser] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex">
      {/* Desktop Sidebar & Mobile Drawer */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
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
                    Promotions &amp; Special Offers
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Live reload matches, weekend freeplay drops, and ongoing special announcements. Claim directly by depositing or messaging 24/7 Live Support!
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



            {/* Promotions List / Grid */}
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#FFCC00] animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Checking live promotion feeds...</p>
              </div>
            ) : promotions.length === 0 ? (
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
                {promotions.map((promo) => {
                  const hasBonus = Number(promo.bonus_amount || 0) > 0;
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

      {/* Floating 24/7 WhatsApp Chat Support */}
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />
    </div>
  );
}
