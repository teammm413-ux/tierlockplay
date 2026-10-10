'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Gamepad2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  Sliders,
  Upload,
  Loader2
} from 'lucide-react';

const PRESET_LOGOS = [
  { label: 'Juwa', value: '/images/games/juwa.jpg' },
  { label: 'Juwa 2.0', value: '/images/games/juwa-2.jpg' },
  { label: 'Fire Kirin', value: '/images/games/fire-kirin.jpg' },
  { label: 'Orion Stars', value: '/images/games/orion-stars.jpg' },
  { label: 'Panda Master', value: '/images/games/panda-master.jpg' },
  { label: 'Ultra Panda', value: '/images/games/ultra-panda.jpg' },
  { label: 'Game Vault', value: '/images/games/game-vault.jpg' },
  { label: 'Milky Way', value: '/images/games/milky-way.jpg' },
  { label: 'Golden Dragon', value: '/images/games/golden-dragon.jpg' },
];

export default function AdminGamesPage() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, logo_url: data.url }));
        setStatusMessage('Image uploaded successfully!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setErrorMessage(data.message || 'Image upload failed');
      }
    } catch (err) {
      setErrorMessage('Network error during image upload');
    } finally {
      setIsUploading(false);
    }
  };

  const [form, setForm] = useState({
    name: '',
    slug: '',
    download_url: '',
    logo_url: '/images/games/juwa.jpg',
    tagline: '',
    category: 'Fish & Slots',
    min_deposit: 10,
    rtp: '97.0%',
    is_active: true
  });

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/games?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setGames(data.games || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingGame(null);
    setForm({
      name: '',
      slug: '',
      download_url: '',
      logo_url: '/images/games/juwa.jpg',
      tagline: '',
      category: 'Fish & Slots',
      min_deposit: 10,
      rtp: '97.0%',
      is_active: true
    });
    setErrorMessage('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (game) => {
    setEditingGame(game);
    setForm({
      name: game.name,
      slug: game.slug,
      download_url: game.download_url,
      logo_url: game.logo_url,
      tagline: game.tagline || '',
      category: game.category || 'Fish & Slots',
      min_deposit: game.min_deposit || 10,
      rtp: game.rtp || '97.0%',
      is_active: game.is_active
    });
    setErrorMessage('');
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const method = editingGame ? 'PUT' : 'POST';
      const bodyPayload = editingGame ? { ...form, id: editingGame.id || editingGame._id } : form;

      const res = await fetch('/api/admin/games', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage(editingGame ? 'Game platform updated successfully!' : 'New game platform added!');
        setShowAddModal(false);
        fetchGames();
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        setErrorMessage(data.message || 'Error saving platform');
      }
    } catch (err) {
      setErrorMessage('Network error saving game platform');
    }
  };

  const handleToggleStatus = async (game) => {
    const nextStatus = !game.is_active;
    const gameId = game.id || game._id;

    // Optimistic UI update for instantaneous switch feel
    setGames((prev) =>
      prev.map((g) => ((g.id === gameId || g._id === gameId) ? { ...g, is_active: nextStatus } : g))
    );

    try {
      const res = await fetch('/api/admin/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gameId, is_active: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Game "${game.name}" is now ${nextStatus ? 'ON (Available to players)' : 'OFF (Hidden from players)'}`);
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        // Rollback on failure
        fetchGames();
        setErrorMessage(data.message || 'Failed to update status');
      }
    } catch (err) {
      fetchGames();
      setErrorMessage('Network error toggling status');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete platform "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/games?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Platform "${name}" deleted`);
        fetchGames();
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto pt-16 lg:pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-[#FFCC00]" />
              <span>Game Platforms Management</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Add, update, or remove supported sweepstakes games. Real images, RTPs, and download links will be displayed to players.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-yellow-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Game</span>
            </button>
            <button
              onClick={fetchGames}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition"
              title="Refresh List"
            >
              <RefreshCw className="w-4 h-4 text-[#FFCC00]" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Search Bar & Quick Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#101117] p-4 rounded-2xl border border-white/10 shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by game name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#07080b] border border-white/10 pl-10 pr-4 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Total Platforms:</span>
            <span className="bg-white/10 text-[#FFCC00] px-2.5 py-0.5 rounded-full font-bold border border-white/10">
              {games.length}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">
              {games.filter(g => g.is_active).length} Active
            </span>
          </div>
        </div>

        {/* Games Table */}
        <div className="bg-[#101117] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181922] text-slate-300 uppercase tracking-wider font-bold text-[11px] border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5 w-12">#</th>
                  <th className="px-5 py-3.5">Logo</th>
                  <th className="px-5 py-3.5">Platform Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Download URL</th>
                  <th className="px-5 py-3.5">Min Dep</th>
                  <th className="px-5 py-3.5">RTP</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FFCC00]" />
                      Loading game platforms...
                    </td>
                  </tr>
                ) : games.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-slate-500">
                      No game platforms found. Click &quot;Add New Game&quot; above to create one.
                    </td>
                  </tr>
                ) : (
                  games.map((game, idx) => (
                    <tr key={game.id} className="hover:bg-white/[0.03] transition">
                      <td className="px-5 py-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-white/10 flex items-center justify-center shadow-md">
                          {game.logo_url && game.logo_url.startsWith('/') ? (
                            <img
                              src={game.logo_url}
                              alt={game.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/images/games/juwa.jpg';
                              }}
                            />
                          ) : (
                            <span className="text-2xl">{game.logo_url || '🎰'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{game.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{game.tagline || 'Sweepstakes Arcade'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">slug: {game.slug}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-white/5 text-slate-300 px-2.5 py-1 rounded-md text-[11px] border border-white/10 font-medium">
                          {game.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={game.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FFCC00] hover:underline flex items-center gap-1 max-w-[180px] truncate text-[11px] font-medium"
                        >
                          <span className="truncate">{game.download_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="px-5 py-4 font-mono font-black text-emerald-400">
                        ${game.min_deposit || 10}
                      </td>
                      <td className="px-5 py-4 font-mono text-[#FFCC00] font-black">
                        {game.rtp || '96.5%'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(game)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer border ${
                            game.is_active
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-sm'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                          }`}
                          title={game.is_active ? 'Game is ON (Visible to players) - Click to turn OFF' : 'Game is OFF (Hidden from players) - Click to turn ON'}
                        >
                          {/* Toggle switch visual */}
                          <span
                            className={`relative inline-block w-8 h-4.5 rounded-full transition-colors duration-200 ease-in-out ${
                              game.is_active ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                          >
                            <span
                              className={`inline-block w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out mt-0.5 ${
                                game.is_active ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </span>
                          <span className="tracking-wide">{game.is_active ? 'ON' : 'OFF'}</span>
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(game)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
                            title="Edit Platform"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(game.id, game.name)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                            title="Delete Platform"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#101117] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn text-white">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-[#FFCC00]" />
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    {editingGame ? `Edit Game: ${editingGame.name}` : 'Add New Game Platform'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Game Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juwa, Game Vault"
                      value={form.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          name: val,
                          slug: editingGame ? form.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Slug / Identifier</label>
                    <input
                      type="text"
                      placeholder="e.g. juwa-777"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Download APK / Web URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://dl.juwa777.com/ or https://m.gamevault.com"
                    value={form.download_url}
                    onChange={(e) => setForm({ ...form, download_url: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Game Logo / Artwork * (Upload File from PC or Enter Path)
                  </label>
                  
                  {/* File Upload Selector and Live Preview */}
                  <div className="flex items-center gap-3 mb-2.5">
                    <label className="flex-1 cursor-pointer">
                      <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-3 text-center transition bg-slate-50 hover:bg-amber-50/50 flex items-center justify-center gap-2">
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                            <span className="text-xs font-bold text-amber-700">Uploading Image...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-bold text-slate-700">Upload Image File (PNG, JPG, WebP)</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>

                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      {form.logo_url && form.logo_url.startsWith('/') ? (
                        <img src={form.logo_url} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{form.logo_url || '🎰'}</span>
                      )}
                    </div>
                  </div>

                  {/* Path / URL input */}
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      type="text"
                      placeholder="/uploads/games/... or /images/games/juwa.jpg"
                      value={form.logo_url}
                      onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_LOGOS.map((preset) => (
                      <button
                        type="button"
                        key={preset.value}
                        onClick={() => setForm({ ...form, logo_url: preset.value })}
                        className={`text-[10px] px-2 py-1 rounded-md border transition font-medium ${
                          form.logo_url === preset.value
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    >
                      <option value="Fish & Slots">Fish & Slots</option>
                      <option value="Fish Hunter">Fish Hunter</option>
                      <option value="Video Slots">Video Slots</option>
                      <option value="Classic Slots">Classic Slots</option>
                      <option value="Arcade & Wheel">Arcade & Wheel</option>
                      <option value="Table Games">Table Games</option>
                      <option value="Cyber Arcade">Cyber Arcade</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Min Deposit ($)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.min_deposit}
                      onChange={(e) => setForm({ ...form, min_deposit: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">RTP (%)</label>
                    <input
                      type="text"
                      value={form.rtp}
                      onChange={(e) => setForm({ ...form, rtp: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tagline / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. The legendary dragon slots & fish shooter arcade"
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div className="bg-[#181922] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Platform Status:</span>
                      <span className={form.is_active ? 'text-emerald-400' : 'text-rose-400'}>
                        {form.is_active ? 'ON (Active & Available)' : 'OFF (Hidden & Offline)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {form.is_active
                        ? 'Players can view, download, and request credits for this game.'
                        : 'Platform will be hidden from players and requests will be blocked.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      form.is_active ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        form.is_active ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95"
                  >
                    {editingGame ? 'Save Changes' : 'Create Platform'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
