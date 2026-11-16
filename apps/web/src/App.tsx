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
  const [selectedFileForImage, setSelectedFileForImage] = useState<File | null>(null);
  const [storageUsageMb, setStorageUsageMb] = useState<number>(0);

  useEffect(() => {
    // Initial storage check
    getStorageQuota().then((q) => {
      setStorageUsageMb(q.usageBytes / (1024 * 1024));
    });
  }, [activePage]);

  const handleSelectFileForImageStudio = (file: File) => {
    setSelectedFileForImage(file);
    setActivePage('image');
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={setActivePage}
            onSelectFileForImageStudio={handleSelectFileForImageStudio}
          />
        );
      case 'image':
        return <ImageStudioPage initialFile={selectedFileForImage} />;
      case 'audio':
        return <AudioStudioPage />;
      case 'video':
        return <VideoStudioPage />;
      case 'document':
        return <DocumentStudioPage />;
      case 'archive':
        return <ArchiveStudioPage />;
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
            onSelectFileForImageStudio={handleSelectFileForImageStudio}
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
