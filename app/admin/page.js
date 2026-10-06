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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md inline-block mb-1">
              MANAGEMENT CONSOLE
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Admin Operations Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/chat"
              className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition shadow-xs"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Desk</span>
            </Link>
            <Link
              href="/admin/promotions"
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-400 flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Send Promo Blast</span>
            </Link>
          </div>
        </div>

        {actionNotice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between shadow-xs">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-700 font-bold hover:opacity-80">×</button>
          </div>
        )}

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Deposited */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Deposited</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              ${stats?.totalDeposited?.toFixed(2) || '0.00'}
            </div>
            <div className="text-[11px] text-amber-700 mt-1 font-bold">
              {stats?.pendingDepositsCount || 0} Pending Approvals (${stats?.pendingDepositsSum?.toFixed(2) || '0.00'})
            </div>
          </div>

          {/* Total Withdrawn */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Paid Out</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-2">
              ${stats?.totalWithdrawn?.toFixed(2) || '0.00'}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 font-bold">
              {stats?.pendingWithdrawalsCount || 0} In Payout Queue (${stats?.pendingWithdrawalsSum?.toFixed(2) || '0.00'})
            </div>
          </div>

          {/* Players */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Registered Players</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
              {stats?.totalUsers || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              {stats?.activeUsers || 0} Active accounts
            </div>
          </div>

          {/* Support Desk */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Live Support</span>
              <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 text-red-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
              {stats?.unreadChatMessages || 0}
            </div>
            <div className="text-[11px] text-red-600 mt-1 font-bold">
              Unread player messages
            </div>
          </div>
        </div>

        {/* 2-Column Action Queues: Pending Deposits & Pending Withdrawals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Deposits Queue */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Deposit Requests
                </h2>
              </div>
              <Link href="/admin/deposits" className="text-xs font-bold text-amber-600 hover:text-amber-700">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {data?.recentDeposits?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No deposit requests pending</div>
              ) : (
                data?.recentDeposits?.map((d) => (
                  <div key={d.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{d.username}</span>
                        <span className="text-[10px] text-slate-500">({d.payment_method})</span>
                      </div>
                      <div className="text-[10px] font-mono text-amber-700 mt-0.5 font-bold">
                        ${d.paid_amount.toFixed(2)} • {d.order_no}
                      </div>
                      {d.transaction_proof && (
                        <div className="text-[9px] text-slate-500 font-mono">Proof: {d.transaction_proof}</div>
                      )}
                    </div>

                    {d.status === 'Pending' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDepositAction(d.id, 'approve')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDepositAction(d.id, 'reject')}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-700 text-[11px] font-bold rounded-lg transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        d.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
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
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Withdrawal / Cashout Requests
                </h2>
              </div>
              <Link href="/admin/withdrawals" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {data?.recentWithdrawals?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No withdrawal requests pending</div>
              ) : (
                data?.recentWithdrawals?.map((w) => (
                  <div key={w.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{w.username}</span>
                        <span className="text-[10px] text-emerald-700 font-bold">({w.payment_method})</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-700 mt-0.5">
                        Pay ${w.received_amount.toFixed(2)} to <span className="font-bold text-slate-900">{w.payment_info}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">Order: {w.order_no}</div>
                    </div>

                    {w.status === 'Pending' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleWithdrawalAction(w.id, 'approve')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-xs"
                        >
                          Mark Sent
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(w.id, 'reject')}
                          className="px-2.5 py-1 bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-700 text-[11px] font-bold rounded-lg transition"
                        >
                          Refund
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        w.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
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
