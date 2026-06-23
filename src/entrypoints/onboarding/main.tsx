import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/styles/global.css';
import { Onboarding } from './Onboarding';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Onboarding />
  </React.StrictMode>,
);
