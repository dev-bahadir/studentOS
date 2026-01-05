'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient'; // Empfohlen: Absolute Pfade nutzen
import { useAuth } from './AuthProvider';

export type Theme = 'modern' | 'dark' | 'pastel' | 'custom';

type ThemeContextType = {
  theme: Theme;
  changeTheme: (t: Theme) => void;
  fullName: string;
  updateName: (name: string) => void;
  customColors: Record<string, string> | null;
  setCustomColors: (colors: Record<string, string>) => void;
};

const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'modern', 
  changeTheme: () => {}, 
  fullName: '',
  updateName: () => {},
  customColors: null,
  setCustomColors: () => {}
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('modern');
  const [fullName, setFullName] = useState('');
  const [customColors, setCustomColors] = useState<Record<string, string> | null>(null);
  const [mounted, setMounted] = useState(false);

  // 1. Hydration-Schutz
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Profil & Theme initial laden
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('theme, full_name, custom_colors')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;

          if (data) {
            if (data.theme) setTheme(data.theme as Theme);
            if (data.full_name) setFullName(data.full_name);
            if (data.custom_colors) setCustomColors(data.custom_colors);
          }
        } catch (err) {
          console.error('Fehler beim Laden des Themes:', err);
        }
      };
      fetchProfile();
    }
  }, [user]);

  // 3. CSS-Variablen & Klassen auf das Dokument anwenden
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Theme-Klassen verwalten
    root.className = ''; 
    root.classList.add(`theme-${theme}`);

    // Tailwind Dark Mode Support
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Custom Colors anwenden
    if (theme === 'custom' && customColors) {
      Object.keys(customColors).forEach(key => {
        const variableName = key.startsWith('--') ? key : `--${key}`;
        root.style.setProperty(variableName, customColors[key]);
      });
    } else {
      root.removeAttribute('style');
    }
  }, [theme, customColors, mounted]);

  // 4. Funktionen für Context
  const changeTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ theme: newTheme })
          .eq('id', user.id);
        if (error) throw error;
      } catch (err) {
        console.error('Fehler beim Speichern des Themes:', err);
      }
    }
  };

  const updateName = async (name: string) => {
    setFullName(name);
    if (user) {
      await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    }
  };

  // Verhindert das "Blitzen" von falschem Content während SSR
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      changeTheme, 
      fullName, 
      updateName, 
      customColors, 
      setCustomColors 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
