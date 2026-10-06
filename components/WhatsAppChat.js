'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, CheckCheck, Smile, Paperclip, ChevronRight, Bell, Sparkles } from 'lucide-react';

export default function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [bannerAlert, setBannerAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Check unread messages on mount and every 10 seconds
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
                  setIsOpen(true);
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

      {/* 2. Floating WhatsApp Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setBannerAlert(null);
            }
          }}
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(37,211,102,0.45)] transform hover:scale-105 transition-all duration-300 group"
          aria-label="Open Live Chat Support"
        >
          {/* Glowing pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping group-hover:opacity-100 opacity-75"></span>

          {isOpen ? (
            <X className="w-6 h-6 relative z-10" />
          ) : (
            <svg
              className="w-7 h-7 relative z-10 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12.031 2C6.496 2 2 6.496 2 12.031c0 1.954.557 3.784 1.523 5.341L2 22l4.802-1.503a9.988 9.988 0 005.229 1.534C17.566 22 22 17.504 22 12.031 22 6.496 17.566 2 12.031 2zm5.792 14.179c-.243.682-1.228 1.251-1.71 1.293-.456.04-1.043.064-3.376-.902-2.981-1.233-4.9-4.249-5.048-4.447-.148-.198-1.205-1.605-1.205-3.061 0-1.456.764-2.172 1.036-2.469.272-.297.594-.371.792-.371.198 0 .396.002.569.01.185.008.433-.07.677.518.248.594.842 2.052.916 2.201.074.148.124.322.025.518-.099.198-.148.322-.297.495-.148.173-.312.386-.445.518-.148.148-.303.309-.13.606.173.297.771 1.272 1.654 2.058 1.135 1.011 2.091 1.324 2.388 1.472.297.148.47.124.643-.074.173-.198.742-.866.94-1.163.198-.297.396-.248.668-.148.272.099 1.733.817 2.03 1.015.297.198.495.297.569.421.074.124.074.718-.169 1.4z" />
            </svg>
          )}

          {/* Unread badge */}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-black rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center border-2 border-[#090d16] animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. WhatsApp Chat Box Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-120px)] bg-[#121b22] border border-[#2a3942] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                  <span>Vegas Vault Desk</span>
                  <span className="text-[10px] bg-emerald-700/60 px-1.5 py-0.5 rounded text-emerald-200 uppercase font-semibold">Live</span>
                </div>
                <div className="text-[11px] text-emerald-100/80">Online 24/7 | Fast Payouts</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
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
            {/* Timestamp Notice */}
            <div className="text-center my-2">
              <span className="text-[10px] bg-[#182229] text-[#8696a0] px-3 py-1 rounded-md shadow-sm">
                TODAY • END-TO-END ENCRYPTED
              </span>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-10 text-[#8696a0] text-xs space-y-2">
                <p>Welcome to Vegas Vault Casino Live Support!</p>
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
