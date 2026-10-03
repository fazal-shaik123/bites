import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api.js';
import { Navbar } from '../components/Navbar.js';
import {
  Upload,
  Plus,
  Trash2,
  Calendar,
  Heart,
  Bell,
  Clock,
  Send,
  MoveUp,
  MoveDown,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'puzzles' | 'meals' | 'notes' | 'reminders'>('puzzles');

  // Puzzles state
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadGridSize, setUploadGridSize] = useState<number>(3);
  const [uploadReward, setUploadReward] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [tileNotes, setTileNotes] = useState<string[]>(Array(9).fill(''));
  const [isUploading, setIsUploading] = useState(false);

  // Meals & History state
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [mealHistory, setMealHistory] = useState<any[]>([]);
  const [mealConfigs, setMealConfigs] = useState<any[]>([]);

  // Love Notes state
  const [loveNotes, setLoveNotes] = useState<any[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteSchedule, setNewNoteSchedule] = useState('');

  // Reminders state
  const [reminders, setReminders] = useState<any[]>([]);
  const [newReminder, setNewReminder] = useState('');
  const [testPushMsg, setTestPushMsg] = useState('');
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      const [pRes, tRes, hRes, nRes, rRes, cRes] = await Promise.all([
        apiRequest<{ puzzles: any[] }>('/api/puzzles/queue'),
        apiRequest<{ meals: any[] }>('/api/meals/today'),
        apiRequest<{ history: any[] }>('/api/meals/history'),
        apiRequest<{ notes: any[] }>('/api/notes'),
        apiRequest<{ reminders: any[] }>('/api/reminders'),
        apiRequest<{ configs: any[] }>('/api/meals/config')
      ]);

      setPuzzles(pRes.puzzles || []);
      setTodayMeals(tRes.meals || []);
      setMealHistory(hRes.history || []);
      setLoveNotes(nRes.notes || []);
      setReminders(rRes.reminders || []);
      setMealConfigs(cRes.configs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Update tile notes size when grid size changes
  const handleGridSizeChange = (size: number) => {
    setUploadGridSize(size);
    const count = size * size;
    setTileNotes(Array(count).fill(''));
  };

  const handleTileNoteChange = (index: number, val: string) => {
    const updated = [...tileNotes];
    updated[index] = val;
    setTileNotes(updated);
  };

  // Upload Puzzle
  const handleUploadPuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please choose a photo for the puzzle.');
      return;
    }
    if (!uploadTitle.trim() || !uploadReward.trim()) {
      alert('Please fill in title and reward message.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', uploadFile);
      formData.append('title', uploadTitle.trim());
      formData.append('grid_size', String(uploadGridSize));
      formData.append('reward_message', uploadReward.trim());
      formData.append('notes_json', JSON.stringify(tileNotes));

      await apiRequest('/api/puzzles', {
        method: 'POST',
        body: formData
      });

      alert('Puzzle created and added to queue! ✨');
      setUploadTitle('');
      setUploadReward('');
      setUploadFile(null);
      setTileNotes(Array(uploadGridSize * uploadGridSize).fill(''));
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to upload puzzle.');
    } finally {
      setIsUploading(false);
    }
  };

  // Move puzzle order
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= puzzles.length) return;

    const list = [...puzzles];
    const temp = list[index];
    list[index] = list[newIdx];
    list[newIdx] = temp;

    const orderList = list.map((p, idx) => ({ id: p.id, queue_order: idx + 1 }));
    try {
      await apiRequest('/api/puzzles/queue/reorder', {
        method: 'PUT',
        body: JSON.stringify({ orderList })
      });
      setPuzzles(list);
    } catch (err: any) {
      alert(err.message || 'Failed to reorder.');
    }
  };

  const handleDeletePuzzle = async (id: number) => {
    if (!confirm('Are you sure you want to remove this puzzle?')) return;
    try {
      await apiRequest(`/api/puzzles/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete puzzle.');
    }
  };

  // Love Note submit
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    try {
      await apiRequest('/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          title: newNoteTitle.trim(),
          content: newNoteContent.trim(),
          scheduled_for: newNoteSchedule || null
        })
      });
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteSchedule('');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to save note.');
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await apiRequest(`/api/notes/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete note.');
    }
  };

  // Reminders submit
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.trim()) return;

    try {
      await apiRequest('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({ message: newReminder.trim() })
      });
      setNewReminder('');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to add reminder.');
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      await apiRequest(`/api/reminders/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete reminder.');
    }
  };

  // Send Test Push
  const handleTestPush = async () => {
    setPushStatus('Sending test notification...');
    try {
      const res = await apiRequest<{ success: boolean; total?: number; reason?: string }>(
        '/api/reminders/test-push',
        {
          method: 'POST',
          body: JSON.stringify({ message: testPushMsg || undefined })
        }
      );
      if (res.success) {
        setPushStatus(`Sent to ${res.total || 0} subscribed devices! ✨`);
      } else {
        setPushStatus(`Note: ${res.reason || 'Not configured yet'}`);
      }
    } catch (err: any) {
      setPushStatus(err.message || 'Push test failed');
    }
  };

  // Update Meal Config Times
  const handleUpdateMealConfig = async (id: number, start: string, end: string) => {
    try {
      await apiRequest(`/api/meals/config/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ start_time: start, end_time: end })
      });
      alert('Meal window updated!');
      await loadAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update meal config.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 pb-28 text-stone-800 dark:text-stone-100 transition-colors">
      <Navbar />

      <main className="max-w-md mx-auto px-4 pt-5 space-y-5">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
            Admin Management
          </span>
          <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100">
            Partner Control Panel 🛠️
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Add puzzles, schedule notes, and gently care for her day
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-stone-200/70 dark:bg-stone-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('puzzles')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'puzzles'
                ? 'bg-white dark:bg-stone-700 text-rose-500 shadow-sm'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Puzzles
          </button>
          <button
            onClick={() => setActiveTab('meals')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'meals'
                ? 'bg-white dark:bg-stone-700 text-rose-500 shadow-sm'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Meals
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'notes'
                ? 'bg-white dark:bg-stone-700 text-rose-500 shadow-sm'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'reminders'
                ? 'bg-white dark:bg-stone-700 text-rose-500 shadow-sm'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            Config
          </button>
        </div>

        {/* TAB 1: PUZZLES & QUEUE */}
        {activeTab === 'puzzles' && (
          <div className="space-y-6 animate-popIn">
            {/* Upload Form */}
            <form
              onSubmit={handleUploadPuzzle}
              className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-rose-100 dark:border-stone-700 shadow-soft space-y-4"
            >
              <div className="flex items-center gap-2 text-rose-500">
                <Upload className="w-5 h-5" />
                <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">
                  Upload New Photo Puzzle
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Puzzle Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Picnic in the Park"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Grid Size
                  </label>
                  <select
                    value={uploadGridSize}
                    onChange={(e) => handleGridSizeChange(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value={3}>3x3 (9 tiles)</option>
                    <option value={4}>4x4 (16 tiles)</option>
                    <option value={5}>5x5 (25 tiles)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                    Photo File
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                    }}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-500 hover:file:bg-rose-100 cursor-pointer pt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Final Reward Message
                </label>
                <input
                  type="text"
                  placeholder="e.g. Date night, you pick the restaurant! 🍣"
                  value={uploadReward}
                  onChange={(e) => setUploadReward(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              {/* Optional tile notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Hidden Notes for Tiles (Optional)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {tileNotes.map((note, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Tile ${idx + 1} secret note...`}
                      value={note}
                      onChange={(e) => handleTileNoteChange(idx, e.target.value)}
                      className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-xs"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold py-3 rounded-2xl shadow-md transition-all text-sm disabled:opacity-50"
              >
                {isUploading ? 'Slicing & Uploading with Sharp... ✂️' : 'Add Puzzle to Queue ✨'}
              </button>
            </form>

            {/* Puzzle Queue List */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-stone-400 px-1">
                Puzzle Queue ({puzzles.length})
              </h3>

              {puzzles.map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-stone-800 p-4 rounded-3xl border border-stone-100 dark:border-stone-700 shadow-soft flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          p.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.status === 'completed'
                            ? 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {p.status}
                      </span>
                      <h4 className="font-bold text-sm text-stone-800 dark:text-stone-100">
                        {p.title}
                      </h4>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {p.unlocked_tiles || 0} / {p.total_tiles || p.grid_size * p.grid_size} tiles unlocked • {p.grid_size}x{p.grid_size}
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      🎁 {p.reward_message}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleMoveOrder(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400 disabled:opacity-20"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(idx, 'down')}
                      disabled={idx === puzzles.length - 1}
                      className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400 disabled:opacity-20"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePuzzle(p.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-stone-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MEALS & CALENDAR */}
        {activeTab === 'meals' && (
          <div className="space-y-5 animate-popIn">
            {/* Today status */}
            <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-rose-100 dark:border-stone-700 shadow-soft">
              <h3 className="font-bold text-sm uppercase tracking-wider text-rose-500 mb-3">
                Today's Meal Status
              </h3>
              <div className="space-y-2">
                {todayMeals.map((m) => (
                  <div
                    key={m.config.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-750"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{m.config.icon}</span>
                      <span className="font-semibold text-sm">{m.config.name}</span>
                    </div>
                    {m.isLogged ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Logged
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">Not yet</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* History logs & Cheat Detection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-sm uppercase tracking-wider text-stone-400">
                  Meal History & Authenticity Tracker
                </h3>
                <span className="text-[11px] font-semibold text-rose-500">
                  {mealHistory.filter(m => m.is_suspicious_rapid).length > 0 
                    ? `⚠️ ${mealHistory.filter(m => m.is_suspicious_rapid).length} suspicious log(s)`
                    : '✅ All logs authentic'}
                </span>
              </div>

              {mealHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400 bg-white dark:bg-stone-800 rounded-3xl border border-stone-100 dark:border-stone-700">
                  No historical logs recorded yet.
                </div>
              ) : (
                mealHistory.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 bg-white dark:bg-stone-800 rounded-3xl border shadow-soft transition-all ${
                      log.is_suspicious_rapid 
                        ? 'border-red-300 dark:border-red-900/60 bg-red-50/20' 
                        : 'border-stone-100 dark:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {/* Meal type & Icon */}
                        <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-100 text-sm">
                          <span className="text-lg">{log.meal_icon}</span>
                          <span>{log.meal_name}</span>
                          <span className="text-stone-400 font-normal text-xs ml-1">
                            • {log.log_date}
                          </span>
                        </div>

                        {/* Exact timestamp */}
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 font-mono">
                          Exact Time: {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>

                        {/* Interval since last meal */}
                        {log.interval_minutes !== null && (
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                            ⏱️ Interval: {log.interval_minutes} mins after prior meal
                          </p>
                        )}

                        {/* Notes if any */}
                        {log.note && (
                          <p className="text-xs text-stone-600 dark:text-stone-300 italic mt-1.5 bg-stone-50 dark:bg-stone-750 px-2.5 py-1 rounded-xl">
                            "{log.note}"
                          </p>
                        )}
                      </div>

                      {/* Anti-cheat status badge */}
                      <div className="shrink-0 text-right">
                        {log.is_suspicious_rapid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-[10px] border border-red-200">
                            ⚠️ Fake / Sugar-Coating ({log.interval_minutes}m apart)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            ✅ Authentic Spacing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LOVE NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-5 animate-popIn">
            <form
              onSubmit={handleCreateNote}
              className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-rose-100 dark:border-stone-700 shadow-soft space-y-3"
            >
              <div className="flex items-center gap-2 text-rose-500">
                <Heart className="w-5 h-5 fill-rose-500" />
                <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">
                  Write a Love Note
                </h3>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Note Title (e.g. Good morning my love!)"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              <div>
                <textarea
                  placeholder="Write your sweet encouraging message here..."
                  rows={3}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="date"
                    value={newNoteSchedule}
                    onChange={(e) => setNewNoteSchedule(e.target.value)}
                    className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 px-2 py-1 rounded-lg text-xs"
                    title="Optional scheduled date"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Note</span>
                </button>
              </div>
            </form>

            {/* Existing notes */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-stone-400 px-1">
                Saved Notes ({loveNotes.length})
              </h3>
              {loveNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white dark:bg-stone-800 p-4 rounded-3xl border border-stone-100 dark:border-stone-700 shadow-soft flex items-start justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-sm text-stone-800 dark:text-stone-100">
                      {note.title}
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 whitespace-pre-line">
                      {note.content}
                    </p>
                    {note.scheduled_for && (
                      <span className="text-[10px] text-amber-500 font-semibold block mt-2">
                        📅 Scheduled for: {note.scheduled_for}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REMINDERS & CONFIG */}
        {activeTab === 'reminders' && (
          <div className="space-y-5 animate-popIn">
            {/* Meal Time Windows */}
            <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-rose-100 dark:border-stone-700 shadow-soft space-y-3">
              <div className="flex items-center gap-2 text-rose-500">
                <Clock className="w-5 h-5" />
                <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">
                  Meal Time Windows
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Set the active daily start and end times for each meal.
              </p>

              <div className="space-y-2.5 pt-1">
                {mealConfigs.map((cfg) => (
                  <div
                    key={cfg.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-750 text-xs"
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-lg">{cfg.icon}</span>
                      <span>{cfg.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        defaultValue={cfg.start_time}
                        id={`start-${cfg.id}`}
                        className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-1 rounded-lg text-xs"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        defaultValue={cfg.end_time}
                        id={`end-${cfg.id}`}
                        className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-1 rounded-lg text-xs"
                      />
                      <button
                        onClick={() => {
                          const s = (document.getElementById(`start-${cfg.id}`) as HTMLInputElement).value;
                          const e = (document.getElementById(`end-${cfg.id}`) as HTMLInputElement).value;
                          handleUpdateMealConfig(cfg.id, s, e);
                        }}
                        className="bg-stone-200 dark:bg-stone-700 hover:bg-rose-500 hover:text-white px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gentle reminder messages */}
            <form
              onSubmit={handleCreateReminder}
              className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-rose-100 dark:border-stone-700 shadow-soft space-y-3"
            >
              <div className="flex items-center gap-2 text-amber-500">
                <Bell className="w-5 h-5" />
                <h3 className="font-bold text-base text-stone-800 dark:text-stone-100">
                  Gentle Reminder Messages
                </h3>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. You forgot {meal}, go eat something, love you 💛"
                  value={newReminder}
                  onChange={(e) => setNewReminder(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2 pt-2">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-stone-50 dark:bg-stone-750 rounded-2xl flex items-center justify-between text-xs gap-3"
                  >
                    <p className="text-stone-700 dark:text-stone-200">
                      {r.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(r.id)}
                      className="text-stone-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </form>

            {/* Web Push Notification Testing */}
            <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl border border-rose-100 dark:border-stone-700 shadow-soft space-y-3">
              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-rose-500" />
                Test Web Push Notification
              </h4>
              <p className="text-xs text-stone-500">
                Triggers a real-time web push notification to all subscribed mobile devices or browsers.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Custom notification message..."
                  value={testPushMsg}
                  onChange={(e) => setTestPushMsg(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <button
                  type="button"
                  onClick={handleTestPush}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md"
                >
                  Send
                </button>
              </div>
              {pushStatus && (
                <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                  {pushStatus}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
