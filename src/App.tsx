import { useState, useEffect } from 'react';
import { Settings, SkipBack, SkipForward, Github } from 'lucide-react';
import { LESSONS } from '@/data';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { HomePage } from '@/pages/HomePage';
import { LessonPage } from '@/pages/LessonPage';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { EditorStyleApplier } from '@/components/settings/EditorStyleApplier';
import { useTranslationSafe } from '@/hooks/useI18n';

type View = 'home' | 'lesson';

const LEARNING_STARTED_KEY = 'vimprove_learning_started';

const App = () => {
  // Check if user has started learning before
  const hasStartedLearning = localStorage.getItem(LEARNING_STARTED_KEY) === 'true';

  const [currentView, setCurrentView] = useState<View>(hasStartedLearning ? 'lesson' : 'home');
  const [currentLessonSlug, setCurrentLessonSlug] = useState(LESSONS[0].slug);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { t } = useTranslationSafe('layout');

  // Sidebar state: default closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      // Auto-open sidebar on desktop (md breakpoint is 768px)
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleStartLearning = () => {
    localStorage.setItem(LEARNING_STARTED_KEY, 'true');
    setCurrentView('lesson');
    setCurrentLessonSlug(LESSONS[0].slug);
  };

  const handleHomeClick = () => {
    localStorage.removeItem(LEARNING_STARTED_KEY);
    setCurrentView('home');
  };

  return (
    <SettingsProvider>
      <EditorStyleApplier />
      <div className="h-screen bg-stone-950 text-stone-200 font-sans flex overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader
          isVisible={currentView === 'lesson'}
          sidebarOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onSettingsClick={() => setSettingsOpen(true)}
          showPrevButton={currentLessonIdx > 0}
          showNextButton={currentLessonIdx < LESSONS.length - 1}
          onPrevClick={currentLessonIdx > 0 ? handlePrev : undefined}
          onNextClick={currentLessonIdx < LESSONS.length - 1 ? handleNext : undefined}
        />

        {/* Mobile Overlay */}
        {sidebarOpen && currentView === 'lesson' && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

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

        {/* Floating Action Buttons (Desktop Only) */}
        <div className="hidden md:flex fixed bottom-6 right-6 flex-col gap-3 z-40">
          {currentView === 'lesson' && currentLessonIdx > 0 && (
            <button
              onClick={handlePrev}
              className="w-14 h-14 flex items-center justify-center bg-stone-700 hover:bg-stone-600 border border-stone-600 rounded-full shadow-2xl transition-all hover:scale-110 text-stone-200 hover:text-white"
              title={t('prevLesson', 'Previous Lesson')}
            >
              <SkipBack size={24} />
            </button>
          )}
          {currentView === 'lesson' && currentLessonIdx < LESSONS.length - 1 && (
            <button
              onClick={handleNext}
              className="w-14 h-14 flex items-center justify-center bg-stone-700 hover:bg-stone-600 border border-stone-600 rounded-full shadow-2xl transition-all hover:scale-110 text-stone-200 hover:text-white"
              title={t('nextLesson', 'Next Lesson')}
            >
              <SkipForward size={24} />
            </button>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-14 h-14 p-4 bg-stone-700 hover:bg-stone-600 border border-stone-600 rounded-full shadow-2xl transition-all hover:scale-110 text-stone-200 hover:text-white"
            title={t('settings', 'Settings')}
          >
            <Settings size={24} />
          </button>
          <a
            href="https://github.com/Jerry-Terrasse/vimprove"
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 p-4 bg-stone-700 hover:bg-stone-600 border border-stone-600 rounded-full shadow-2xl transition-all hover:scale-110 text-stone-200 hover:text-white"
            title={t('starOnGithub', 'Give me a Star!')}
          >
            <Github size={24} />
          </a>
        </div>

        {/* Settings Panel */}
        <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </SettingsProvider>
  );
};

export default App;
