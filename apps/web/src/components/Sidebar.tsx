import React from 'react';
import {
  LayoutDashboard,
  HardDrive,
} from 'lucide-react';
import { PageId } from '../types';
import {
  MediaForgeLogo,
  ForgeImageIcon,
  ForgeAudioIcon,
  ForgeVideoIcon,
  ForgeDocumentIcon,
  ForgeArchiveIcon,
  ForgeAiIcon,
  ForgeBatchIcon,
  ForgeHistoryIcon,
  ForgeSettingsIcon,
  ForgeShieldIcon,
} from './icons/StudioIcons';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  storageUsageMb?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  storageUsageMb = 0,
}) => {
  const navItems: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'image', label: 'Image Studio', icon: ForgeImageIcon },
    { id: 'audio', label: 'Audio Studio', icon: ForgeAudioIcon },
    { id: 'video', label: 'Video Studio', icon: ForgeVideoIcon },
    { id: 'document', label: 'Document Studio', icon: ForgeDocumentIcon },
    { id: 'archive', label: 'Archive Studio', icon: ForgeArchiveIcon },
    { id: 'ai', label: 'AI Studio', icon: ForgeAiIcon },
    { id: 'batch', label: 'Batch Processing', icon: ForgeBatchIcon },
    { id: 'history', label: 'Conversion History', icon: ForgeHistoryIcon },
    { id: 'settings', label: 'Settings', icon: ForgeSettingsIcon },
    { id: 'about', label: 'Privacy & Specs', icon: ForgeShieldIcon },
  ];

  return (
    <aside className="w-64 border-r border-[#1e1e24] bg-[#0c0c0f] flex flex-col justify-between shrink-0 h-screen select-none">
      <div>
        {/* Brand */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-[#1e1e24]">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center shadow-sm">
            <MediaForgeLogo className="w-7 h-7" size={28} />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              MediaForge
              <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/80">
                Local
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500 font-medium">Privacy-First Engine</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-800/90 text-white border border-zinc-700/80 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60 border border-transparent hover:border-zinc-800/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-zinc-100' : 'text-zinc-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status Panel */}
      <div className="p-4 border-t border-[#1e1e24] bg-[#0a0a0c] space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-2 text-zinc-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            100% On-Device
          </span>
          <span className="text-zinc-500 text-[10px] font-mono">Zero Egress</span>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/70 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
              Local Storage
            </span>
            <span className="font-mono text-zinc-300 font-semibold">{storageUsageMb.toFixed(1)} MB</span>
          </div>
          <div className="w-full bg-zinc-800/80 h-1 rounded-full overflow-hidden">
            <div
              className="bg-zinc-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, (storageUsageMb / 100) * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
