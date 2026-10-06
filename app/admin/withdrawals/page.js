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
      } else {
        alert(data.message || 'Reject action failed');
      }
    } catch (err) {
      alert('Network error executing rejection');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ArrowUpRight className="w-6 h-6 text-emerald-600" />
              <span>Wallet Withdrawal Requests</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review and disburse player cashout orders. Mark sent once you dispatch funds via Cash App or PayPal.
            </p>
          </div>
        </div>

        {actionNotice && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between shadow-xs">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-700 font-bold hover:opacity-80">×</button>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                  statusFilter === s
                    ? 'bg-[#0f172a] text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, player, or account..."
              className="w-full bg-white border border-slate-200 text-slate-900 text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      {isLoading ? 'Loading withdrawals...' : 'No withdrawal records found.'}
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-amber-700">
                        {w.order_no}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {w.username}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{w.payment_method}</div>
                        <span className="text-[11px] text-emerald-700 font-mono font-bold">
                          {w.payment_info}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-500">
                        ${w.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-mono text-amber-700 font-medium">
                        -${w.service_fee.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 font-mono font-extrabold text-emerald-700 text-sm">
                        ${w.received_amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            w.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : w.status === 'Rejected'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {w.status}
                        </span>
                        {w.failure_reason && (
                          <span className="block text-[10px] text-red-600 mt-1 max-w-xs truncate font-medium">
                            {w.failure_reason}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {w.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(w.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                            >
                              Mark Sent
                            </button>
                            <button
                              onClick={() => setRejectItem(w)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-700 rounded-lg text-xs font-bold transition border border-slate-200"
                            >
                              Reject &amp; Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Processed</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span>Reject &amp; Refund Withdrawal</span>
              </h3>
              <button onClick={() => setRejectItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order:</span>
                  <span className="font-mono text-slate-900 font-bold">{rejectItem.order_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Refund Amount:</span>
                  <span className="font-mono font-bold text-emerald-700">${rejectItem.amount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Reason for Rejection (Displayed to Player)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs p-3 rounded-xl focus:outline-none focus:border-red-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectItem(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl text-xs font-bold uppercase text-white transition shadow-sm"
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
