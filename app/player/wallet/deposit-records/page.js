'use client';

import React, { useState, useEffect } from 'react';
import PlayerHeader from '@/components/PlayerHeader';
import Sidebar from '@/components/Sidebar';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import { Calendar, Copy, Check } from 'lucide-react';

export default function DepositRecordsPage() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [dateFrom, setDateFrom] = useState('2026-10-01');
  const [dateTo, setDateTo] = useState('2026-10-02');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [status, setStatus] = useState('All');
  const [orderNo, setOrderNo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) setUser(data.user);
    } catch (err) {}
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (paymentMethod !== 'All') params.append('paymentMethod', paymentMethod);
      if (status !== 'All') params.append('status', status);
      if (orderNo.trim()) params.append('orderNo', orderNo.trim());

      const res = await fetch(`/api/wallet/deposit-records?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
    fetchRecords();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleReset = () => {
    setDateFrom('2026-10-01');
    setDateTo('2026-10-02');
    setPaymentMethod('All');
    setStatus('All');
    setOrderNo('');
    setTimeout(fetchRecords, 50);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 flex">
      {/* Left Sidebar */}
      <Sidebar user={user} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <PlayerHeader
          user={user}
          onOpenChat={() => setIsChatOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Page Title */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Wallet Deposit Records
          </h1>

          {/* Filter Bar (matching Screenshot 11) */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/90">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date From */}
              <div className="relative flex-1 min-w-[150px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Date From</label>
                <div className="relative flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white">
                  <input
                    type="text"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </div>
              </div>

              {/* Date To */}
              <div className="relative flex-1 min-w-[150px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Date To</label>
                <div className="relative flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white">
                  <input
                    type="text"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full text-xs text-slate-800 bg-transparent focus:outline-none"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </div>
              </div>

              {/* Payment Method */}
              <div className="relative flex-1 min-w-[140px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Cash App">Cash App</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Google Pay">Google Pay</option>
                </select>
              </div>

              {/* Status */}
              <div className="relative flex-1 min-w-[140px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Created">Created</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              {/* Order No */}
              <div className="relative flex-1 min-w-[160px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">&nbsp;</label>
                <input
                  type="text"
                  placeholder="Order No"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none placeholder-slate-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 sm:mt-auto">
                <button
                  type="submit"
                  className="bg-[#1a304e] hover:bg-[#132238] text-white text-xs font-bold px-6 py-2 rounded-lg transition"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-5 py-2 rounded-lg transition"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>

          {/* Table Container (matching Screenshot 11) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">USERNAME</th>
                    <th className="py-3.5 px-4">ORDER NO</th>
                    <th className="py-3.5 px-4">PAYMENT METHOD</th>
                    <th className="py-3.5 px-4">PAID</th>
                    <th className="py-3.5 px-4">RECEIVED</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4">WALLET BALANCE BEFORE</th>
                    <th className="py-3.5 px-4">WALLET BALANCE AFTER</th>
                    <th className="py-3.5 px-4">CREATION TIME</th>
                    <th className="py-3.5 px-4">OPERATION TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-400">
                        {isLoading ? 'Loading records...' : 'No records found'}
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => {
                      const isCreated = r.status === 'Created';
                      const isApproved = r.status === 'Approved';
                      const isPending = r.status === 'Pending';
                      const isRejected = r.status === 'Rejected';
                      const isExpired = r.status === 'Expired';

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-4 font-semibold text-slate-800">{r.username}</td>
                          <td className="py-4 px-4 font-mono font-medium text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <span>{r.order_no}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(r.order_no, r.id)}
                                title="Copy Order Number"
                                className="text-slate-400 hover:text-slate-600 transition"
                              >
                                {copiedId === r.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[10px] text-slate-400 block">NnPay</span>
                            <span className="font-medium text-slate-800">{r.payment_method}</span>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-900">${Number(r.paid_amount).toFixed(2)}</td>
                          <td className="py-4 px-4 font-bold text-emerald-600 font-mono text-sm">
                            {Number(r.received_amount).toFixed(0)}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-bold inline-block text-white ${
                                isApproved
                                  ? 'bg-emerald-600'
                                  : isRejected
                                  ? 'bg-red-500'
                                  : isExpired
                                  ? 'bg-slate-400'
                                  : isCreated
                                  ? 'bg-amber-600'
                                  : 'bg-blue-600'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-600">{Number(r.wallet_balance_before).toFixed(0)}</td>
                          <td className="py-4 px-4 text-slate-600">{Number(r.wallet_balance_after).toFixed(0)}</td>
                          <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{r.created_at}</td>
                          <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{r.operation_time}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-1.5 text-xs">
              <button
                type="button"
                disabled
                className="w-7 h-7 rounded border border-slate-200 bg-slate-50 text-slate-400 flex items-center justify-center cursor-not-allowed text-[11px]"
              >
                &lt;
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded bg-[#1a304e] text-white font-bold flex items-center justify-center text-[11px]"
              >
                1
              </button>
              <button
                type="button"
                disabled
                className="w-7 h-7 rounded border border-slate-200 bg-slate-50 text-slate-400 flex items-center justify-center cursor-not-allowed text-[11px]"
              >
                &gt;
              </button>
            </div>
          </div>
        </main>
      </div>

      <FreeplayModal onBonusClaimed={(newBal) => setUser((prev) => ({ ...prev, wallet_balance: newBal }))} />
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />
    </div>
  );
}
