'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, CheckCheck, Bell, ChevronRight, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { playNotificationSound } from '@/lib/sound';

export default function WhatsAppChat({ isOpen: controlledIsOpen, onClose, user }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = Boolean(controlledIsOpen || internalIsOpen);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [bannerAlert, setBannerAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const lastNotifiedMsgRef = useRef('');

  const handleOpen = () => {
    setInternalIsOpen(true);
  };

  const handleClose = () => {
    setInternalIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Listen for global open chat event dispatched by PlayerHeader Support button
  useEffect(() => {
    const handleOpenChat = () => {
      handleOpen();
    };
    window.addEventListener('open-chat-support', handleOpenChat);
    return () => window.removeEventListener('open-chat-support', handleOpenChat);
  }, []);

  // Check unread messages on mount and periodically
  const checkUnread = async () => {
    try {
      const res = await fetch('/api/chat/unread');
      const data = await res.json();
      if (data.success && data.hasUnread) {
        setUnreadCount(data.count);
        // Play notification sound & display toast if user hasn't opened chat
        if (!isOpen) {
          const msgKey = `${data.count}_${data.latestMessage}`;
          if (lastNotifiedMsgRef.current !== msgKey) {
            lastNotifiedMsgRef.current = msgKey;
            playNotificationSound('user_message');
          }
          setBannerAlert({
            count: data.count,
            message: data.latestMessage,
            sender: data.senderName || 'Live Support Agent',
          });
        }
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      // ignore
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/chat/messages');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setUnreadCount(0);
        setBannerAlert(null); // Clear banner when chat opened
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkUnread();
    const interval = setInterval(checkUnread, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const text = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    // Optimistic user message
    const tempMsg = {
      id: Date.now(),
      sender_type: 'user',
      sender_name: user?.username || 'You',
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.success) {
        loadMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. Sleek Floating Toast Card if Admin messaged user and chat is not open */}
      {bannerAlert && !isOpen && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-32px)] sm:w-96 bg-[#0c1319]/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            {/* Live Agent Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg border border-emerald-300/30">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0c1319] rounded-full animate-ping"></span>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0c1319] rounded-full"></span>
            </div>

            {/* Message Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {bannerAlert.sender}
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-full font-semibold border border-emerald-500/30">
                    Support
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBannerAlert(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-white/[0.03] p-2 rounded-lg border border-white/5">
                "{bannerAlert.message}"
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                <span className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  New Message
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleOpen();
                    setBannerAlert(null);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-3 py-1.5 rounded-full text-[11px] transition shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <span>Reply</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Humanized Live Chat Desk Modal (Triggered via Header Support button) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-100px)] bg-[#121b22] border border-[#2a3942] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
          {/* Header with Human Support Representative Theme */}
          <div className="bg-[#005c4b] px-4 py-3 text-white flex items-center justify-between shadow-md select-none">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base border-2 border-emerald-400/50 shadow-inner">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#005c4b] rounded-full"></span>
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-2">
                  <span>Live Human Support</span>
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                  </span>
                </div>
                <div className="text-[11px] text-emerald-100/80">Direct Human Representative • 24/7</div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              title="Close Support Desk"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Real Human Support Notice Bar */}
          <div className="bg-[#1f2c34] px-3.5 py-1.5 border-b border-[#2a3942] flex items-center gap-2 text-[11px] text-slate-300 select-none">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>You are speaking with a dedicated customer care agent.</span>
          </div>

          {/* Messages Area */}
          <div
            className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a]"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(32, 44, 51, 0.4) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-12 text-[#8696a0] text-xs space-y-2 select-none">
                <div className="w-12 h-12 rounded-full bg-[#182229] mx-auto flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="font-bold text-white text-sm">Welcome to Live Support!</p>
                <p className="max-w-[240px] mx-auto text-[#94a3b8]">
                  How can our live support team assist you with your deposits, withdrawals, or games today?
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.sender_type === 'user';
                return (
                  <div
                    key={m.id || idx}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3.5 py-2 text-xs relative shadow-sm ${
                        isUser
                          ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                          : 'bg-[#202c33] text-[#d1d7db] rounded-tl-none border border-[#2a3942]'
                      }`}
                    >
                      {!isUser && (
                        <div className="text-[10px] font-bold text-emerald-400 mb-0.5 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>{m.sender_name || 'Support Agent'}</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed break-words">{m.message}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#8696a0]">
                        <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        {isUser && <CheckCheck className="w-3 h-3 text-[#53bdeb]" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSend}
            className="bg-[#202c33] p-2.5 flex items-center gap-2 border-t border-[#2a3942]"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message to support..."
              className="flex-1 bg-[#2a3942] text-[#d1d7db] text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-[#8696a0]"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f72] disabled:opacity-40 text-white flex items-center justify-center transition shadow cursor-pointer"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
