import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { UIProvider } from './contexts/UIContext';
import { initializeFreshIntroExperience, setupGlobalIntroListeners } from './utils/introAnimationUtils';
import './index.css';
import './animations.css';

// Initialize fresh intro experience globally on app startup
initializeFreshIntroExperience();

// Set up global event listeners to ensure intro animations always show
setupGlobalIntroListeners();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UIProvider>
        <App />
      </UIProvider>
    </BrowserRouter>
  </StrictMode>
);
