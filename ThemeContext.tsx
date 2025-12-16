
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'gold' | 'silver' | 'green' | 'white' | 'red';

export const THEMES: { id: Theme; name: string; color: string }[] = [
  { id: 'gold', name: 'Royal Gold', color: '#EAB308' },
  { id: 'silver', name: 'Platinum Noir', color: '#94a3b8' }, // Black & Dark Silver
  { id: 'red', name: 'Crimson Velvet', color: '#dc2626' },   // Red & Dark
  { id: 'green', name: 'Emerald Prestige', color: '#059669' }, // Green & Dark
  { id: 'white', name: 'Titanium White', color: '#f8fafc' },   // White & Carbon
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('gold');

  useEffect(() => {
    // Remove all theme classes
    document.body.classList.remove('theme-gold', 'theme-silver', 'theme-green', 'theme-white', 'theme-red');
    // Add current theme class
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
