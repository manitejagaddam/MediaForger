import React from 'react';
import ReactDOM from 'react-dom/client';
import { PopupApp } from './popup';

export const SidepanelApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4">
      <PopupApp />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SidepanelApp />
  </React.StrictMode>
);
