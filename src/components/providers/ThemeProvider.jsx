import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY: Convert HEX to HSL for CSS Variables
// ═══════════════════════════════════════════════════════════════════════════
function hexToHSL(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: h = 0;
    }
  }
  
  // Return as CSS-compatible HSL string (without "hsl()" wrapper)
  // Format: "H S% L%" for use with Tailwind's HSL variables
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════
// THEME DEFINITIONS - Each theme includes full color palette with HSL values
// ═══════════════════════════════════════════════════════════════════════════
export const THEMES = {
  terracotta: { 
    name: 'terracotta', 
    label: 'טרקוטה', 
    primary: '#984E39',
    // HSL values for CSS injection (light mode)
    hsl: {
      primary: '13 45% 41%',
      primaryForeground: '36 25% 96%',
      ring: '13 45% 41%',
      // Chart colors
      chart1: '13 45% 41%',
    },
    // Dark mode HSL overrides
    hslDark: {
      primary: '13 50% 55%',
      primaryForeground: '20 14% 10%',
      ring: '13 50% 55%',
      chart1: '13 50% 55%',
    }
  },
  forest: { 
    name: 'forest', 
    label: 'יער', 
    primary: '#354231',
    hsl: {
      primary: '106 15% 23%',
      primaryForeground: '36 25% 96%',
      ring: '106 15% 23%',
      chart1: '106 15% 23%',
    },
    hslDark: {
      primary: '106 20% 35%',
      primaryForeground: '36 20% 90%',
      ring: '106 20% 35%',
      chart1: '106 25% 45%',
    }
  },
  taupe: { 
    name: 'taupe', 
    label: 'אפור חמים', 
    primary: '#8C7D70',
    hsl: {
      primary: '28 12% 49%',
      primaryForeground: '36 25% 96%',
      ring: '28 12% 49%',
      chart1: '28 12% 49%',
    },
    hslDark: {
      primary: '28 15% 55%',
      primaryForeground: '20 14% 10%',
      ring: '28 15% 55%',
      chart1: '28 15% 55%',
    }
  },
  espresso: { 
    name: 'espresso', 
    label: 'אספרסו', 
    primary: '#4A3B32',
    hsl: {
      primary: '23 19% 24%',
      primaryForeground: '36 25% 96%',
      ring: '23 19% 24%',
      chart1: '23 19% 24%',
    },
    hslDark: {
      primary: '23 20% 40%',
      primaryForeground: '36 20% 90%',
      ring: '23 20% 40%',
      chart1: '23 20% 40%',
    }
  },
};

// Organic Modernism Theme (static colors for reference)
const organicTheme = {
  terracotta: '#984E39',
  forestGreen: '#354231',
  taupe: '#8C7D70',
  espresso: '#4A3B32',
  offWhite: '#F7F5F2',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [customColors, setCustomColors] = useState({});
  const [currentTheme, setCurrentTheme] = useState('terracotta');

  // ═══════════════════════════════════════════════════════════════════════════
  // APPLY CSS VARIABLES TO DOM
  // This is the core function that makes themes actually work
  // ═══════════════════════════════════════════════════════════════════════════
  const applyCSSVariables = useCallback((themeName, dark, customPrimary = null) => {
    const root = document.documentElement;
    const theme = THEMES[themeName] || THEMES.terracotta;
    
    // Determine which HSL values to use (light vs dark mode)
    const hslValues = dark ? theme.hslDark : theme.hsl;
    
    // If custom primary color is set, calculate its HSL and override
    if (customPrimary) {
      const customHSL = hexToHSL(customPrimary);
      root.style.setProperty('--primary', customHSL);
      root.style.setProperty('--ring', customHSL);
      root.style.setProperty('--chart-1', customHSL);
      // Also update terracotta for scrollbar and other elements
      root.style.setProperty('--terracotta', customHSL);
    } else {
      // Apply theme's HSL values
      root.style.setProperty('--primary', hslValues.primary);
      root.style.setProperty('--ring', hslValues.ring);
      root.style.setProperty('--chart-1', hslValues.chart1);
      root.style.setProperty('--terracotta', hslValues.primary);
    }
    
    // Always set primary-foreground based on theme
    root.style.setProperty('--primary-foreground', hslValues.primaryForeground);
    
    // Debug logging only in development
    if (import.meta.env.DEV) {
      console.log(`[ThemeProvider] Applied theme: ${themeName}, dark: ${dark}, custom: ${customPrimary || 'none'}`);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION: Load saved preferences
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Check for saved preference or system preference
    const savedMode = localStorage.getItem('archiflow-dark-mode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let initialDarkMode = false;
    if (savedMode !== null) {
      initialDarkMode = savedMode === 'true';
    } else {
      initialDarkMode = systemPrefersDark;
    }
    setIsDarkMode(initialDarkMode);

    // Load custom colors
    let loadedCustomColors = {};
    const savedCustomColors = localStorage.getItem('archiflow-custom-colors');
    if (savedCustomColors) {
      try {
        loadedCustomColors = JSON.parse(savedCustomColors);
        setCustomColors(loadedCustomColors);
      } catch (e) {
        console.error('Failed to parse custom colors:', e);
      }
    }

    // Load theme
    let loadedTheme = 'terracotta';
    const savedTheme = localStorage.getItem('archiflow-theme');
    if (savedTheme && THEMES[savedTheme]) {
      loadedTheme = savedTheme;
      setCurrentTheme(loadedTheme);
    }

    // Apply CSS variables immediately on load
    applyCSSVariables(loadedTheme, initialDarkMode, loadedCustomColors.primary || null);
  }, [applyCSSVariables]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECT: Apply changes when theme, dark mode, or custom colors change
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark mode class
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply CSS variables for current theme
    applyCSSVariables(currentTheme, isDarkMode, customColors.primary || null);
    
    // Save preference
    localStorage.setItem('archiflow-dark-mode', isDarkMode.toString());
  }, [isDarkMode, currentTheme, customColors, applyCSSVariables]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = (value) => {
    setIsDarkMode(value);
  };

  const updateCustomColors = (colors) => {
    setCustomColors(colors);
    localStorage.setItem('archiflow-custom-colors', JSON.stringify(colors));
  };

  const changeTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
      // Clear custom colors when switching to a preset theme
      setCustomColors({});
      localStorage.removeItem('archiflow-custom-colors');
      localStorage.setItem('archiflow-theme', themeName);
    }
  };

  const resetTheme = () => {
    setIsDarkMode(false);
    setCustomColors({});
    setCurrentTheme('terracotta');
    localStorage.removeItem('archiflow-dark-mode');
    localStorage.removeItem('archiflow-custom-colors');
    localStorage.removeItem('archiflow-theme');
    document.documentElement.classList.remove('dark');
    // Reset CSS variables to default terracotta theme
    applyCSSVariables('terracotta', false, null);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════════════════════
  const value = React.useMemo(() => ({
    // State
    isDarkMode,
    currentTheme,
    customColors,
    // Static references
    colors: organicTheme,
    themes: THEMES,
    // Actions
    toggleDarkMode,
    setDarkMode,
    updateCustomColors,
    resetTheme,
    changeTheme,
    // Utility for getting current theme's primary color
    getCurrentPrimaryColor: () => {
      if (customColors.primary) return customColors.primary;
      return THEMES[currentTheme]?.primary || THEMES.terracotta.primary;
    },
  }), [isDarkMode, customColors, currentTheme, changeTheme, resetTheme, updateCustomColors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};