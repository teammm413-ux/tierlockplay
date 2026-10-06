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
  Sliders
} from 'lucide-react';

const PRESET_LOGOS = [
  { label: 'Juwa 777 (Generated High-Res)', value: '/images/games/juwa.jpg' },
  { label: 'Fire Kirin Dragon (Generated High-Res)', value: '/images/games/fire-kirin.jpg' },
  { label: 'Orion Stars (Generated High-Res)', value: '/images/games/orion-stars.jpg' },
];

export default function AdminGamesPage() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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
    setStatusMessage('');

    try {
      const method = editingGame ? 'PUT' : 'POST';
      const payload = editingGame ? { ...form, id: editingGame.id } : form;

      const res = await fetch('/api/admin/games', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage(data.message);
        setShowAddModal(false);
        fetchGames();
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        setErrorMessage(data.message || 'Action failed');
      }
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleToggleStatus = async (game) => {
    try {
      const res = await fetch('/api/admin/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: game.id,
          is_active: !game.is_active
        })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Status for "${game.name}" changed to ${!game.is_active ? 'Active' : 'Inactive'}`);
        fetchGames();
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (game) => {
    if (!window.confirm(`Are you sure you want to delete "${game.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/games?id=${game.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message);
        fetchGames();
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-white flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>GAME PLATFORMS MANAGEMENT</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">
              Manage Game Platforms
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Add new sweepstakes platforms, configure download APK links, update artwork, and control player availability in real time via MongoDB.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Game</span>
            </button>
            <button
              onClick={fetchGames}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition"
              title="Refresh List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Search Bar & Quick Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0d1424] p-4 rounded-2xl border border-gray-800/80">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by game name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#121c32] border border-gray-700 pl-10 pr-4 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Total Platforms:</span>
            <span className="bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full font-bold border border-blue-500/30">
              {games.length}
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-emerald-400 font-bold">
              {games.filter(g => g.is_active).length} Active
            </span>
          </div>
        </div>

        {/* Games Table */}
        <div className="bg-[#0d1424] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121c32] text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800">
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
              <tbody className="divide-y divide-gray-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading game platforms from MongoDB...
                    </td>
                  </tr>
                ) : games.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-gray-500">
                      No game platforms found. Click "Add New Game" above to create one.
                    </td>
                  </tr>
                ) : (
                  games.map((game, idx) => (
                    <tr key={game.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 text-gray-500 font-mono">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden border border-gray-700 flex items-center justify-center shadow-md">
                          {game.logo_url && game.logo_url.startsWith('/') ? (
                            <img
                              src={game.logo_url}
                              alt={game.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">{game.logo_url || '🎰'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{game.name}</div>
                        <div className="text-[11px] text-gray-400 truncate max-w-xs">{game.tagline || 'Sweepstakes Arcade'}</div>
                        <div className="text-[10px] text-gray-500 font-mono">slug: {game.slug}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-gray-800/80 text-gray-300 px-2.5 py-1 rounded-md text-[11px] border border-gray-700">
                          {game.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={game.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 max-w-[180px] truncate underline text-[11px]"
                        >
                          <span className="truncate">{game.download_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                        ${game.min_deposit || 10}
                      </td>
                      <td className="px-5 py-4 font-mono text-amber-400 font-semibold">
                        {game.rtp || '96.5%'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(game)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 mx-auto ${
                            game.is_active
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                          }`}
                        >
                          {game.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(game)}
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg transition"
                            title="Edit Platform"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(game)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition"
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
            <div className="bg-[#0f172a] border border-gray-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">
                    {editingGame ? `Edit Game: ${editingGame.name}` : 'Add New Game Platform'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-xl">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Game Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Juwa, Fire Kirin, Game Vault"
                      value={form.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          name: val,
                          slug: editingGame ? form.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                        });
                      }}
                      className="w-full bg-[#182338] border border-gray-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Slug / Identifier</label>
                    <input
                      type="text"
                      placeholder="e.g. juwa-777"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="w-full bg-[#182338] border border-gray-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Download APK / Web URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://dl.juwa777.com/ or https://m.gamevault.com"
                    value={form.download_url}
                    onChange={(e) => setForm({ ...form, download_url: e.target.value })}
                    className="w-full bg-[#182338] border border-gray-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Logo / Artwork</label>
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      type="text"
                      placeholder="/images/games/juwa.jpg or any image URL"
                      value={form.logo_url}
                      onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                      className="flex-1 bg-[#182338] border border-gray-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {form.logo_url && form.logo_url.startsWith('/') ? (
                        <img src={form.logo_url} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{form.logo_url || '🎰'}</span>
                      )}
                    </div>
                  </div>
                  {/* Preset quick buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_LOGOS.map((preset) => (
                      <button
                        type="button"
                        key={preset.value}
                        onClick={() => setForm({ ...form, logo_url: preset.value })}
                        className={`text-[10px] px-2 py-1 rounded-md border transition ${
                          form.logo_url === preset.value
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500'
                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-[#182338] border border-gray-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
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
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Min Deposit ($)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.min_deposit}
                      onChange={(e) => setForm({ ...form, min_deposit: e.target.value })}
                      className="w-full bg-[#182338] border border-gray-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">RTP (%)</label>
                    <input
                      type="text"
                      value={form.rtp}
                      onChange={(e) => setForm({ ...form, rtp: e.target.value })}
                      className="w-full bg-[#182338] border border-gray-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">Tagline / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. The legendary dragon slots & fish shooter arcade"
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    className="w-full bg-[#182338] border border-gray-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-gray-800 border-gray-700"
                  />
                  <label htmlFor="is_active" className="text-xs text-gray-300 font-semibold cursor-pointer">
                    Enable game platform immediately for players
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
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
