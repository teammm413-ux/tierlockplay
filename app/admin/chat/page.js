'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import {
  MessageSquare,
  Search,
  Send,
  User,
  CheckCheck,
  Sparkles,
  Phone,
  Mail,
  Wallet,
  Clock
} from 'lucide-react';

function AdminChatContent() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId || null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations list or search
  const loadConversations = async () => {
    try {
      const url = `/api/admin/chat?search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        // If no user selected yet, select first
        setSelectedUserId((prev) => {
          if (!prev && data.conversations?.length > 0 && !initialUserId) {
            return data.conversations[0].id;
          }
          return prev;
        });
      }
    } catch (err) {}
  };

  // Load messages for selected user
  const loadMessages = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/admin/chat?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setActiveUser(data.user || null);
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 3000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
      const interval = setInterval(() => loadMessages(selectedUserId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUserId || isSending) return;

    const text = replyText.trim();
    setReplyText('');
    setIsSending(true);

    // Optimistic message
    const tempMsg = {
      id: Date.now(),
      sender_type: 'admin',
      sender_name: 'You (Admin)',
      message: text,
      created_at: new Date().toISOString(),
      is_read_by_user: false,
      is_read_by_admin: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, message: text }),
      });
      const data = await res.json();
      if (data.success) {
        loadMessages(selectedUserId);
        loadConversations();
      }
    } catch (err) {} finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200 shrink-0">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <span>WhatsApp Live Support Desk</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search any player by username or email and initiate real-time conversations. Players receive an instant notification banner upon entering the site.
          </p>
        </div>

        {/* WhatsApp 2-Pane Container */}
        <div className="flex-1 mt-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl flex">
          {/* Left Pane: Conversations & Player Search */}
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
            {/* Search Box (by username or email) */}
            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player username or email..."
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 placeholder-slate-400 transition"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No players found matching '{searchQuery}'
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = String(c.id) === String(selectedUserId);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedUserId(c.id);
                        loadMessages(c.id);
                      }}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                        isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                          {c.username ? c.username[0].toUpperCase() : 'U'}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span>{c.username}</span>
                            <span className="text-[10px] text-slate-500 font-mono">(${c.wallet_balance.toFixed(0)})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {c.last_message || c.email}
                          </div>
                        </div>
                      </div>

                      {c.unread_count > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shrink-0 shadow-sm">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: WhatsApp Chat Thread */}
          <div className="flex-1 flex flex-col bg-[#efeae2]">
            {activeUser ? (
              <>
                {/* Active Chat Header */}
                <div className="bg-[#008069] px-4 py-3 text-white flex items-center justify-between shrink-0 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white text-emerald-800 flex items-center justify-center font-black text-lg border-2 border-emerald-200 shadow-sm">
                      {activeUser.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2 text-white">
                        <span>{activeUser.username}</span>
                        <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded font-mono text-emerald-100">
                          ID: #{activeUser.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-100 font-mono">
                        {activeUser.email} • {activeUser.phone || 'No phone'} • Balance: ${activeUser.wallet_balance.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] bg-emerald-900/40 text-emerald-100 font-bold px-2 py-1 rounded uppercase">
                      Player Status: {activeUser.account_status}
                    </span>
                  </div>
                </div>

                {/* Messages Container with WhatsApp Pattern */}
                <div
                  className="flex-1 p-4 overflow-y-auto space-y-3"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  <div className="text-center my-2">
                    <span className="text-[10px] bg-white/90 text-slate-600 px-3 py-1 rounded-md shadow-sm border border-slate-200/50">
                      MESSAGING PLAYER: {activeUser.username.toUpperCase()}
                    </span>
                  </div>

                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No chat messages yet with this player. Type below to initiate live support!
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.sender_type === 'admin';
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-lg px-3.5 py-2 text-xs relative shadow-sm ${
                              isAdmin
                                ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none border border-emerald-200/40'
                                : 'bg-white text-[#111b21] rounded-tl-none border border-slate-200/60'
                            }`}
                          >
                            <div className="text-[10px] font-bold text-emerald-800 mb-0.5">
                              {isAdmin ? 'Vegas Vault Desk (You)' : m.sender_name}
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed break-words">{m.message}</p>
                            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#667781]">
                              <span>{m.created_at ? m.created_at.substring(11, 16) : ''}</span>
                              {isAdmin && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="bg-[#f0f2f5] p-3 flex items-center gap-2 border-t border-slate-200 shrink-0"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Message ${activeUser.username}... (User will get banner on website)`}
                    className="flex-1 bg-white text-slate-900 text-xs px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="w-10 h-10 rounded-xl bg-[#00a884] hover:bg-[#008f72] disabled:opacity-50 text-white flex items-center justify-center transition shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs bg-slate-50">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-bold text-slate-700 text-sm">Select a Player to Chat</p>
                <p className="max-w-xs mt-1 text-slate-500">
                  Use the left search bar to find any user by username or email and start a 1-on-1 conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-500 font-sans">Loading live chat desk...</div>}>
      <AdminChatContent />
    </Suspense>
  );
}
