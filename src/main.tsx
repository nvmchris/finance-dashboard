import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createSampleData } from './lib/sample';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

// `?demo` shows sample data without touching what is saved in this browser.
const demo = new URLSearchParams(window.location.search).has('demo');

createRoot(root).render(
  <StrictMode>
    <App initial={demo ? createSampleData() : undefined} persist={!demo} />
  </StrictMode>,
);
