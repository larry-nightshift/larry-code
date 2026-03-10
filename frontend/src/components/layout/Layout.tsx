import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

type Feature = 'dashboard' | 'focus' | 'notes' | 'tasks' | 'recipes' | 'grocery' | 'habits' | 'maintenance' | 'posts' | 'crm';

interface LayoutProps {
  currentFeature: Feature;
  onFeatureChange: (feature: Feature) => void;
  children: React.ReactNode;
}

export function Layout({ currentFeature, onFeatureChange, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="flex min-h-screen">
        <Sidebar
          currentFeature={currentFeature}
          onFeatureChange={onFeatureChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
