import { useState, useEffect } from 'react';
import { Menu, X, Settings, Github, SkipBack, SkipForward, Languages, ChevronDown } from 'lucide-react';
import { useTranslationSafe, useLocale } from '@/hooks/useI18n';
import { supportedLocales } from '@/i18n';

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
  const { locale, setLocale } = useLocale();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLangOpen, setIsLangOpen] = useState(false);

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
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="Vimprove" className="w-8 h-8" />
          <span className="font-bold text-lg logo-text">Vimprove</span>
        </div>

        {/* Right: All buttons evenly spaced */}
        <div className="flex items-center gap-1 relative">
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
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
              title={t('language', 'Language')}
            >
              <Languages size={20} />
            </button>
            {isLangOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-36 bg-stone-900 border border-stone-800 rounded-lg shadow-xl overflow-hidden z-50"
                onMouseLeave={() => setIsLangOpen(false)}
              >
                {supportedLocales.map(lng => (
                  <button
                    key={lng.code}
                    onClick={() => {
                      setLocale(lng.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      locale === lng.code
                        ? 'bg-green-700/30 text-white'
                        : 'text-stone-200 hover:bg-stone-800'
                    }`}
                  >
                    {lng.nativeLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
            title={t('settings', 'Settings')}
          >
            <Settings size={20} />
          </button>
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
            aria-label={t('menu', 'Menu')}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
