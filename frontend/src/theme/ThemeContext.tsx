/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

/**
 * SkillBridge has one visual design, Aurora Elite, which is light. Every screen is drawn for it,
 * so the light semantic tokens (`html.light` in main.css) are always applied. The API is kept so
 * existing callers keep working; asking for another theme changes nothing.
 */
export const ThemeProvider: React.FC<{ defaultTheme?: Theme; children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    try {
      // An earlier dark choice no longer applies
      localStorage.removeItem('skillbridge-theme');
    } catch {
      // Storage unavailable
    }
  }, []);

  return <ThemeContext.Provider value={{ theme: 'light', setTheme: () => undefined, resolvedTheme: 'light' }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
