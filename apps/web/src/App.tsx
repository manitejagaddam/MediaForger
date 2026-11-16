import React, { useState, useEffect } from 'react';
import { PageId } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ImageStudioPage } from './pages/ImageStudioPage';
import { AudioStudioPage } from './pages/AudioStudioPage';
import { VideoStudioPage } from './pages/VideoStudioPage';
import { DocumentStudioPage } from './pages/DocumentStudioPage';
import { ArchiveStudioPage } from './pages/ArchiveStudioPage';
import { AiStudioPage } from './pages/AiStudioPage';
import { BatchStudioPage } from './pages/BatchStudioPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { getStorageQuota } from '@mediaforge/storage';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [storageUsageMb, setStorageUsageMb] = useState<number>(0);

  useEffect(() => {
    // Initial storage check
    getStorageQuota().then((q) => {
      setStorageUsageMb(q.usageBytes / (1024 * 1024));
    });
  }, [activePage]);

  const handleSelectFile = (file: File, targetStudio: PageId) => {
    setActiveFile(file);
    setActivePage(targetStudio);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={setActivePage}
            onSelectFile={handleSelectFile}
          />
        );
      case 'image':
        return <ImageStudioPage initialFile={activeFile} />;
      case 'audio':
        return <AudioStudioPage initialFile={activeFile} />;
      case 'video':
        return <VideoStudioPage initialFile={activeFile} />;
      case 'document':
        return <DocumentStudioPage initialFile={activeFile} />;
      case 'archive':
        return <ArchiveStudioPage initialFile={activeFile} />;
      case 'ai':
        return <AiStudioPage />;
      case 'batch':
        return <BatchStudioPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      case 'about':
        return <AboutPage />;
      default:
        return (
          <DashboardPage
            onNavigate={setActivePage}
            onSelectFile={handleSelectFile}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-gray-100 overflow-hidden font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        storageUsageMb={storageUsageMb}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header activePage={activePage} />
        <main className="flex-1 overflow-y-auto">{renderActivePage()}</main>
      </div>
    </div>
  );
};

