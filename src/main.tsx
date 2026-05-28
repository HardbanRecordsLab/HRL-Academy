import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { AudioPlayerBar } from './components/AudioPlayerBar';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudioPlayerProvider>
      <App />
      <AudioPlayerBar />
    </AudioPlayerProvider>
  </StrictMode>,
);
