import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LocaleProvider } from '@/i18n/LocaleProvider';
import { Analytics } from "@vercel/analytics/react"
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <Analytics />
      <App />
    </LocaleProvider>
  </StrictMode>,
);
