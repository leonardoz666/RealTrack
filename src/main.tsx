import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/globals.css';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const suppressedConsolePrefixes = ['[Telegram.WebView]'];

// Filter Telegram WebApp noise from the console without muting other logs.
if (typeof console !== 'undefined') {
  const originalLog = console.log;

  console.log = (...args) => {
    const firstArg = args[0];
    const shouldSuppress =
      typeof firstArg === 'string' &&
      suppressedConsolePrefixes.some((prefix) => firstArg.startsWith(prefix));

    if (!shouldSuppress) {
      originalLog(...args);
    }
  };
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento root não encontrado');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
