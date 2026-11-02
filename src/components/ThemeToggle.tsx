import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Theme } from '../types';
import { storageService } from '../services/storageService';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => storageService.getTheme());

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (t: Theme) => {
      const isDark =
        t === 'dark' || (t === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    storageService.setTheme(theme);

    const listener = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getLabel = () => {
    if (theme === 'light') return 'Theme: Light';
    if (theme === 'dark') return 'Theme: Dark';
    return 'Theme: System';
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50"
      title={`${getLabel()} (Click to toggle)`}
      aria-label={`${getLabel()} (Click to toggle)`}
    >
      {theme === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
      {theme === 'dark' && <Moon className="w-5 h-5 text-indigo-400" />}
      {theme === 'system' && <Monitor className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
    </button>
  );
};
