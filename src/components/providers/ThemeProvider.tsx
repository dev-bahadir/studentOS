'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient'; 
import { useAuth } from './AuthProvider';

export type Theme = 'modern' | 'dark' | 'pastel' | 'custom';

type ThemeContextType = {
  theme: Theme;
  changeTheme: (t: Theme) => void;
  fullName: string;
  updateName: (name: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'modern', 
  changeTheme: () => {}, 
  fullName: '',
  updateName: () => {} 
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('modern');
  const [fullName, setFullName] = useState('');
  const [customColors, setCustomColors] = useState<any>(null);

  // --- 1. DATEN BEIM START LADEN (Das hat bei dir gefehlt) ---
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('theme, full_name, custom_colors') // Wir laden hier custom_colors
          .eq('id', user.id)
          .single();
          
        if (data) {
          if (data.theme) setTheme(data.theme as Theme);
          if (data.full_name) setFullName(data.full_name);
          if (data.custom_colors) setCustomColors(data.custom_colors); // Hier landen die Hex-Codes im State
        }
      };
      fetchProfile();
    }
  }, [user]);

  // --- 2. FARBEN ANWENDEN ---
  useEffect(() => {
    const root = document.documentElement;
    root.className = '';
    root.classList.add(`theme-${theme}`);

    if (theme === 'custom' && customColors) {
      Object.keys(customColors).forEach(key => {
        root.style.setProperty(`--${key}`, customColors[key]);
      });
    } else {
      root.removeAttribute('style');
    }
  }, [theme, customColors]);

  const changeTheme = async (newTheme: Theme) => {
    setTheme(newTheme);
    if (user) {
      if (newTheme !== 'custom') {
        document.documentElement.removeAttribute('style');
      }
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
    <ThemeContext.Provider value={{ theme, changeTheme, fullName, updateName }}>
      {children}
    </ThemeContext.Provider>
  );
}