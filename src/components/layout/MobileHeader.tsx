import { useState, useEffect } from 'react';
import { Menu, X, Settings, Github, SkipBack, SkipForward } from 'lucide-react';
import { useTranslationSafe } from '@/hooks/useI18n';

type MobileHeaderProps = {
  isVisible: boolean;
  sidebarOpen: boolean;
  onMenuToggle: () => void;
  onSettingsClick: () => void;
  showPrevButton?: boolean;
  showNextButton?: boolean;
  onPrevClick?: () => void;
  onNextClick?: () => void;
};

export const MobileHeader = ({
  isVisible,
  sidebarOpen,
  onMenuToggle,
  onSettingsClick,
  showPrevButton,
  showNextButton,
  onPrevClick,
  onNextClick
}: MobileHeaderProps) => {
  const { t } = useTranslationSafe('layout');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    // Find the scrollable content container
    const scrollContainer = document.querySelector('.flex-1.h-screen.overflow-y-auto') as HTMLElement;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;

      if (currentScrollY < 10) {
        // At top, always show header
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down, hide header (only after scrolling past 50px)
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up, show header
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (!isVisible) return null;

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50
        bg-stone-900/95 backdrop-blur-sm border-b border-stone-800
        transition-transform duration-300
        md:hidden
        ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Menu button */}
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
          aria-label={t('menu', 'Menu')}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Center: Logo and Title */}
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <img src="/favicon.png" alt="Vimprove" className="w-8 h-8" />
          <span className="font-bold text-lg logo-text">Vimprove</span>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          {showPrevButton && onPrevClick && (
            <button
              onClick={onPrevClick}
              className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
              title={t('prevLesson', 'Previous Lesson')}
            >
              <SkipBack size={20} />
            </button>
          )}
          {showNextButton && onNextClick && (
            <button
              onClick={onNextClick}
              className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
              title={t('nextLesson', 'Next Lesson')}
            >
              <SkipForward size={20} />
            </button>
          )}
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
            title={t('settings', 'Settings')}
          >
            <Settings size={20} />
          </button>
          <a
            href="https://github.com/Jerry-Terrasse/vimprove"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
            title={t('starOnGithub', 'Give me a Star!')}
          >
            <Github size={20} />
          </a>
        </div>
      </div>
    </header>
  );
};
