import { useState } from 'react';
import { ChevronRight, Home as HomeIcon, Code2, ChevronDown, Languages } from 'lucide-react';
import { CATEGORIES } from '@/data';
import type { Lesson } from '@/core/types';
import { VERSION, VERSION_LABEL } from '@/version';
import { supportedLocales } from '@/i18n';
import { useTranslationSafe, useLocale } from '@/hooks/useI18n';

type SidebarProps = {
  lessons: Lesson[];
  currentLessonSlug: string;
  onLessonSelect: (slug: string) => void;
  onHomeClick: () => void;
  isOpen: boolean;
  isVisible: boolean;
};

export const Sidebar = ({
  lessons,
  currentLessonSlug,
  onLessonSelect,
  onHomeClick,
  isOpen,
  isVisible
}: SidebarProps) => {
  const { t } = useTranslationSafe('layout');
  const { locale, setLocale } = useLocale();
  const [isLangOpen, setIsLangOpen] = useState(false);

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-screen bg-stone-900 border-r border-stone-800 transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${!isVisible ? '-translate-x-full' : isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:h-screen md:max-w-none
        ${!isVisible ? 'md:hidden' : ''}
      `}
    >
      {/* Header: hidden on mobile to save vertical space */}
      <div className="px-4 py-3 border-b border-stone-800 flex items-center gap-4 hidden md:flex">
        <img src="/favicon.png" alt="Vimprove" className="w-16 h-16 flex-shrink-0" />
        <span className="font-bold text-4xl logo-text">Vimprove</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col">
        <div className="flex-1">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="mb-5">
              <h3 className="text-sm font-bold text-green-400 uppercase tracking-wide mb-2 px-2 py-1 border-l-2 border-green-500">
                {t(`categories.${cat.id}`, cat.title, { ns: 'lessons' })}
              </h3>
              <div className="space-y-0.5">
                {lessons
                  .filter(l => l.categoryId === cat.id)
                  .map(lesson => (
                    <button
                      key={lesson.slug}
                      onClick={() => onLessonSelect(lesson.slug)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                      ${
                        currentLessonSlug === lesson.slug
                          ? 'bg-stone-800 text-white'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }
                    `}
                    >
                      {t(`lessons.${lesson.slug}.title`, lesson.title, { ns: 'lessons' })}
                      {currentLessonSlug === lesson.slug && (
                        <ChevronRight size={14} className="text-stone-500" />
                      )}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

      </div>

      <div className="border-t border-stone-800 px-4 py-3 bg-stone-950/50 space-y-3">
        <div className="grid grid-cols-2 gap-2 items-center">
          <div className="relative">
            <button
              onClick={onHomeClick}
              className="w-full flex items-center justify-center gap-2 text-stone-300 bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-sm hover:border-green-600 transition-colors"
            >
              <HomeIcon size={16} /> {t('home')}
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(open => !open)}
              className="w-full flex items-center gap-2 justify-center bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 hover:border-green-600 transition-colors"
            >
              <Languages size={16} />
              {supportedLocales.find(l => l.code === locale)?.shortLabel || locale}
              <ChevronDown size={16} className={isLangOpen ? 'transform rotate-180' : ''} />
            </button>
            {isLangOpen && (
              <div
                className="absolute left-full ml-2 bottom-0 w-44 bg-stone-900 border border-stone-800 rounded-lg shadow-xl overflow-hidden"
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
        </div>
        <div className="flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <Code2 size={12} className="text-stone-700" />
            <span className="font-mono">v{VERSION}</span>
          </div>
          <span className="text-stone-700">{VERSION_LABEL}</span>
        </div>
      </div>
    </div>
  );
};
