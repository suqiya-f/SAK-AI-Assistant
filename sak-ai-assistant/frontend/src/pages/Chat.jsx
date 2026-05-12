import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Plus, Trash2, Copy, Volume2, Loader2,
  Paperclip, Camera, Image as ImageIcon, FileDown, X, FileText, History,
} from 'lucide-react';
import jsPDF from 'jspdf';
import api from '../lib/api';
import SakBadge from '../components/SakBadge';

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1; u.pitch = 1;
  window.speechSynthesis.speak(u);
}

function exportChatPdf(messages) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.setTextColor(14, 165, 233);
  doc.text('SAK AI — Conversation Export', margin, y);
  y += 24;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
  y += 24;

  messages.forEach((m, i) => {
    if (y > 780) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.setTextColor(m.role === 'user' ? 14 : 30, m.role === 'user' ? 165 : 41, m.role === 'user' ? 233 : 59);
    doc.text(m.role === 'user' ? 'You' : 'SAK AI', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    doc.setTextColor(20);
    const lines = doc.splitTextToSize(m.content || '', pageWidth - margin * 2);
    lines.forEach((ln) => {
      if (y > 800) { doc.addPage(); y = margin; }
      doc.text(ln, margin, y); y += 14;
    });
    y += 8;
  });
  doc.save(`sak-ai-chat-${Date.now()}.pdf`);
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function Chat() {
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // mobile drawer
  const [attachment, setAttachment] = useState(null); // {kind:'file'|'image', file, previewUrl?, base64?}
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const photoRef = useRef(null);
  const galleryRef = useRef(null);

  const loadHistory = async () => {
    const r = await api.get('/chat/history');
    setChats(r.data);
  };

  const loadChat = async (id) => {
    if (!id) { setMessages([]); setActiveId(null); return; }
    const r = await api.get(`/chat/history/${id}`);
    setActiveId(id);
    setMessages(r.data.messages || []);
    setShowHistory(false);
  };

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

  const newChat = () => { setActiveId(null); setMessages([]); setInput(''); setAttachment(null); setShowHistory(false); };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat?')) return;
    await api.delete(`/chat/history/${id}`);
    if (activeId === id) newChat();
    loadHistory();
  };

  const onPickFile = async (e, kind) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const att = { file, kind: isImage ? 'image' : 'file', name: file.name, size: file.size };
    if (isImage) {
      att.previewUrl = await fileToBase64(file);
    }
    setAttachment(att);
  };

  const clearAttachment = () => setAttachment(null);

  const sendText = async (text) => {
    const userMsg = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    try {
      const r = await api.post('/chat/message', { message: text, chat_id: activeId });
      setMessages((m) => [...m, { role: 'assistant', content: r.data.response }]);
      if (!activeId) setActiveId(r.data.chat_id);
      loadHistory();
    } catch (e2) {
      setMessages((m) => [...m, { role: 'assistant', content: `**Error:** ${e2?.response?.data?.detail || 'Failed to get response'}` }]);
    } finally {
      setSending(false);
    }
  };

  const sendAttachment = async (text) => {
    const att = attachment;
    const userMsg = {
      role: 'user',
      content: text || (att.kind === 'image' ? `📷 Analyze this image: ${att.name}` : `📎 Analyze this file: ${att.name}`),
      attachment: att.kind === 'image' ? { kind: 'image', url: att.previewUrl, name: att.name } : { kind: 'file', name: att.name },
    };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    setAttachment(null);
    try {
      let analysis = '';
      if (att.kind === 'image') {
        const base64 = att.previewUrl.split(',')[1];
        const r = await api.post('/photo/analyze', { image: base64, prompt: text || 'Analyze this image in detail.' });
        analysis = r.data.analysis;
      } else {
        const form = new FormData();
        form.append('file', att.file);
        if (text) form.append('prompt', text);
        const r = await api.post('/file/analyze', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        analysis = r.data.analysis;
      }
      setMessages((m) => [...m, { role: 'assistant', content: analysis }]);
    } catch (e2) {
      setMessages((m) => [...m, { role: 'assistant', content: `**Error:** ${e2?.response?.data?.detail || 'Failed to analyze attachment'}` }]);
    } finally {
      setSending(false);
    }
  };

  const send = async (e) => {
    e?.preventDefault?.();
    if (sending) return;
    const text = input.trim();
    if (!text && !attachment) return;
    setInput('');
    if (attachment) await sendAttachment(text);
    else await sendText(text);
  };

  return (
    <div className="h-full flex relative" data-testid="chat-page">
      {/* History sidebar (desktop) + drawer (mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform lg:translate-x-0 lg:static lg:flex transition-transform duration-300 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 ${
          showHistory ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            data-testid="new-chat-btn"
            onClick={newChat}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>
          <button onClick={() => setShowHistory(false)} className="lg:hidden h-10 w-10 grid place-items-center rounded-xl border border-slate-200 dark:border-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.length === 0 && <div className="text-xs text-slate-500 px-3 py-4">No conversations yet.</div>}
          {chats.map((c) => (
            <div
              key={c.id}
              data-testid={`chat-history-${c.id}`}
              onClick={() => loadChat(c.id)}
              className={`group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer text-sm transition-colors ${
                activeId === c.id ? 'bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300' : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="truncate flex-1">{c.title}</span>
              <button
                onClick={(e) => deleteChat(c.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-500/20"
                aria-label="Delete chat"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile backdrop */}
      {showHistory && <div onClick={() => setShowHistory(false)} className="lg:hidden fixed inset-0 z-20 bg-black/40" />}

      {/* Conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile-only controls + actions) */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
          <button
            data-testid="open-history-btn"
            onClick={() => setShowHistory(true)}
            className="lg:hidden inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800"
          >
            <History className="h-4 w-4" /> History
          </button>
          <div className="text-xs text-slate-500 truncate ml-auto">
            {messages.length} message{messages.length === 1 ? '' : 's'}
          </div>
          {messages.length > 0 && (
            <button
              data-testid="export-pdf-btn"
              onClick={() => exportChatPdf(messages)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-500/10"
            >
              <FileDown className="h-4 w-4" /> Export PDF
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
              <SakBadge size="lg" />
              <h2 className="mt-6 font-heading text-2xl sm:text-3xl font-semibold tracking-tight">How can I help today?</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ask anything. Attach a file or photo for analysis.</p>
              <div className="mt-6 grid sm:grid-cols-2 gap-2.5 w-full">
                {[
                  'Explain quantum computing simply',
                  'Plan a 3-day Tokyo trip',
                  'Summarize an attached PDF',
                  'Describe a photo I take',
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 bg-white dark:bg-slate-900 p-3 text-left text-sm transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                  {m.role === 'assistant' && (
                    <div className="hidden sm:block shrink-0 mr-2">
                      <SakBadge size="sm" />
                    </div>
                  )}
                  <div
                    data-testid={`msg-${m.role}`}
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      m.role === 'user'
                        ? 'bg-sky-100 dark:bg-sky-500/20 border border-sky-300/60 dark:border-sky-500/30 text-sky-950 dark:text-sky-50'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Attachment preview */}
                    {m.attachment?.kind === 'image' && (
                      <img src={m.attachment.url} alt={m.attachment.name} className="mb-2 max-h-64 w-auto rounded-lg" />
                    )}
                    {m.attachment?.kind === 'file' && (
                      <div className={`mb-2 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                        m.role === 'user'
                          ? 'bg-sky-200/60 dark:bg-sky-500/20 text-sky-900 dark:text-sky-100'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        <FileText className="h-3.5 w-3.5" /> {m.attachment.name}
                      </div>
                    )}
                    {m.role === 'assistant' ? (
                      <>
                        <div className="markdown text-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                        <div className="mt-2 flex gap-3 opacity-70">
                          <button onClick={() => navigator.clipboard.writeText(m.content)} className="text-xs inline-flex items-center gap-1 hover:text-sky-500">
                            <Copy className="h-3 w-3" /> Copy
                          </button>
                          <button onClick={() => speak(m.content)} className="text-xs inline-flex items-center gap-1 hover:text-sky-500">
                            <Volume2 className="h-3 w-3" /> Speak
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="hidden sm:block shrink-0 mr-2">
                    <SakBadge size="sm" />
                  </div>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={send} className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-3 sm:px-4 py-3">
          <div className="max-w-3xl mx-auto">
            {/* Attachment chip */}
            {attachment && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-sky-300/60 dark:border-sky-500/30 bg-sky-50/70 dark:bg-sky-500/10 px-3 py-2">
                {attachment.kind === 'image' ? (
                  <img src={attachment.previewUrl} alt="" className="h-10 w-10 object-cover rounded-md" />
                ) : (
                  <div className="h-10 w-10 grid place-items-center rounded-md bg-sky-100 dark:bg-sky-500/20">
                    <FileText className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{attachment.name}</div>
                  <div className="text-[11px] text-slate-500">{Math.round(attachment.size / 1024)} KB · ready to analyze</div>
                </div>
                <button type="button" onClick={clearAttachment} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Action toolbar */}
            <div className="flex items-center gap-1 mb-2 overflow-x-auto">
              <button type="button" data-testid="attach-file-btn" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <Paperclip className="h-3.5 w-3.5" /> Attach file
              </button>
              <button type="button" data-testid="take-photo-btn" onClick={() => photoRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <Camera className="h-3.5 w-3.5" /> Take photo
              </button>
              <button type="button" data-testid="add-photo-btn" onClick={() => galleryRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <ImageIcon className="h-3.5 w-3.5" /> Add photo
              </button>
              <button
                type="button"
                data-testid="export-pdf-toolbar-btn"
                onClick={() => exportChatPdf(messages)}
                disabled={messages.length === 0}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-700 dark:text-slate-300 whitespace-nowrap disabled:opacity-40"
              >
                <FileDown className="h-3.5 w-3.5" /> Save as PDF
              </button>

              <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.csv,.json,.html,.xml,.log,.py,.js,.ts,image/*" onChange={(e) => onPickFile(e, 'file')} className="hidden" />
              <input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={(e) => onPickFile(e, 'image')} className="hidden" />
              <input ref={galleryRef} type="file" accept="image/*" onChange={(e) => onPickFile(e, 'image')} className="hidden" />
            </div>

            {/* Input */}
            <div className="flex items-end gap-2">
              <textarea
                data-testid="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
                rows={1}
                placeholder={attachment ? 'Add a note about this attachment (optional)…' : 'Message SAK AI…'}
                className="flex-1 resize-none rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 max-h-40 text-sm"
              />
              <button
                data-testid="chat-send-btn"
                type="submit"
                disabled={(!input.trim() && !attachment) || sending}
                className="h-12 w-12 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 text-white disabled:opacity-50 shadow-md"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
