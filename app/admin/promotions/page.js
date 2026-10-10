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
  AlertCircle,
  Trash2,
} from 'lucide-react';

export default function AdminPromotionsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({ totalSubscribers: 0, totalUnsubscribers: 0, totalPlayers: 0 });
  const [formData, setFormData] = useState({
    title: 'Weekend 100% Reload Match Bonus! 🎰',
    message: 'Deposit $20 or more today and get an extra $10 freeplay added to any platform of your choice!',
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

  const handleDeleteCampaign = async (id, title) => {
    if (!confirm(`Are you sure you want to delete campaign "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNotice({ text: `Campaign "${title}" deleted successfully!`, isError: false });
        loadCampaigns();
      } else {
        setNotice({ text: data.message || 'Failed to delete campaign', isError: true });
      }
    } catch (err) {
      setNotice({ text: 'Error deleting campaign', isError: true });
    }
  };

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-500" />
            <span>Promotional Campaigns Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Segment by audience (Subscribers / Unsubscribers / Both) and choose delivery channels (Chrome Web Notifications / SMTP Email / Both).
          </p>
        </div>

        {notice.text && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 shadow-sm ${
            notice.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {notice.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Audience Overview Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Subscribers Pool</div>
              <div className="text-xl font-black text-amber-600 mt-1">
                {stats.totalSubscribers} Players
              </div>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
              OPTED IN
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Unsubscribers Pool</div>
              <div className="text-xl font-black text-slate-700 mt-1">
                {stats.totalUnsubscribers} Players
              </div>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
              UNSUBSCRIBED
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total Reach (Both)</div>
              <div className="text-xl font-black text-emerald-600 mt-1">
                {stats.totalPlayers} Players
              </div>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              100% AUDIENCE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Campaign Form */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Compose Campaign Blast</span>
            </h2>

            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              {/* Campaign Title */}
              <div>
                <label className="text-slate-700 font-bold uppercase tracking-wider block mb-1.5">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. VIP Friday Jackpot Reload!"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white placeholder-slate-400 transition"
                />
              </div>

              {/* Promotional Message Body */}
              <div>
                <label className="text-slate-700 font-bold uppercase tracking-wider block mb-1.5">
                  Promotional Message Body
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe the bonus running right now (e.g. Deposit $20 or more today and get an extra $10 freeplay added to any platform of your choice!)..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs p-3.5 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white leading-relaxed transition"
                />
              </div>

              {/* 1. Target Audience Segmentation (Requirement) */}
              <div>
                <label className="text-slate-700 font-bold uppercase tracking-wider block mb-2">
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
                            ? 'bg-amber-50 border-amber-500 text-slate-900 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-bold text-xs">{a.label}</div>
                        <div className="text-[10px] text-amber-600 font-mono mt-0.5">{a.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Delivery Channel Segmentation (Requirement) */}
              <div>
                <label className="text-slate-700 font-bold uppercase tracking-wider block mb-2">
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
                            ? 'bg-emerald-50 border-emerald-500 text-slate-900 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span>{c.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{c.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Dispatch Button */}
              <button
                type="submit"
                disabled={isDispatching}
                className="w-full btn-gold py-4 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-4 cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>{isDispatching ? 'Dispatching Broadcast...' : 'Dispatch Promotional Campaign'}</span>
              </button>
            </form>
          </div>

          {/* Past Campaigns Log */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Campaign History ({campaigns.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Active Alerts</span>
              </h2>

              <div className="space-y-3 max-h-[520px] overflow-y-auto">
                {campaigns.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    No active campaigns. Use the form to launch a new promotional announcement.
                  </div>
                ) : (
                  campaigns.map((c) => (
                    <div key={c.id || c._id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-slate-300 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold text-slate-900 leading-snug">{c.title}</div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(c.id || c._id, c.title)}
                          className="text-rose-500 hover:text-white p-1 rounded-lg hover:bg-rose-600 transition shrink-0 cursor-pointer"
                          title="Delete this campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line bg-white/70 p-2 rounded-lg border border-slate-100">
                        {c.message}
                      </p>

                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          {c.total_sent || 0} Sent
                        </span>
                        <span className="text-slate-400 font-mono text-[9px]">
                          {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                        </span>
                      </div>

                      <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-200 flex items-center justify-between">
                        <span className="capitalize">{c.target_audience} • {c.delivery_channel}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(c.id || c._id, c.title)}
                          className="text-rose-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Delete</span>
                        </button>
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
