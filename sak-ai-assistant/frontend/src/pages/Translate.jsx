import React, { useEffect, useState } from 'react';
import { Languages, Loader2, Copy, ArrowRightLeft } from 'lucide-react';
import api from '../lib/api';

export default function Translate() {
  const [langs, setLangs] = useState([]);
  const [target, setTarget] = useState('Spanish');
  const [text, setText] = useState('');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/translation/languages').then((r) => setLangs(r.data.languages || []));
  }, []);

  const translate = async (e) => {
    e?.preventDefault?.();
    if (!text.trim() || loading) return;
    setLoading(true); setErr('');
    try {
      const r = await api.post('/translation/translate', { text: text.trim(), target_language: target });
      setOut(r.data.translated_text);
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto" data-testid="translate-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Translation</div>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight flex items-center gap-3">
          <Languages className="h-7 w-7 text-sky-500" /> Translate anything
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">15+ languages, fast and accurate.</p>

        <form onSubmit={translate} className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Source</span>
              <span className="text-xs text-slate-400">Auto-detect</span>
            </div>
            <textarea
              data-testid="translate-source"
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to translate…"
              className="mt-2 w-full resize-none rounded-lg bg-transparent outline-none text-sm"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target</span>
              <select
                data-testid="translate-target-select"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="text-sm bg-transparent border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-sky-500"
              >
                {langs.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <textarea
              data-testid="translate-output"
              rows={8}
              readOnly
              value={out}
              placeholder="Translation will appear here…"
              className="mt-2 w-full resize-none rounded-lg bg-transparent outline-none text-sm"
            />
            {out && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(out)}
                className="text-xs text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            )}
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-3">
            {err && <div className="text-sm text-rose-500" data-testid="translate-error">{err}</div>}
            <div className="ml-auto">
              <button
                data-testid="translate-submit-btn"
                type="submit"
                disabled={!text.trim() || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                Translate
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
