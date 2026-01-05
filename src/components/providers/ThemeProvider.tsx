'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/providers/AuthProvider';

export type Theme = 'modern' | 'dark' | 'pastel' | 'custom';

type ThemeContextType = {
  theme: Theme;
  changeTheme: (t: Theme) => Promise<void>;
  fullName: string;
  updateName: (name: string) => Promise<void>;
  customColors: any;
  setCustomColors: (colors: any) => Promise<void>;
  isInitialLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('modern');
  const [fullName, setFullName] = useState('');
  const [customColors, setCustomColorsState] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const isFetching = useRef(false);

  // Verhindert Hydration-Fehler
  useEffect(() => {
    setMounted(true);
  }, []);

  // Profildaten laden – nur EINMAL wenn User sich ändert
  useEffect(() => {
    if (!user?.id || isFetching.current) return;

    isFetching.current = true;
    setIsInitialLoading(true);

  const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme, full_name, custom_colors')
          .eq('id', user.id)
          .single();

        if (data) {
          if (data.theme) setTheme(data.theme as Theme);
          if (data.full_name) setFullName(data.full_name);
          if (data.custom_colors) setCustomColorsState(data.custom_colors);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        // 🔥 WICHTIG: Das hier beendet den Ladebildschirm!
        isFetching.current = false;
        setIsInitialLoading(false); 
      }
    };

    fetchProfile();
  }, [user?.id]); // Nur auf user.id reagieren

  // CSS-Variablen setzen – SEPARAT, um Render-Loop zu vermeiden
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Klassen setzen
    const newClasses = [`theme-${theme}`];
    if (theme === 'dark' || theme === 'custom') {
      newClasses.push('dark');
    }
    root.className = newClasses.join(' ');

    // Custom Colors anwenden
    if (theme === 'custom' && customColors && Object.keys(customColors).length > 0) {
      root.removeAttribute('style');
      Object.entries(customColors).forEach(([key, value]) => {
        const varName = key.startsWith('--') ? key : `--${key}`;
        root.style.setProperty(varName, value as string);
      });
    } else if (theme !== 'custom') {
      root.removeAttribute('style');
    }
  }, [theme, customColors, mounted]); // Stabil und minimal

  // Alle Funktionen mit useCallback für Stabilität
  const changeTheme = useCallback(async (newTheme: Theme) => {
    setTheme(newTheme);
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ theme: newTheme })
          .eq('id', user.id);
      } catch (err) {
        console.error('Theme update error:', err);
      }
    }
  }, [user?.id]);

  const updateName = useCallback(async (name: string) => {
    setFullName(name);
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ full_name: name })
          .eq('id', user.id);
      } catch (err) {
        console.error('Name update error:', err);
      }
    }
  }, [user?.id]);

  const setCustomColors = useCallback(async (colors: any) => {
    setCustomColorsState(colors);
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ custom_colors: colors })
          .eq('id', user.id);
      } catch (err) {
        console.error('Custom colors update error:', err);
      }
    }
  }, [user?.id]);

  // Memoize Context Value um unnötige Re-Renders zu vermeiden
  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      changeTheme,
      fullName,
      updateName,
      customColors,
      setCustomColors,
      isInitialLoading,
    }),
    [theme, changeTheme, fullName, updateName, customColors, setCustomColors, isInitialLoading]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}