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
  const [studioFiles, setStudioFiles] = useState<{
    image: File | null;
    audio: File | null;
    video: File | null;
    document: File | null;
    archive: File | null;
    ai: File | null;
  }>({
    image: null,
    audio: null,
    video: null,
    document: null,
    archive: null,
    ai: null,
  });
  const [storageUsageMb, setStorageUsageMb] = useState<number>(0);

  useEffect(() => {
    // Initial storage check
    getStorageQuota().then((q) => {
      setStorageUsageMb(q.usageBytes / (1024 * 1024));
    });
  }, [activePage]);

  const handleSelectFile = (file: File, targetStudio: PageId) => {
    // Isolate file strictly to the corresponding target studio
    if (targetStudio in studioFiles) {
      setStudioFiles((prev) => ({
        ...prev,
        [targetStudio]: file,
      }));
    }
    setActivePage(targetStudio);
  };

  const handleClearStudioFile = (
    studio: 'image' | 'audio' | 'video' | 'document' | 'archive' | 'ai'
  ) => {
    setStudioFiles((prev) => ({
      ...prev,
      [studio]: null,
    }));
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
        return (
          <ImageStudioPage
            initialFile={studioFiles.image}
            onClearFile={() => handleClearStudioFile('image')}
          />
        );
      case 'audio':
        return (
          <AudioStudioPage
            initialFile={studioFiles.audio}
            onClearFile={() => handleClearStudioFile('audio')}
          />
        );
      case 'video':
        return (
          <VideoStudioPage
            initialFile={studioFiles.video}
            onClearFile={() => handleClearStudioFile('video')}
          />
        );
      case 'document':
        return (
          <DocumentStudioPage
            initialFile={studioFiles.document}
            onClearFile={() => handleClearStudioFile('document')}
          />
        );
      case 'archive':
        return (
          <ArchiveStudioPage
            initialFile={studioFiles.archive}
            onClearFile={() => handleClearStudioFile('archive')}
          />
        );
      case 'ai':
        return (
          <AiStudioPage
            initialFile={studioFiles.ai}
            onClearFile={() => handleClearStudioFile('ai')}
            onSendToImageStudio={(file) => handleSelectFile(file, 'image')}
          />
        );
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
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans selection:bg-zinc-800 selection:text-white">
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

