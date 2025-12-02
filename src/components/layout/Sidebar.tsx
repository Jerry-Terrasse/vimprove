import { useState } from 'react';
import { ChevronRight, Code2, ChevronDown, Languages, GitBranch } from 'lucide-react';
import { CATEGORIES } from '@/data';
import type { Lesson } from '@/core/types';
import { BRANCH_LINKS, CURRENT_BRANCH } from '@/version';
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
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const translateLessons = locale !== 'en';
  const branchOptions = [
    { key: 'release' as const, label: t('branchRelease', 'Release'), url: BRANCH_LINKS.release.url, version: BRANCH_LINKS.release.version },
    { key: 'alpha' as const, label: t('branchAlpha', 'Alpha'), url: BRANCH_LINKS.alpha.url, version: BRANCH_LINKS.alpha.version }
  ];
  const currentBranch = branchOptions.find(opt => opt.key === CURRENT_BRANCH) || branchOptions[0];

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
      <button
        onClick={onHomeClick}
        className="px-4 py-3 border-b border-stone-800 flex items-center gap-4 hidden md:flex text-left hover:bg-stone-900 transition-colors"
      >
        <img src="/favicon.png" alt="Vimprove" className="w-16 h-16 flex-shrink-0" />
        <span className="font-bold text-4xl logo-text text-stone-100">Vimprove</span>
      </button>

      <div className="flex-1 p-4 overflow-y-auto flex flex-col">
        <div className="flex-1">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="mb-5">
              <h3 className="text-sm font-bold text-green-400 uppercase tracking-wide mb-2 px-2 py-1 border-l-2 border-green-500">
                {translateLessons
                  ? t(`categories.${cat.id}`, cat.title, { ns: 'lessons' })
                  : cat.title}
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
                      {translateLessons
                        ? t(`lessons.${lesson.slug}.title`, lesson.title, { ns: 'lessons' })
                        : lesson.title}
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
              onClick={() => setIsBranchOpen(open => !open)}
              className="w-full flex items-center gap-2 justify-center bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 hover:border-green-600 transition-colors whitespace-nowrap"
            >
              <GitBranch size={16} />
              <span>{currentBranch.label}</span>
              <ChevronDown size={16} className={isBranchOpen ? 'transform rotate-180' : ''} />
            </button>
            {isBranchOpen && (
              <div
                className="absolute left-0 bottom-full mb-2 w-48 bg-stone-900 border border-stone-800 rounded-lg shadow-xl overflow-hidden"
                onMouseLeave={() => setIsBranchOpen(false)}
              >
                {branchOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      if (!opt.url) return;
                      window.location.href = opt.url;
                      setIsBranchOpen(false);
                    }}
                    disabled={!opt.url}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      CURRENT_BRANCH === opt.key
                        ? 'bg-green-700/30 text-white'
                        : opt.url
                          ? 'text-stone-200 hover:bg-stone-800'
                          : 'text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{opt.label}</span>
                      <span className="font-mono text-xs text-stone-400">v{opt.version}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(open => !open)}
              className="w-full flex items-center gap-2 justify-center bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 hover:border-green-600 transition-colors whitespace-nowrap"
            >
              <Languages size={16} />
              {supportedLocales.find(l => l.code === locale)?.shortLabel || locale}
              <ChevronDown size={16} className={isLangOpen ? 'transform rotate-180' : ''} />
            </button>
            {isLangOpen && (
              <div
                className="absolute right-0 bottom-full mb-2 w-44 bg-stone-900 border border-stone-800 rounded-lg shadow-xl overflow-hidden"
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
      </div>
    </div>
  );
};
