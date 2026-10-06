'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Megaphone,
  Bell,
  Mail,
  Send,
  Users,
  Sparkles,
  Gift,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminPromotionsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({ totalSubscribers: 0, totalUnsubscribers: 0, totalPlayers: 0 });
  const [formData, setFormData] = useState({
    title: 'Weekend 100% Reload Match Bonus! 🎰',
    message: 'Deposit $20 or more today and get an extra $10 freeplay added to any platform of your choice!',
    promoCode: 'VAULT100',
    bonusAmount: '10.00',
    targetAudience: 'both', // 'subscribers' | 'unsubscribers' | 'both'
    deliveryChannel: 'both', // 'chrome' | 'email' | 'both'
  });
  const [isDispatching, setIsDispatching] = useState(false);
  const [notice, setNotice] = useState({ text: '', isError: false });

  const loadCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/promotions');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        setStats(data.stats || { totalSubscribers: 0, totalUnsubscribers: 0, totalPlayers: 0 });
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleDispatch = async (e) => {
    e.preventDefault();
    setNotice({ text: '', isError: false });
    setIsDispatching(true);

    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ text: data.message, isError: false });
        loadCampaigns();
      } else {
        setNotice({ text: data.message || 'Failed to dispatch promo', isError: true });
      }
    } catch (err) {
      setNotice({ text: 'Error dispatching campaign', isError: true });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-white flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="pb-4 border-b border-gray-800">
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-400" />
            <span>Promotional Campaigns Engine</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Segment by audience (Subscribers / Unsubscribers / Both) and choose delivery channels (Chrome Web Notifications / SMTP Email / Both).
          </p>
        </div>

        {notice.text && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            notice.isError ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {notice.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Audience Overview Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#0e131d] border border-gray-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Subscribers Pool</div>
              <div className="text-xl font-black text-amber-400 mt-1">
                {stats.totalSubscribers} Players
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 font-bold px-2 py-0.5 rounded">
              OPTED IN
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0e131d] border border-gray-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Unsubscribers Pool</div>
              <div className="text-xl font-black text-gray-300 mt-1">
                {stats.totalUnsubscribers} Players
              </div>
            </div>
            <span className="text-[10px] bg-gray-800 text-gray-400 font-bold px-2 py-0.5 rounded">
              UNSUBSCRIBED
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0e131d] border border-gray-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Total Reach (Both)</div>
              <div className="text-xl font-black text-emerald-400 mt-1">
                {stats.totalPlayers} Players
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-bold px-2 py-0.5 rounded">
              100% AUDIENCE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Campaign Form */}
          <div className="lg:col-span-2 bg-[#0e131d] border border-gray-800 rounded-2xl p-6 shadow space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Compose Campaign Blast</span>
            </h2>

            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              {/* Campaign Title */}
              <div>
                <label className="text-gray-300 font-bold uppercase tracking-wider block mb-1.5">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. VIP Friday Jackpot Reload!"
                  className="w-full bg-[#161d2c] border border-gray-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Promo Code & Bonus Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 font-bold uppercase tracking-wider block mb-1.5">
                    Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.promoCode}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                    placeholder="e.g. GOLD777"
                    className="w-full bg-[#161d2c] border border-gray-700 text-amber-400 font-mono font-bold text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
                <div>
                  <label className="text-gray-300 font-bold uppercase tracking-wider block mb-1.5">
                    Bonus Value ($ Freeplay)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.bonusAmount}
                    onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                    placeholder="10.00"
                    className="w-full bg-[#161d2c] border border-gray-700 text-emerald-400 font-mono font-bold text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Promo Message */}
              <div>
                <label className="text-gray-300 font-bold uppercase tracking-wider block mb-1.5">
                  Promotional Message Body
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-[#161d2c] border border-gray-700 text-white text-xs p-3.5 rounded-xl focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              {/* 1. Target Audience Segmentation (Requirement) */}
              <div>
                <label className="text-gray-300 font-bold uppercase tracking-wider block mb-2">
                  1. Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'subscribers', label: 'Subscribers Only', sub: `${stats.totalSubscribers} players` },
                    { id: 'unsubscribers', label: 'Unsubscribers Only', sub: `${stats.totalUnsubscribers} players` },
                    { id: 'both', label: 'Both (All Players)', sub: `${stats.totalPlayers} total reach` },
                  ].map((a) => {
                    const isSelected = formData.targetAudience === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, targetAudience: a.id })}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                            : 'bg-[#141b27] border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <div className="font-bold text-xs">{a.label}</div>
                        <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">{a.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Delivery Channel Segmentation (Requirement) */}
              <div>
                <label className="text-gray-300 font-bold uppercase tracking-wider block mb-2">
                  2. Delivery Channel
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'chrome', label: 'Chrome Push Only', icon: Bell, sub: 'Web Notification API' },
                    { id: 'email', label: 'Email Only', icon: Mail, sub: 'Real SMTP Dispatch' },
                    { id: 'both', label: 'Both (Chrome & Email)', icon: Megaphone, sub: 'Multi-Channel Blast' },
                  ].map((c) => {
                    const Icon = c.icon;
                    const isSelected = formData.deliveryChannel === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, deliveryChannel: c.id })}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                            : 'bg-[#141b27] border-gray-800 text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-gray-500'}`} />
                          <span>{c.label}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{c.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Dispatch Button */}
              <button
                type="submit"
                disabled={isDispatching}
                className="w-full btn-gold py-4 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(245,158,11,0.35)] disabled:opacity-50 mt-4"
              >
                <Send className="w-4 h-4" />
                <span>{isDispatching ? 'Dispatching Broadcast...' : 'Dispatch Promotional Campaign'}</span>
              </button>
            </form>
          </div>

          {/* Past Campaigns Log */}
          <div className="bg-[#0e131d] border border-gray-800 rounded-2xl p-5 shadow flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-gray-800">
                Campaign History ({campaigns.length})
              </h2>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {campaigns.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-500">
                    No campaigns dispatched yet. Use the form to launch your first blast.
                  </div>
                ) : (
                  campaigns.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-[#141b27] border border-gray-800 space-y-1.5">
                      <div className="text-xs font-bold text-white line-clamp-1">{c.title}</div>
                      <p className="text-[11px] text-gray-400 line-clamp-2">{c.message}</p>
                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-amber-400 font-bold">
                          {c.promo_code ? `Code: ${c.promo_code}` : 'No code'}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                          {c.total_sent} Sent
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-gray-500 pt-1 border-t border-gray-800/80">
                        <span className="capitalize">{c.target_audience} • {c.delivery_channel}</span>
                        <span>{c.created_at ? c.created_at.substring(0, 16) : ''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
