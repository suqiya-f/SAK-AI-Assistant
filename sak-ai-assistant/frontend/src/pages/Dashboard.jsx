import React from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { MessageSquare, Image, Languages, NotebookPen, Bookmark, LogOut, CloudSun } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../lib/auth';
import Chat from './Chat';
import Studio from './Studio';
import Translate from './Translate';
import Notes from './Notes';
import Bookmarks from './Bookmarks';
import Weather from './Weather';

const NAV = [
  { to: 'chat', icon: MessageSquare, label: 'Chat' },
  { to: 'studio', icon: Image, label: 'Studio' },
  { to: 'translate', icon: Languages, label: 'Translate' },
  { to: 'weather', icon: CloudSun, label: 'Weather' },
  { to: 'notes', icon: NotebookPen, label: 'Notes' },
  { to: 'bookmarks', icon: Bookmark, label: 'Bookmarks' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl">
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800">
          <Logo />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`nav-${item.to}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user?.name}</div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={handleLogout}
            className="w-full inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleLogout} className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="hidden md:flex fixed top-4 right-6 z-30">
          <ThemeToggle />
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`mnav-${item.to}`}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'text-slate-600 dark:text-slate-300'
                }`
              }
            >
              <item.icon className="h-3.5 w-3.5" /> {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route index element={<Navigate to="chat" replace />} />
            <Route path="chat" element={<Chat />} />
            <Route path="studio" element={<Studio />} />
            <Route path="translate" element={<Translate />} />
            <Route path="weather" element={<Weather />} />
            <Route path="notes" element={<Notes />} />
            <Route path="bookmarks" element={<Bookmarks />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
