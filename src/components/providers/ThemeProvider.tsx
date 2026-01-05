'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
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
  isInitialLoading: boolean; // NEU: Damit das Dashboard weiß, wann Ruhe ist
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const isFetching = useRef(false);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  useEffect(() => {
    // Nur abfragen, wenn User da ist UND wir nicht schon laden
    if (user?.id && !isFetching.current) {
      isFetching.current = true;
      const fetchProfile = async () => {
        try {
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
        } finally {
          isFetching.current = false;
          setIsInitialLoading(false);
        }
      };
      fetchProfile();
    } else if (!user) {
      setIsInitialLoading(false);
    }
  }, [user?.id]); // Präzise Abhängigkeit auf die ID

  // Performance-Optimierung: CSS-Variablen gesammelt setzen
  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    
    // Batch-Update der Klassen
    const newClasses = [`theme-${theme}`];
    if (theme === 'dark' || theme === 'custom') {
      newClasses.push('dark');
    }
    
    root.className = newClasses.join(' ');

    if (theme === 'custom' && customColors && Object.keys(customColors).length > 0) {
      // Vorherige Custom-Styles säubern, um "Style-Leichen" zu vermeiden
      root.removeAttribute('style');
      
      Object.entries(customColors).forEach(([key, value]) => {
        const varName = key.startsWith('--') ? key : `--${key}`;
        root.style.setProperty(varName, value as string);
      });
    } else if (theme !== 'custom') {
      root.removeAttribute('style');
    }
  }, [theme, customColors, mounted]);

  // Funktionen mit useCallback (optional, aber stabil)
  const changeTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    if (user?.id) {
      await supabase.from('profiles').update({ theme: newTheme }).eq('id', user.id);
    }
  };

  const updateName = async (name: string) => {
    setFullName(name);
    if (user?.id) {
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
      setCustomColors,
      isInitialLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
}