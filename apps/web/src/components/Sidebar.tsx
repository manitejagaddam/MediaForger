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
  const studioItems: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'image', label: 'Images', icon: ForgeImageIcon },
    { id: 'audio', label: 'Audio', icon: ForgeAudioIcon },
    { id: 'video', label: 'Video', icon: ForgeVideoIcon },
    { id: 'document', label: 'Documents', icon: ForgeDocumentIcon },
    { id: 'archive', label: 'Archives', icon: ForgeArchiveIcon },
    { id: 'ai', label: 'AI Studio', icon: ForgeAiIcon },
  ];

  const utilityItems: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'batch', label: 'Batch Queue', icon: ForgeBatchIcon },
    { id: 'history', label: 'History', icon: ForgeHistoryIcon },
    { id: 'settings', label: 'Settings', icon: ForgeSettingsIcon },
    { id: 'about', label: 'Specs & Privacy', icon: ForgeShieldIcon },
  ];

  return (
    <aside className="w-56 border-r border-[#1a1a20] bg-[#09090b] flex flex-col justify-between shrink-0 h-screen select-none">
      <div>
        {/* Brand */}
        <div className="h-16 flex items-center px-4 gap-3 border-b border-[#1a1a20]">
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shrink-0 border border-white/[0.14] bg-[#121216]">
            <img
              src="/logo.png?v=3"
              alt="MediaForge"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight text-white leading-tight truncate">MediaForge</span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider">LOCAL STUDIO</span>
          </div>
        </div>

        {/* Navigation sections */}
        <div className="p-2 space-y-4">
          <div>
            <span className="px-2.5 text-[10px] font-medium tracking-wider uppercase text-zinc-600 block mb-1">
              Studios
            </span>
            <nav className="space-y-0.5">
              {studioItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      isActive
                        ? 'bg-[#18181f] text-white font-medium border border-white/[0.08]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121216] border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-zinc-100' : 'text-zinc-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <span className="px-2.5 text-[10px] font-medium tracking-wider uppercase text-zinc-600 block mb-1">
              Workspace
            </span>
            <nav className="space-y-0.5">
              {utilityItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      isActive
                        ? 'bg-[#18181f] text-white font-medium border border-white/[0.08]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121216] border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-zinc-100' : 'text-zinc-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Storage & Environment Footer */}
      <div className="p-3 border-t border-[#1a1a20] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3 h-3 text-zinc-600" />
            Storage
          </span>
          <span className="font-mono text-zinc-400">{storageUsageMb.toFixed(1)} MB</span>
        </div>
        <div className="w-full bg-[#16161c] h-1 rounded-full overflow-hidden">
          <div
            className="bg-zinc-500 h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(3, (storageUsageMb / 200) * 100))}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
