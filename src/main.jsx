import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        className: 'toast',
        duration: 4000,
        style: {
          background: 'rgba(34, 34, 34, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(229, 254, 68, 0.2)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: '0.75rem',
          padding: '0.75rem 1rem',
        },
        success: {
          className: 'toast-success',
          style: {
            background: '#E5FE44',
            border: 'none',
            color: '#000000',
          },
          iconTheme: {
            primary: '#000000',
            secondary: '#E5FE44',
          },
        },
        error: {
          className: 'toast-error',
          style: {
            background: '#EF4444',
            border: 'none',
            color: '#ffffff',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#EF4444',
          },
        },
      }}
    />
  </StrictMode>,
);
