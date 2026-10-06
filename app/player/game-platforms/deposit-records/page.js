'use client';

import React, { useState, useEffect } from 'react';
import PlayerHeader from '@/components/PlayerHeader';
import Sidebar from '@/components/Sidebar';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import { Calendar, Copy, Check } from 'lucide-react';

export default function GameDepositRecordsPage() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [dateFrom, setDateFrom] = useState('2026-10-01');
  const [dateTo, setDateTo] = useState('2026-10-02');
  const [status, setStatus] = useState('All');
  const [platform, setPlatform] = useState('All');
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
      params.append('type', 'Deposit');
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (status !== 'All') params.append('status', status);
      if (platform !== 'All') params.append('platform', platform);
      if (orderNo.trim()) params.append('orderNo', orderNo.trim());

      const res = await fetch(`/api/games/records?${params.toString()}`);
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
    setStatus('All');
    setPlatform('All');
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
            Game Platform Deposit Records
          </h1>

          {/* Filter Bar (matching Screenshot 12 & 13) */}
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

              {/* Status */}
              <div className="relative flex-1 min-w-[140px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Game Platform */}
              <div className="relative flex-1 min-w-[140px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Game Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Juwa">JUWA</option>
                  <option value="Orion Stars">Orion Stars</option>
                  <option value="Fire Kirin">Fire Kirin</option>
                  <option value="Milky Way">Milky Way</option>
                  <option value="Panda Master">Panda Master</option>
                  <option value="Ultra Panda">Ultra Panda</option>
                  <option value="Golden Dragon">Golden Dragon</option>
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

              {/* Buttons */}
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

          {/* Table (matching Screenshot 12 & 13) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500 tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="py-3.5 px-4">USERNAME</th>
                    <th className="py-3.5 px-4">ORDER NO</th>
                    <th className="py-3.5 px-4">GAME PLATFORM</th>
                    <th className="py-3.5 px-4">GAME ACCOUNT</th>
                    <th className="py-3.5 px-4">AMOUNT</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4">FAILURE REASON</th>
                    <th className="py-3.5 px-4">WALLET BALANCE BEFORE</th>
                    <th className="py-3.5 px-4">WALLET BALANCE AFTER</th>
                    <th className="py-3.5 px-4">CREATION TIME</th>
                    <th className="py-3.5 px-4">OPERATION TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-slate-400">
                        {isLoading ? 'Loading records...' : 'No records found'}
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
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
                        <td className="py-4 px-4 font-medium text-slate-800">{r.platform_name}</td>
                        <td className="py-4 px-4 font-mono text-slate-700">{r.game_account}</td>
                        <td className="py-4 px-4 font-bold text-slate-900">${Number(r.amount).toFixed(2)}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold inline-block bg-emerald-600 text-white">
                            {r.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[11px]">{r.failure_reason || '-'}</td>
                        <td className="py-4 px-4 text-slate-600">{Number(r.wallet_balance_before).toFixed(2)}</td>
                        <td className="py-4 px-4 text-slate-600">{Number(r.wallet_balance_after).toFixed(2)}</td>
                        <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{r.created_at}</td>
                        <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{r.operation_time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-slate-500 text-xs">
                <select className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-700">
                  <option>20 / page</option>
                  <option>50 / page</option>
                  <option>100 / page</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
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
