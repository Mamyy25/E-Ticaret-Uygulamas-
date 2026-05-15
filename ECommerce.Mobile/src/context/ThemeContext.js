import React, { createContext, useState, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as darkColors } from '../theme/colors';
import { lightColors } from '../theme/lightColors';

export const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    try { await AsyncStorage.setItem('theme', next ? 'dark' : 'light'); } catch {}
  }, [isDark]);

  const loadTheme = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('theme');
      if (saved) setIsDark(saved === 'dark');
    } catch {}
  }, []);

  const theme = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, loadTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
