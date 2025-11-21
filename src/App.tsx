import { useState } from 'react';
import { Settings } from 'lucide-react';
import { LESSONS } from '@/data';
import { Sidebar } from '@/components/layout/Sidebar';
import { HomePage } from '@/pages/HomePage';
import { LessonPage } from '@/pages/LessonPage';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { EditorStyleApplier } from '@/components/settings/EditorStyleApplier';

type View = 'home' | 'lesson';

const App = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [currentLessonSlug, setCurrentLessonSlug] = useState(LESSONS[0].slug);
  const [sidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const currentLessonIdx = LESSONS.findIndex(l => l.slug === currentLessonSlug);
  const currentLesson = LESSONS[currentLessonIdx];

  const handleNext = () => {
    if (currentLessonIdx < LESSONS.length - 1) {
      setCurrentLessonSlug(LESSONS[currentLessonIdx + 1].slug);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentLessonIdx > 0) {
      setCurrentLessonSlug(LESSONS[currentLessonIdx - 1].slug);
      window.scrollTo(0, 0);
    }
  };

  const handleLessonSelect = (slug: string) => {
    setCurrentLessonSlug(slug);
    setCurrentView('lesson');
    window.scrollTo(0, 0);
  };

  const handleStartLearning = () => {
    setCurrentView('lesson');
    setCurrentLessonSlug(LESSONS[0].slug);
  };

  const handleHomeClick = () => {
    setCurrentView('home');
  };

  return (
    <SettingsProvider>
      <EditorStyleApplier />
      <div className="h-screen bg-stone-950 text-stone-200 font-sans flex overflow-hidden">
        <Sidebar
          lessons={LESSONS}
          currentLessonSlug={currentLessonSlug}
          onLessonSelect={handleLessonSelect}
          onHomeClick={handleHomeClick}
          isOpen={sidebarOpen}
          isVisible={currentView === 'lesson'}
        />

        <div className="flex-1 h-screen overflow-y-auto bg-stone-950 relative">
          {currentView === 'home' ? (
            <HomePage onStart={handleStartLearning} />
          ) : (
            <LessonPage
              lesson={currentLesson}
              onNext={currentLessonIdx < LESSONS.length - 1 ? handleNext : undefined}
              onPrev={currentLessonIdx > 0 ? handlePrev : undefined}
            />
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-stone-800 hover:bg-stone-700 rounded-full shadow-2xl transition-all hover:scale-110 text-stone-300 hover:text-white z-40"
          title="Settings"
        >
          <Settings size={24} />
        </button>

        {/* Settings Panel */}
        <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </SettingsProvider>
  );
};

export default App;
