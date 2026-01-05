'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/supabaseClient'; 
import { useAuth } from '@/components/providers/AuthProvider';

export type Theme = 'modern' | 'dark' | 'pastel' | 'custom';

type ThemeContextType = {
  theme: Theme;
  changeTheme: (t: Theme) => void;
  fullName: string;
  updateName: (name: string) => void;
  customColors: any;
  setCustomColors: (colors: any) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('modern');
  const [fullName, setFullName] = useState('');
  const [customColors, setCustomColors] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const isFetching = useRef(false);

  // Markiert die Komponente als im Browser geladen (verhindert Hydration-Fehler)
  useEffect(() => { 
    setMounted(true); 
  }, []);

  // Profil-Daten (Name, Theme, Farben) laden
  useEffect(() => {
    if (user && !isFetching.current) {
      isFetching.current = true;
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme, full_name, custom_colors')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          if (data.theme) setTheme(data.theme as Theme);
          if (data.full_name) setFullName(data.full_name);
          if (data.custom_colors) setCustomColors(data.custom_colors);
        }
        isFetching.current = false;
      };
      fetchProfile();
    }
  }, [user]);

  // CSS Variablen & Themes auf das HTML-Element anwenden
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    
    // Bestehende Theme-Klassen entfernen
    root.className = '';
    root.classList.add(`theme-${theme}`);
    
    // Tailwind Dark Mode Support
    if (theme === 'dark' || theme === 'custom') {
      root.classList.add('dark');
    }

    // Benutzerdefinierte Farben aus der JSONB-Spalte anwenden
    if (theme === 'custom' && customColors) {
      Object.keys(customColors).forEach(key => {
        // Sicherstellen, dass die Variable mit -- beginnt
        const varName = key.startsWith('--') ? key : `--${key}`;
        root.style.setProperty(varName, customColors[key]);
      });
    } else {
      // Styles zurücksetzen, wenn kein Custom Theme aktiv ist
      root.removeAttribute('style');
    }
  }, [theme, customColors, mounted]);

  const changeTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    if (user) {
      await supabase.from('profiles').update({ theme: newTheme }).eq('id', user.id);
    }
  };

  const updateName = async (name: string) => {
    setFullName(name);
    if (user) {
      await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    }
  };

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