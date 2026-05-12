import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ExternalLink, Bookmark as BookmarkIcon } from 'lucide-react';
import api from '../lib/api';

export default function Bookmarks() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', description: '' });

  const load = async () => {
    const r = await api.get('/bookmarks');
    setItems(r.data);
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return;
    await api.post('/bookmarks', form);
    setForm({ title: '', url: '', description: '' });
    setOpen(false);
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Delete bookmark?')) return;
    await api.delete(`/bookmarks/${id}`);
    load();
  };

  return (
    <div className="h-full overflow-y-auto" data-testid="bookmarks-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Bookmarks</div>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">Your saved links</h1>
          </div>
          <button
            data-testid="add-bookmark-btn"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {open && (
          <form onSubmit={save} className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <input
              data-testid="bookmark-title"
              required
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              data-testid="bookmark-url"
              required
              type="url"
              placeholder="https://…"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              data-testid="bookmark-desc"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700">Cancel</button>
              <button data-testid="bookmark-save-btn" type="submit" className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-white">Save</button>
            </div>
          </form>
        )}

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
              <BookmarkIcon className="h-10 w-10 text-sky-400" />
              <div className="mt-3 text-sm">No bookmarks yet.</div>
            </div>
          )}
          {items.map((b) => (
            <div key={b.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 group">
              <div className="flex items-start justify-between gap-2">
                <a href={b.url} target="_blank" rel="noreferrer" className="font-medium hover:text-sky-600 inline-flex items-center gap-1.5 truncate">
                  {b.title} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
                <button onClick={() => del(b.id)} className="opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </button>
              </div>
              <div className="mt-1 text-xs text-sky-600 truncate">{b.url}</div>
              {b.description && <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{b.description}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
