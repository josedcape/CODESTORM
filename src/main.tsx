import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { UIProvider } from './contexts/UIContext';
import './index.css';
import './animations.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UIProvider>
        <App />
      </UIProvider>
    </BrowserRouter>
  </StrictMode>
);
