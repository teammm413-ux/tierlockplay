'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, CheckCheck, Smile, Paperclip, ChevronRight, Bell, Sparkles } from 'lucide-react';

export default function WhatsAppChat({ isOpen: controlledIsOpen, onClose, user }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [bannerAlert, setBannerAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSetOpen = (val) => {
    setInternalIsOpen(val);
    if (!val && onClose) {
      onClose();
    }
  };

  // Listen for global open chat event dispatched by PlayerHeader
  useEffect(() => {
    const handleOpenChat = () => {
      handleSetOpen(true);
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
        // Display notification banner if user hasn't opened chat
        if (!isOpen) {
          setBannerAlert({
            count: data.count,
            message: data.latestMessage,
            sender: data.senderName || 'Admin Support',
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
    const interval = setInterval(checkUnread, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000);
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

    // Optimistic message
    const tempMsg = {
      id: Date.now(),
      sender_type: 'user',
      sender_name: 'You',
      message: text,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
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

  const handleQuickQuestion = (q) => {
    setNewMessage(q);
  };

  return (
    <>
      {/* 1. Prominent Top Alert Banner if Admin messaged user and chat is not open */}
      {bannerAlert && !isOpen && (
        <div className="fixed top-16 left-0 right-0 z-50 px-4 py-2 bg-gradient-to-r from-amber-600 via-emerald-600 to-amber-700 text-white shadow-2xl flex items-center justify-between animate-bounce-short">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <Bell className="w-4 h-4 text-amber-200" />
              </div>
              <div className="text-sm">
                <span className="font-bold text-amber-200">{bannerAlert.sender}: </span>
                <span className="text-white/90">"{bannerAlert.message}"</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleSetOpen(true);
                  setBannerAlert(null);
                }}
                className="bg-white text-emerald-900 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider hover:bg-amber-100 transition shadow-md flex items-center gap-1"
              >
                <span>Reply Now</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setBannerAlert(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. WhatsApp Chat Box Modal (No floating trigger button - opened via header Support button) */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-100px)] bg-[#121b22] border border-[#2a3942] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
          {/* Header */}
          <div className="bg-[#005c4b] px-4 py-3 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center font-black text-lg border-2 border-[#005c4b]">
                  🎰
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#005c4b] rounded-full"></span>
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span>Vegas Vault Support</span>
                  <span className="text-[10px] bg-emerald-700/60 px-1.5 py-0.5 rounded text-emerald-200 uppercase font-semibold">Live</span>
                </div>
                <div className="text-[11px] text-emerald-100/80">Online 24/7 | Fast Responses</div>
              </div>
            </div>
            <button
              onClick={() => handleSetOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Support Suggestions */}
          <div className="bg-[#0b141a] px-3 py-2 border-b border-[#202c33] flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
            <button
              onClick={() => handleQuickQuestion('Need help loading Juwa credits')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#1f2c34] hover:bg-[#2a3942] text-amber-300 text-[11px] font-medium transition flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Load Juwa
            </button>
            <button
              onClick={() => handleQuickQuestion('How to withdraw via Cash App?')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#1f2c34] hover:bg-[#2a3942] text-emerald-300 text-[11px] font-medium transition"
            >
              Withdraw Cash App
            </button>
            <button
              onClick={() => handleQuickQuestion('Please approve my deposit')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#1f2c34] hover:bg-[#2a3942] text-blue-300 text-[11px] font-medium transition"
            >
              Deposit Status
            </button>
          </div>

          {/* Messages Area with WhatsApp Doodle Vibe */}
          <div
            className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0b141a]"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(32, 44, 51, 0.4) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {messages.length === 0 ? (
              <div className="text-center py-12 text-[#8696a0] text-xs space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#182229] mx-auto flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="font-bold text-white text-sm">Welcome to Live Support!</p>
                <p>How can we assist you with your games or payouts today?</p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.sender_type === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-xs relative shadow-sm ${
                        isUser
                          ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                          : 'bg-[#202c33] text-[#d1d7db] rounded-tl-none border border-[#2a3942]'
                      }`}
                    >
                      {!isUser && (
                        <div className="text-[10px] font-bold text-amber-400 mb-0.5">
                          {m.sender_name || 'Vegas Vault Support'}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap leading-relaxed break-words">{m.message}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#8696a0]">
                        <span>{m.created_at ? m.created_at.substring(11, 16) : ''}</span>
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
            className="bg-[#202c33] p-2 flex items-center gap-2 border-t border-[#2a3942]"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-[#2a3942] text-[#d1d7db] text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-[#8696a0]"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f72] disabled:opacity-50 text-white flex items-center justify-center transition shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
