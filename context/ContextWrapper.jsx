"use client";

import React from 'react';
import { AppContextProvider } from './AppContext';
import { ThemeProvider } from './ThemeContext';
import { Toaster } from 'react-hot-toast';

export const ContextWrapper = ({ children }) => {
  return (
    <ThemeProvider>
      <AppContextProvider>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AppContextProvider>
    </ThemeProvider>
  );
}; 