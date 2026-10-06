'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  ArrowDownLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  const loadDeposits = async () => {
    setIsLoading(true);
    try {
      const url = `/api/admin/deposits?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDeposits(data.deposits || []);
      }
    } catch (err) {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeposits();
  }, [statusFilter, searchQuery]);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch('/api/admin/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        loadDeposits();
      } else {
        setActionNotice(data.message || 'Action failed');
      }
    } catch (err) {
      setActionNotice('Error executing action');
    }
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-white flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ArrowDownLeft className="w-6 h-6 text-amber-400" />
              <span>Wallet Deposit Requests</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Review and approve player wallet deposits. Approving immediately credits the player's wallet balance.
            </p>
          </div>
        </div>

        {actionNotice && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-400 font-bold">×</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#0e131d] border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-[#141b27] p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, player, or method..."
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
                  <th className="px-5 py-3.5">Method &amp; Proof</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      {isLoading ? 'Loading deposits...' : 'No deposit requests found.'}
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-mono font-bold text-amber-400">
                        {d.order_no}
                      </td>
                      <td className="px-5 py-4 font-bold text-white">
                        {d.username}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{d.payment_method}</span>
                          {d.payment_gateway === 'TapTapUp' && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono">
                              TapTapUp
                            </span>
                          )}
                        </div>
                        {d.gateway_order_id && (
                          <div className="text-[10px] text-amber-400 font-mono">
                            Gateway ID: #{d.gateway_order_id}
                          </div>
                        )}
                        {d.redirect_url && (
                          <a
                            href={d.redirect_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-400 hover:underline block truncate max-w-[200px]"
                            title="Open Gateway Checkout Page"
                          >
                            View Gateway Form &rarr;
                          </a>
                        )}
                        {d.transaction_proof && (
                          <span className="text-[10px] text-gray-400 font-mono block">
                            Proof: {d.transaction_proof}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono font-extrabold text-white">
                        ${d.paid_amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            d.status === 'Approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : d.status === 'Rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 font-mono text-[11px]">
                        {d.created_at}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {d.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleAction(d.id, 'approve')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(d.id, 'reject')}
                              className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-lg text-xs font-bold transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[10px]">Processed</span>
                        )}
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
