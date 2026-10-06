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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ArrowDownLeft className="w-6 h-6 text-amber-600" />
              <span>Wallet Deposit Requests</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review and approve player wallet deposits. Approving immediately credits the player&apos;s wallet balance.
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
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                  statusFilter === status
                    ? 'bg-[#0f172a] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, player, or method..."
              className="w-full bg-white border border-slate-200 text-slate-900 text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 shadow-xs"
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
                  <th className="px-5 py-3.5">Method &amp; Proof</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      {isLoading ? 'Loading deposits...' : 'No deposit requests found.'}
                    </td>
                  </tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 font-mono font-bold text-amber-700">
                        {d.order_no}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {d.username}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{d.payment_method}</span>
                          {d.payment_gateway === 'TapTapUp' && (
                            <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-mono font-bold">
                              TapTapUp
                            </span>
                          )}
                        </div>
                        {d.gateway_order_id && (
                          <div className="text-[10px] text-amber-700 font-mono font-semibold">
                            Gateway ID: #{d.gateway_order_id}
                          </div>
                        )}
                        {d.redirect_url && (
                          <a
                            href={d.redirect_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:underline block truncate max-w-[200px]"
                            title="Open Gateway Checkout Page"
                          >
                            View Gateway Form &rarr;
                          </a>
                        )}
                        {d.transaction_proof && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Proof: {d.transaction_proof}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono font-extrabold text-slate-900">
                        ${d.paid_amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            d.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : d.status === 'Rejected'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                        {d.created_at}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {d.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleAction(d.id, 'approve')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(d.id, 'reject')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-700 rounded-lg text-xs font-bold transition border border-slate-200"
                            >
                              Reject
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
    </div>
  );
}
