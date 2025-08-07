"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [colorScheme, setColorScheme] = useState('medical'); // medical, modern, classic
  
  useEffect(() => {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('clinic-theme');
    const savedColorScheme = localStorage.getItem('clinic-color-scheme');
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    } else {
      // Default to dark theme
      setTheme('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('clinic-theme', 'dark');
    }
    
    if (savedColorScheme) {
      setColorScheme(savedColorScheme);
      document.documentElement.setAttribute('data-color-scheme', savedColorScheme);
    } else {
      // Default to medical color scheme
      setColorScheme('medical');
      document.documentElement.setAttribute('data-color-scheme', 'medical');
      localStorage.setItem('clinic-color-scheme', 'medical');
    }
    
    // Force a re-render to ensure theme is applied
    document.documentElement.style.setProperty('--theme-applied', 'true');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('clinic-theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };

  const setColorSchemeTheme = (scheme) => {
    setColorScheme(scheme);
    localStorage.setItem('clinic-color-scheme', scheme);
    document.documentElement.setAttribute('data-color-scheme', scheme);
  };

  // Medical color schemes
  const colorSchemes = {
    medical: {
      primary: '#2563eb', // Medical blue
      secondary: '#059669', // Medical green
      accent: '#dc2626', // Medical red for alerts
      neutral: '#6b7280', // Medical gray
      success: '#10b981', // Success green
      warning: '#f59e0b', // Warning amber
      error: '#ef4444', // Error red
    },
    modern: {
      primary: '#7c3aed', // Modern purple
      secondary: '#06b6d4', // Modern cyan
      accent: '#f97316', // Modern orange
      neutral: '#64748b', // Modern slate
      success: '#22c55e', // Modern green
      warning: '#eab308', // Modern yellow
      error: '#f43f5e', // Modern red
    },
    classic: {
      primary: '#1f2937', // Classic dark
      secondary: '#374151', // Classic gray
      accent: '#d97706', // Classic amber
      neutral: '#6b7280', // Classic gray
      success: '#059669', // Classic green
      warning: '#d97706', // Classic amber
      error: '#dc2626', // Classic red
    },
  };

  const getCurrentColorScheme = () => {
    return colorSchemes[colorScheme] || colorSchemes.medical;
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      colorScheme, 
      setColorSchemeTheme, 
      colorSchemes,
      getCurrentColorScheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 