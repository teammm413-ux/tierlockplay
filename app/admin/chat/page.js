'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { playNotificationSound } from '@/lib/sound';
import {
  MessageSquare,
  Search,
  Send,
  User,
  ArrowLeft,
  CheckCheck,
  Phone,
  Mail,
  Wallet,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  PlusCircle
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
  const lastActiveMsgIdRef = useRef(null);

  // Load conversations list with search
  const loadConversations = async () => {
    try {
      const url = `/api/admin/chat?search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        // On desktop, auto-select first conversation if none selected
        if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
          setSelectedUserId((prev) => {
            if (!prev && data.conversations?.length > 0 && !initialUserId) {
              return data.conversations[0].id;
            }
            return prev;
          });
        }
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
        const msgs = data.messages || [];
        if (msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (
            lastActiveMsgIdRef.current !== null &&
            lastActiveMsgIdRef.current !== lastMsg.id &&
            lastMsg.sender_type === 'user'
          ) {
            playNotificationSound('admin_request');
          }
          lastActiveMsgIdRef.current = lastMsg.id;
        }
        setMessages(msgs);
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
    lastActiveMsgIdRef.current = null;
    if (selectedUserId) {
      loadMessages(selectedUserId);
      const interval = setInterval(() => loadMessages(selectedUserId), 3000);
      return () => clearInterval(interval);
    } else {
      setActiveUser(null);
      setMessages([]);
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

  const handleSelectConversation = (cId) => {
    setSelectedUserId(cId);
    loadMessages(cId);
  };

  const handleBackToConversations = () => {
    setSelectedUserId(null);
    setActiveUser(null);
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col h-screen overflow-hidden pt-16 lg:pt-6">
        {/* Top Header */}
        <div className="pb-3 border-b border-white/10 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFCC00]" />
              <span>Live WhatsApp Support Desk</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Instant player chat support with live mobile responsiveness and direct player lookup.
            </p>
          </div>
        </div>

        {/* WhatsApp Mobile & Desktop Responsive Container */}
        <div className="flex-1 mt-3 bg-[#101117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex relative">
          {/* Left Pane: Conversations & Player Search (hidden on mobile if a chat is active) */}
          <div
            className={`w-full lg:w-84 xl:w-96 border-r border-white/10 bg-[#0c0d12] flex flex-col shrink-0 ${
              selectedUserId ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Search Box */}
            <div className="p-3 border-b border-white/10 bg-[#14151e]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player username or email..."
                  className="w-full bg-[#07080b] border border-white/10 text-white text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <User className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
                  <p>No players found matching &ldquo;{searchQuery}&rdquo;</p>
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = String(c.id) === String(selectedUserId);
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#FFCC00]/10 border-l-4 border-[#FFCC00]'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                          {c.username ? c.username[0].toUpperCase() : 'U'}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                            <span>{c.username}</span>
                            <span className="text-[10px] text-[#FFCC00] font-mono bg-[#FFCC00]/10 px-1.5 py-0.2 rounded border border-[#FFCC00]/20">
                              ${Number(c.wallet_balance || 0).toFixed(0)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {c.last_message || (
                              <span className="text-slate-500 italic">No messages yet • Start chat</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {c.unread_count > 0 ? (
                        <span className="bg-rose-500 text-white text-[10px] font-black rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse">
                          {c.unread_count}
                        </span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

            {/* Right Pane: WhatsApp Chat Thread (Hidden on mobile if NO chat is selected) */}
          <div
            className={`flex-1 flex flex-col bg-[#07080b] ${
              !selectedUserId ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {activeUser ? (
              <>
                {/* Active Chat Header with Back Button */}
                <div className="bg-[#14151e] border-b border-white/10 px-4 py-3 text-white flex items-center justify-between shrink-0 shadow-md">
                  <div className="flex items-center gap-3">
                    {/* WhatsApp Mobile Back Button */}
                    <button
                      onClick={handleBackToConversations}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 lg:hidden flex items-center gap-1 text-xs font-bold transition"
                      title="Back to conversations"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#FFCC00]" />
                      <span className="text-[11px]">Chats</span>
                    </button>

                    <div className="w-10 h-10 rounded-full bg-[#FFCC00] text-slate-950 flex items-center justify-center font-black text-base shadow-md">
                      {activeUser.username ? activeUser.username[0].toUpperCase() : 'U'}
                    </div>

                    <div>
                      <div className="font-bold text-sm flex items-center gap-2 text-white">
                        <span>{activeUser.username}</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-slate-300">
                          Balance: ${Number(activeUser.wallet_balance || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                        {activeUser.email} {activeUser.phone ? `• ${activeUser.phone}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {activeUser.account_status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Messages Container */}
                <div
                  className="flex-1 p-4 overflow-y-auto space-y-3"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 204, 0, 0.03) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                >
                  <div className="text-center my-2">
                    <span className="text-[10px] bg-[#14151e] text-[#FFCC00] px-3 py-1 rounded-full border border-white/10 shadow-sm font-bold uppercase tracking-wider">
                      Chatting with {activeUser.username}
                    </span>
                  </div>

                  {messages.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-xs space-y-2">
                      <Sparkles className="w-8 h-8 text-[#FFCC00]/40 mx-auto" />
                      <p>No messages yet in this conversation.</p>
                      <p className="text-[11px] text-slate-600">
                        Type a message below to start live support with this player.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.sender_type === 'admin';
                      return (
                        <div
                          key={m.id || m._id}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs shadow-md ${
                              isAdmin
                                ? 'bg-[#FFCC00] text-slate-950 font-medium rounded-tr-none'
                                : 'bg-[#181922] text-slate-100 border border-white/10 rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                            <div
                              className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                                isAdmin ? 'text-slate-800 font-semibold' : 'text-slate-500'
                              }`}
                            >
                              <span>
                                {m.created_at
                                  ? new Date(m.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : ''}
                              </span>
                              {isAdmin && (
                                <CheckCheck
                                  className={`w-3.5 h-3.5 ${
                                    m.is_read_by_user ? 'text-blue-700' : 'text-slate-800'
                                  }`}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-[#14151e] border-t border-white/10 flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Message ${activeUser.username}...`}
                    className="flex-1 bg-[#07080b] border border-white/10 text-white text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSending}
                    className="px-5 py-3 bg-[#FFCC00] hover:bg-yellow-300 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-[0_4px_15px_rgba(255,204,0,0.3)] shrink-0"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FFCC00]">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">No Conversation Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Select any conversation from the list or search for any player by username or email to start messaging.
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
    <Suspense fallback={<div className="min-h-screen bg-[#07080b] text-white p-8">Loading Chat...</div>}>
      <AdminChatContent />
    </Suspense>
  );
}
