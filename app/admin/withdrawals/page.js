'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  ArrowUpRight,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  // Reject modal state
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('Invalid payout info or tag not found on Cash App.');

  const loadWithdrawals = async () => {
    setIsLoading(true);
    try {
      const url = `/api/admin/withdrawals?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, [statusFilter, searchQuery]);

  const handleApprove = async (id) => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        loadWithdrawals();
      }
    } catch (err) {
      setActionNotice('Error executing action');
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectItem) return;

    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rejectItem.id,
          action: 'reject',
          reason: rejectReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        setRejectItem(null);
        loadWithdrawals();
      }
    } catch (err) {
      setActionNotice('Error executing reject');
    }
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-white flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ArrowUpRight className="w-6 h-6 text-emerald-400" />
              <span>Wallet Withdrawal / Payout Queue</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Review and dispatch player payouts. Rejecting automatically refunds the funds back to the player's wallet balance.
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
                    ? 'bg-emerald-600 text-white shadow'
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
              placeholder="Search order #, player, or account..."
              className="w-full bg-[#161d2c] border border-gray-800 text-white text-xs pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
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
                  <th className="px-5 py-3.5">Payout Method &amp; Target</th>
                  <th className="px-5 py-3.5">Gross</th>
                  <th className="px-5 py-3.5">Fee (5%)</th>
                  <th className="px-5 py-3.5">Net to Send</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                      {isLoading ? 'Loading withdrawals...' : 'No withdrawal records found.'}
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-mono font-bold text-amber-400">
                        {w.order_no}
                      </td>
                      <td className="px-5 py-4 font-bold text-white">
                        {w.username}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{w.payment_method}</div>
                        <span className="text-[11px] text-emerald-400 font-mono font-bold">
                          {w.payment_info}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-300">
                        ${w.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-mono text-amber-400">
                        -${w.service_fee.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-mono font-extrabold text-emerald-400 text-sm">
                        ${w.received_amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            w.status === 'Approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : w.status === 'Rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {w.status}
                        </span>
                        {w.failure_reason && (
                          <span className="block text-[10px] text-red-400 mt-1 max-w-xs truncate">
                            {w.failure_reason}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {w.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(w.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                            >
                              Mark Sent
                            </button>
                            <button
                              onClick={() => setRejectItem(w)}
                              className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-lg text-xs font-bold transition"
                            >
                              Reject &amp; Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[10px]">
                            {w.processed_at ? w.processed_at.substring(0, 16) : 'Processed'}
                          </span>
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

      {/* Reject & Refund Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#111723] border border-red-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span>Reject &amp; Refund Withdrawal</span>
              </h3>
              <button onClick={() => setRejectItem(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <div className="p-3 bg-[#0a0e16] border border-gray-800 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order:</span>
                  <span className="font-mono text-white">{rejectItem.order_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Refund Amount:</span>
                  <span className="font-mono font-bold text-emerald-400">${rejectItem.amount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Reason for Rejection (Displayed to Player)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-[#161d2c] border border-gray-700 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectItem(null)}
                  className="flex-1 py-3 bg-[#192335] text-gray-300 hover:text-white rounded-xl text-xs font-bold uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl text-xs font-black uppercase text-white transition"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
