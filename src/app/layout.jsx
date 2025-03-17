import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import './globals.css'; // импорт глобальных стилей (где определены CSS-переменные по умолчанию)

export default function RootLayout({ children }) {
  useEffect(() => {
    if (window.Telegram?.WebApp?.themeParams) {
      const theme = window.Telegram.WebApp.themeParams;
      document.documentElement.style.setProperty('--bg-color', theme.bg_color || '#ffffff');
      document.documentElement.style.setProperty('--text-color', theme.text_color || '#000000');
      // document.documentElement.style.setProperty("--font-family", theme.font_family || "system-ui");
    }
  }, []);

  return (
    <html lang="en">
      <head>
        {/* Метатеги и заголовок */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Botly</title>
      </head>
      <body className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]">
        {/* <body className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]"> */}
        <Toaster />
        {children}
      </body>
    </html>
  );
}
