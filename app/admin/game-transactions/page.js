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
    <div className="min-h-screen bg-[#06080e] text-white flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-amber-400" />
              <span>Platform Game Transactions</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Live audit of credits loaded into and redeemed from all 12 sweepstakes platforms.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#0e131d] border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-[#141b27] p-1 rounded-xl w-full sm:w-auto">
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
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, player, or platform..."
              className="w-full bg-[#161d2c] border border-gray-800 text-white text-xs pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0e131d] border border-gray-800 rounded-2xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141b27] text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800">
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
              <tbody className="divide-y divide-gray-800/80">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                      {isLoading ? 'Loading transactions...' : 'No game transactions found.'}
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-mono font-bold text-amber-400">
                        {t.order_no}
                      </td>
                      <td className="px-5 py-4 font-bold text-white">
                        {t.username}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            t.type === 'Deposit'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {t.type === 'Deposit' ? 'Load' : 'Cashout'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">
                        {t.platform_name}
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-300">
                        {t.game_account}
                      </td>
                      <td className="px-5 py-4 font-mono font-extrabold text-white">
                        ${t.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-gray-400">
                        ${t.wallet_balance_before.toFixed(2)} → ${t.wallet_balance_after.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-gray-400 font-mono text-[11px]">
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
