import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeName =
  | 'cosmic-dark'      // Dark theme with gradients
  | 'pure-white'       // Clean white light theme

export interface ThemeColors {
  name: ThemeName;
  displayName: string;
  description: string;

  // Background colors
  background: string;
  backgroundSecondary: string;

  // Surface colors (cards, panels)
  surface: string;
  surfaceHover: string;

  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;

  // Accent colors
  accent: string;
  accentSecondary: string;

  // Border colors
  border: string;
  borderHover: string;

  // Input colors
  input: string;
  inputBorder: string;

  // Special
  gradient: string;
  shadow: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  'cosmic-dark': {
    name: 'cosmic-dark',
    displayName: 'Dark Gradient',
    description: 'Dark theme with cyan and purple gradients',
    background: 'linear-gradient(135deg, #0a0e27 0%, #1a1a2e 50%, #16213e 100%)',
    backgroundSecondary: 'rgba(15, 23, 42, 0.95)',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceHover: 'rgba(255, 255, 255, 0.1)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.9)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    accent: '#00FFF0',
    accentSecondary: '#8A2BE2',
    border: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(255, 255, 255, 0.2)',
    input: 'rgba(255, 255, 255, 0.05)',
    inputBorder: 'rgba(255, 255, 255, 0.2)',
    gradient: 'linear-gradient(135deg, #00FFF0 0%, #8A2BE2 100%)',
    shadow: 'rgba(0, 255, 240, 0.1)',
  },
  'pure-white': {
    name: 'pure-white',
    displayName: 'Light Gradient',
    description: 'Clean white theme with green accents',
    background: '#ffffff',
    backgroundSecondary: '#f7f7f8',
    surface: '#ffffff',
    surfaceHover: '#f0f0f0',
    text: '#000000',
    textSecondary: '#1f1f1f',
    textMuted: '#666666',
    accent: '#10a37f',
    accentSecondary: '#0e8c6f',
    border: 'rgba(0, 0, 0, 0.1)',
    borderHover: 'rgba(0, 0, 0, 0.2)',
    input: '#ffffff',
    inputBorder: '#d1d1d1',
    gradient: 'linear-gradient(135deg, #10a37f 0%, #0e8c6f 100%)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
};

interface ThemeContextType {
  currentTheme: ThemeName;
  themeColors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
  availableThemes: ThemeColors[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('kroniq_theme');

    // Migrate old theme values to new theme names
    if (saved === 'dark') return 'cosmic-dark';
    if (saved === 'light') return 'pure-white';

    // Validate that saved theme exists
    if (saved && themes[saved as ThemeName]) {
      return saved as ThemeName;
    }

    // Default to cosmic-dark
    return 'cosmic-dark';
  });

  const themeColors = themes[currentTheme] || themes['cosmic-dark'];

  useEffect(() => {
    // Safety check - ensure theme exists
    if (!themeColors) {
      console.error('Theme colors not found for:', currentTheme);
      return;
    }

    localStorage.setItem('kroniq_theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', themeColors.background);
    root.style.setProperty('--bg-secondary', themeColors.backgroundSecondary);
    root.style.setProperty('--surface', themeColors.surface);
    root.style.setProperty('--surface-hover', themeColors.surfaceHover);
    root.style.setProperty('--text-primary', themeColors.text);
    root.style.setProperty('--text-secondary', themeColors.textSecondary);
    root.style.setProperty('--text-muted', themeColors.textMuted);
    root.style.setProperty('--accent', themeColors.accent);
    root.style.setProperty('--accent-secondary', themeColors.accentSecondary);
    root.style.setProperty('--border', themeColors.border);
    root.style.setProperty('--border-hover', themeColors.borderHover);
    root.style.setProperty('--input', themeColors.input);
    root.style.setProperty('--input-border', themeColors.inputBorder);
    root.style.setProperty('--gradient', themeColors.gradient);
    root.style.setProperty('--shadow', themeColors.shadow);

    // Set body background
    document.body.style.background = themeColors.background;

    // Update favicon
    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = '/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png';
    }
  }, [currentTheme]);

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
  };

  const availableThemes = Object.values(themes);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeColors, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};
