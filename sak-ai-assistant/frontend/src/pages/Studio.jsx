import React, { useEffect, useState } from 'react';
import { Wand2, Download, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../lib/api';

export default function Studio() {
  const [prompt, setPrompt] = useState('');
  const [gen, setGen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [gallery, setGallery] = useState([]);

  const loadGallery = async () => {
    const r = await api.get('/image/gallery');
    setGallery(r.data);
  };

  useEffect(() => { loadGallery(); }, []);

  const generate = async (e) => {
    e?.preventDefault?.();
    if (!prompt.trim() || loading) return;
    setLoading(true); setErr('');
    try {
      const r = await api.post('/image/generate', { prompt: prompt.trim() });
      setGen(r.data);
      loadGallery();
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Image generation failed');
    } finally {
      setLoading(false);
    }
  };

  const download = (dataUrl, name) => {
    const a = document.createElement('a');
    a.href = dataUrl; a.download = `${name || 'sak-ai-image'}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="h-full overflow-y-auto" data-testid="studio-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500">Image Studio</div>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">Generate stunning visuals</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Powered by Gemini Nano Banana.</p>

        <form onSubmit={generate} className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <label className="text-sm font-medium">Prompt</label>
          <textarea
            data-testid="studio-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A serene mountain lake at sunrise, hyper-realistic, cinematic lighting"
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 text-sm"
          />
          <div className="mt-3 flex justify-end">
            <button
              data-testid="studio-generate-btn"
              type="submit"
              disabled={!prompt.trim() || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate
            </button>
          </div>
          {err && <div className="mt-3 text-sm text-rose-500" data-testid="studio-error">{err}</div>}
        </form>

        {gen && (
          <div className="mt-6 rounded-2xl border border-sky-300/40 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400 italic truncate pr-3">{gen.prompt}</div>
              <button onClick={() => download(gen.image, 'latest')} className="inline-flex items-center gap-1.5 text-sm text-sky-600 hover:text-sky-700">
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
            <img alt={gen.prompt} src={gen.image} className="mt-3 w-full rounded-xl" />
          </div>
        )}

        <div className="mt-10">
          <h2 className="font-heading text-xl font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-sky-500" /> Your gallery
          </h2>
          {gallery.length === 0 ? (
            <div className="mt-4 text-sm text-slate-500">No images yet. Create your first masterpiece above.</div>
          ) : (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((g) => (
                <div key={g.id} className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group">
                  <img src={g.data_url} alt={g.prompt} className="w-full aspect-square object-cover" />
                  <div className="p-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{g.prompt}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
