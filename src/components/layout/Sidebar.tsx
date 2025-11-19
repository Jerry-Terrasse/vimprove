import { Terminal, ChevronRight, Home as HomeIcon } from 'lucide-react';
import { CATEGORIES } from '@/data';
import type { Lesson } from '@/core/types';

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
        fixed inset-y-0 left-0 z-50 w-72 bg-stone-900 border-r border-stone-800 transform transition-transform duration-300 ease-in-out
        ${!isVisible ? '-translate-x-full' : isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        ${!isVisible ? 'md:hidden' : ''}
      `}
    >
      <div className="p-6 border-b border-stone-800 flex items-center gap-3">
        <Terminal className="text-green-400" size={24} />
        <span className="font-bold text-lg tracking-tight">Vimprove</span>
      </div>
      <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="mb-8">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 pl-2">
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
    </div>
  );
};
