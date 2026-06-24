import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/styles/global.css';
import { initTheme } from '@/lib/theme';
import { SidePanel } from './SidePanel';

void initTheme();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>,
);
