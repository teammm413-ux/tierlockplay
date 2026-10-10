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
  RefreshCw
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
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto pt-16 lg:pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-[#FFCC00]" />
              <span>Promotional Campaigns Engine</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Segment by audience (Subscribers / Unsubscribers / Both) and broadcast live promotions via Chrome Notifications and SMTP Email.
            </p>
          </div>

          <button
            onClick={loadCampaigns}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition self-start sm:self-auto"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4 text-[#FFCC00]" />
          </button>
        </div>

        {notice.text && (
          <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-lg ${
            notice.isError
              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
          }`}>
            {notice.isError ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            <span className="font-semibold">{notice.text}</span>
          </div>
        )}

        {/* Audience Overview Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#101117] border border-white/10 flex items-center justify-between shadow-xl">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subscribers Pool</div>
              <div className="text-xl font-black text-[#FFCC00] mt-1 font-mono">
                {stats.totalSubscribers} Players
              </div>
            </div>
            <span className="text-[10px] bg-[#FFCC00]/15 text-[#FFCC00] border border-[#FFCC00]/30 font-bold px-2.5 py-0.5 rounded-full">
              OPTED IN
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#101117] border border-white/10 flex items-center justify-between shadow-xl">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unsubscribers Pool</div>
              <div className="text-xl font-black text-slate-300 mt-1 font-mono">
                {stats.totalUnsubscribers} Players
              </div>
            </div>
            <span className="text-[10px] bg-white/10 text-slate-400 border border-white/10 font-bold px-2.5 py-0.5 rounded-full">
              UNSUBSCRIBED
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#101117] border border-white/10 flex items-center justify-between shadow-xl">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Reach (Both)</div>
              <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
                {stats.totalPlayers} Players
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-0.5 rounded-full">
              100% AUDIENCE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Campaign Form */}
          <div className="lg:col-span-2 bg-[#101117] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/10">
              <Sparkles className="w-4 h-4 text-[#FFCC00]" />
              <span>Compose Campaign Blast</span>
            </h2>

            <form onSubmit={handleDispatch} className="space-y-4 text-xs">
              {/* Campaign Title */}
              <div>
                <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1.5 text-[11px]">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. VIP Friday 100% Reload Match Bonus!"
                  className="w-full bg-[#181922] border border-white/10 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                />
              </div>

              {/* Promotional Message Body */}
              <div>
                <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1.5 text-[11px]">
                  Promotional Message Body
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe the promotion or bonus running right now (e.g. Deposit $20 or more today and get an extra $10 freeplay added to any platform of your choice!)..."
                  className="w-full bg-[#181922] border border-white/10 text-white text-xs p-3.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 leading-relaxed transition"
                />
              </div>

              {/* 1. Target Audience Segmentation */}
              <div>
                <label className="text-slate-300 font-bold uppercase tracking-wider block mb-2 text-[11px]">
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
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#FFCC00]/15 border-[#FFCC00] text-white shadow-sm'
                            : 'bg-[#181922] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-xs">{a.label}</div>
                        <div className="text-[10px] text-[#FFCC00] font-mono mt-0.5">{a.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Delivery Channel Segmentation */}
              <div>
                <label className="text-slate-300 font-bold uppercase tracking-wider block mb-2 text-[11px]">
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
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                            : 'bg-[#181922] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span>{c.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{c.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Dispatch Button */}
              <button
                type="submit"
                disabled={isDispatching}
                className="w-full bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 disabled:opacity-50 mt-4 cursor-pointer active:scale-98 transition"
              >
                <Send className="w-4 h-4" />
                <span>{isDispatching ? 'Dispatching Broadcast...' : 'Dispatch Promotional Campaign'}</span>
              </button>
            </form>
          </div>

          {/* Past Campaigns Log */}
          <div className="bg-[#101117] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-wider mb-4 pb-2 border-b border-white/10 flex items-center justify-between">
                <span>Campaign History ({campaigns.length})</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active Alerts</span>
              </h2>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {campaigns.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500">
                    No active campaigns. Use the form to launch a new promotional announcement.
                  </div>
                ) : (
                  campaigns.map((c) => (
                    <div key={c.id || c._id} className="p-3.5 rounded-xl bg-[#181922] border border-white/10 space-y-2 hover:border-white/20 transition">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold text-white leading-snug">{c.title}</div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(c.id || c._id, c.title)}
                          className="text-rose-400 hover:text-white p-1 rounded-lg hover:bg-rose-500/20 transition shrink-0 cursor-pointer"
                          title="Delete this campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line bg-black/40 p-2.5 rounded-lg border border-white/5">
                        {c.message}
                      </p>

                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          {c.total_sent || 0} Sent
                        </span>
                        <span className="text-slate-400 font-mono text-[9px]">
                          {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                        </span>
                      </div>

                      <div className="text-[9px] text-slate-400 pt-1 border-t border-white/5 flex items-center justify-between">
                        <span className="capitalize">{c.target_audience} • {c.delivery_channel}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(c.id || c._id, c.title)}
                          className="text-rose-400 hover:text-rose-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
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
