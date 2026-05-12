import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/theme';

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      data-testid="dark-mode-toggle"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
    >
      {dark ? <Sun className="h-5 w-5 text-sky-400" /> : <Moon className="h-5 w-5 text-sky-600" />}
    </button>
  );
}
