import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, NotebookPen } from 'lucide-react';
import api from '../lib/api';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [active, setActive] = useState(null); // {id?, title, content, tags}
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const r = await api.get('/notes');
    setNotes(r.data);
  };

  useEffect(() => { load(); }, []);

  const newNote = () => setActive({ title: '', content: '', tags: [] });

  const save = async () => {
    if (!active?.title?.trim()) return;
    setSaving(true);
    try {
      const payload = { title: active.title, content: active.content || '', tags: active.tags || [] };
      if (active.id) await api.put(`/notes/${active.id}`, payload);
      else {
        const r = await api.post('/notes', payload);
        setActive(r.data);
      }
      await load();
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    await api.delete(`/notes/${id}`);
    if (active?.id === id) setActive(null);
    load();
  };

  return (
    <div className="h-full flex" data-testid="notes-page">
      <aside className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <button
            data-testid="new-note-btn"
            onClick={newNote}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> New note
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.length === 0 && <div className="text-xs text-slate-500 px-3 py-4">No notes yet.</div>}
          {notes.map((n) => (
            <div
              key={n.id}
              onClick={() => setActive(n)}
              className={`group rounded-lg px-3 py-2 cursor-pointer text-sm ${
                active?.id === n.id ? 'bg-sky-100 dark:bg-sky-500/15' : 'hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="truncate flex-1 font-medium">{n.title || 'Untitled'}</span>
                <button onClick={(e) => { e.stopPropagation(); del(n.id); }} className="opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                </button>
              </div>
              <div className="text-xs text-slate-500 truncate">{n.content?.slice(0, 60)}</div>
            </div>
          ))}
        </div>
      </aside>

      <div className="hidden md:flex flex-1 flex-col">
        {active ? (
          <div className="flex-1 flex flex-col p-6 max-w-3xl mx-auto w-full">
            <input
              data-testid="note-title"
              value={active.title}
              onChange={(e) => setActive({ ...active, title: e.target.value })}
              placeholder="Title"
              className="w-full bg-transparent text-2xl font-heading font-semibold outline-none"
            />
            <textarea
              data-testid="note-content"
              value={active.content}
              onChange={(e) => setActive({ ...active, content: e.target.value })}
              placeholder="Start writing…"
              className="mt-3 flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed"
            />
            <div className="pt-3 flex justify-end">
              <button
                data-testid="note-save-btn"
                onClick={save}
                disabled={!active.title?.trim() || saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <NotebookPen className="h-10 w-10 text-sky-400" />
            <div className="mt-3 text-sm">Select or create a note to get started.</div>
          </div>
        )}
      </div>
    </div>
  );
}
