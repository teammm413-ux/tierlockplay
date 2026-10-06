'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Gamepad2,
  MessageSquare,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDepositAction = async (id, action) => {
    try {
      const res = await fetch('/api/admin/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setActionNotice(resJson.message);
        fetchStats();
      }
    } catch (err) {}
  };

  const handleWithdrawalAction = async (id, action) => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setActionNotice(resJson.message);
        fetchStats();
      }
    } catch (err) {}
  };

  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-[#06080e] text-white flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              MANAGEMENT CONSOLE
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">
              Admin Operations Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/chat"
              className="bg-[#121b28] hover:bg-[#1a2538] border border-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-2 transition"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Desk</span>
            </Link>
            <Link
              href="/admin/promotions"
              className="btn-gold px-4 py-2 rounded-xl text-xs font-black uppercase text-slate-950 flex items-center gap-1.5 shadow"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Send Promo Blast</span>
            </Link>
          </div>
        </div>

        {actionNotice && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-400 font-bold">×</button>
          </div>
        )}

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Deposited */}
          <div className="p-5 rounded-2xl bg-[#0e131d] border border-gray-800 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Total Deposited</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono mt-2">
              ${stats?.totalDeposited.toFixed(2) || '0.00'}
            </div>
            <div className="text-[11px] text-amber-400 mt-1 font-semibold">
              {stats?.pendingDepositsCount || 0} Pending Approvals (${stats?.pendingDepositsSum.toFixed(2) || '0.00'})
            </div>
          </div>

          {/* Total Withdrawn */}
          <div className="p-5 rounded-2xl bg-[#0e131d] border border-gray-800 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Total Paid Out</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
              ${stats?.totalWithdrawn.toFixed(2) || '0.00'}
            </div>
            <div className="text-[11px] text-emerald-300 mt-1 font-semibold">
              {stats?.pendingWithdrawalsCount || 0} In Payout Queue (${stats?.pendingWithdrawalsSum.toFixed(2) || '0.00'})
            </div>
          </div>

          {/* Players */}
          <div className="p-5 rounded-2xl bg-[#0e131d] border border-gray-800 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Registered Players</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {stats?.totalUsers || 0}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {stats?.activeUsers || 0} Active accounts
            </div>
          </div>

          {/* Support Desk */}
          <div className="p-5 rounded-2xl bg-[#0e131d] border border-gray-800 shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Live Support</span>
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {stats?.unreadChatMessages || 0}
            </div>
            <div className="text-[11px] text-red-400 mt-1 font-semibold">
              Unread player messages
            </div>
          </div>
        </div>

        {/* 2-Column Action Queues: Pending Deposits & Pending Withdrawals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Deposits Queue */}
          <div className="bg-[#0e131d] border border-gray-800 rounded-2xl p-5 shadow">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Deposit Requests
                </h2>
              </div>
              <Link href="/admin/deposits" className="text-xs text-amber-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {data?.recentDeposits?.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">No deposit requests</div>
              ) : (
                data?.recentDeposits?.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-[#141b27] border border-gray-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{d.username}</span>
                        <span className="text-[10px] text-gray-400">({d.payment_method})</span>
                      </div>
                      <div className="text-[10px] font-mono text-amber-400 mt-0.5">
                        ${d.paid_amount.toFixed(2)} • {d.order_no}
                      </div>
                      {d.transaction_proof && (
                        <div className="text-[9px] text-gray-400 font-mono">Proof: {d.transaction_proof}</div>
                      )}
                    </div>

                    {d.status === 'Pending' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDepositAction(d.id, 'approve')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDepositAction(d.id, 'reject')}
                          className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-[11px] font-bold rounded-lg transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        d.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {d.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Withdrawals Queue */}
          <div className="bg-[#0e131d] border border-gray-800 rounded-2xl p-5 shadow">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Withdrawal / Cashout Requests
                </h2>
              </div>
              <Link href="/admin/withdrawals" className="text-xs text-amber-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {data?.recentWithdrawals?.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500">No withdrawal requests</div>
              ) : (
                data?.recentWithdrawals?.map((w) => (
                  <div key={w.id} className="p-3 rounded-xl bg-[#141b27] border border-gray-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{w.username}</span>
                        <span className="text-[10px] text-emerald-400">({w.payment_method})</span>
                      </div>
                      <div className="text-[10px] font-mono text-gray-300 mt-0.5">
                        Pay ${w.received_amount.toFixed(2)} to <span className="font-bold text-white">{w.payment_info}</span>
                      </div>
                      <div className="text-[9px] text-gray-500 font-mono">Order: {w.order_no}</div>
                    </div>

                    {w.status === 'Pending' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleWithdrawalAction(w.id, 'approve')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition"
                        >
                          Mark Sent
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(w.id, 'reject')}
                          className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-[11px] font-bold rounded-lg transition"
                        >
                          Refund
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        w.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {w.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
