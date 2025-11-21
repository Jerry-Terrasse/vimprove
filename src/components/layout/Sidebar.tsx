import { ChevronRight, Home as HomeIcon, Code2 } from 'lucide-react';
import { CATEGORIES } from '@/data';
import type { Lesson } from '@/core/types';
import { VERSION, VERSION_LABEL } from '@/version';

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
  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-50 w-72 h-screen bg-stone-900 border-r border-stone-800 transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${!isVisible ? '-translate-x-full' : isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:h-screen
        ${!isVisible ? 'md:hidden' : ''}
      `}
    >
      <div className="px-4 py-3 border-b border-stone-800 flex items-center gap-4">
        <img src="/favicon.png" alt="Vimprove" className="w-16 h-16 flex-shrink-0" />
        <span className="font-bold text-4xl logo-text">Vimprove</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="mb-8">
            <h3 className="text-sm font-bold text-green-400 uppercase tracking-wide mb-4 px-2 py-1 border-l-2 border-green-500">
              {cat.title}
            </h3>
            <div className="space-y-1">
              {lessons
                .filter(l => l.categoryId === cat.id)
                .map(lesson => (
                  <button
                    key={lesson.slug}
                    onClick={() => onLessonSelect(lesson.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                      ${
                        currentLessonSlug === lesson.slug
                          ? 'bg-stone-800 text-white'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }
                    `}
                  >
                    {lesson.title}
                    {currentLessonSlug === lesson.slug && (
                      <ChevronRight size={14} className="text-stone-500" />
                    )}
                  </button>
                ))}
            </div>
          </div>
        ))}

        <button
          onClick={onHomeClick}
          className="w-full mt-8 flex items-center gap-2 text-stone-500 px-3 py-2 hover:text-white transition-colors text-sm"
        >
          <HomeIcon size={16} /> Back to Home
        </button>
      </div>

      <div className="border-t border-stone-800 px-4 py-3 bg-stone-950/50">
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
