'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Gamepad2,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  History
} from 'lucide-react';

export default function AdminGameTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const url = `/api/admin/game-transactions?type=${typeFilter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [typeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-amber-500" />
              <span>Platform Game Transactions</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live audit of credits loaded into and redeemed from all 12 sweepstakes platforms.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {[
              { label: 'All Operations', value: '' },
              { label: 'Loads (Deposits)', value: 'Deposit' },
              { label: 'Cashouts (Withdrawals)', value: 'Withdrawal' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  typeFilter === t.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, player, or platform..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white placeholder-slate-400 transition"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Order No</th>
                  <th className="px-5 py-3.5">Player</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Platform</th>
                  <th className="px-5 py-3.5">In-Game Account</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Balance Change</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      {isLoading ? 'Loading transactions...' : 'No game transactions found.'}
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-mono font-bold text-amber-600">
                        {t.order_no}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {t.username}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            t.type === 'Deposit'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {t.type === 'Deposit' ? 'Load' : 'Cashout'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {t.platform_name}
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-700">
                        {t.game_account}
                      </td>
                      <td className="px-5 py-4 font-mono font-extrabold text-slate-900">
                        ${t.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-500">
                        ${t.wallet_balance_before.toFixed(2)} → ${t.wallet_balance_after.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                        {t.created_at}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
