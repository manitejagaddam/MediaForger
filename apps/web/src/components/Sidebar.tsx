import React from 'react';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  Archive,
  Sparkles,
  Layers,
  History,
  Settings,
  ShieldCheck,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { PageId } from '../types';

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
    { id: 'image', label: 'Image Studio', icon: ImageIcon },
    { id: 'audio', label: 'Audio Studio', icon: Music },
    { id: 'video', label: 'Video Studio', icon: Video },
    { id: 'document', label: 'Document Studio', icon: FileText },
    { id: 'archive', label: 'Archive Studio', icon: Archive },
    { id: 'ai', label: 'AI Studio', icon: Sparkles },
    { id: 'batch', label: 'Batch Processing', icon: Layers },
    { id: 'history', label: 'Conversion History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'Privacy & Specs', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 border-r border-gray-800 bg-[#0d121f] flex flex-col justify-between shrink-0 h-screen select-none">
      <div>
        {/* Brand */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-gray-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              MediaForge
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Local
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">Zero-Egress Studio</p>
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status Panel */}
      <div className="p-4 border-t border-gray-800/80 bg-[#090d16] space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            100% Local Engine
          </span>
          <span className="text-gray-400 text-[10px]">No Cloud</span>
        </div>

        <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-gray-400" />
              IndexedDB & OPFS
            </span>
            <span className="font-mono text-gray-300 font-semibold">{storageUsageMb.toFixed(1)} MB</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, (storageUsageMb / 100) * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
