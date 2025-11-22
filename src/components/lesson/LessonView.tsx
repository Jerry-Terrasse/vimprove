import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Lesson } from '@/core/types';
import { MarkdownBlock } from '@/components/common/MarkdownBlock';
import { KeyListBlock } from '@/components/common/KeyListBlock';
import { VimChallenge } from '@/components/challenge/VimChallenge';
import { RunExamplePlayer } from '@/components/example/RunExamplePlayer';
import { useTranslationSafe } from '@/hooks/useI18n';

type LessonViewProps = {
  lesson: Lesson;
  onNext?: () => void;
  onPrev?: () => void;
};

export const LessonView = ({ lesson, onNext, onPrev }: LessonViewProps) => {
  const { t } = useTranslationSafe('lessons');
  const title = t(`lessons.${lesson.slug}.title`, lesson.title);
  const shortDescription = t(
    `lessons.${lesson.slug}.shortDescription`,
    lesson.shortDescription
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pt-16 md:pt-6 pb-32 animate-in slide-in-from-right duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        <p className="text-stone-400 text-lg">{shortDescription}</p>
      </div>

      {lesson.contentBlocks.map((block, idx) => {
        const blockKey = block.i18nKey || `lessons.${lesson.slug}.content.${idx}`;

        if (block.type === 'markdown') {
          const content = t(blockKey, block.content);
          return <MarkdownBlock key={idx} content={content} />;
        }
        if (block.type === 'key-list') {
          return (
            <KeyListBlock
              key={idx}
              keys={block.keys}
              i18nBaseKey={`${blockKey}`}
            />
          );
        }
        if (block.type === 'run-example') {
          return (
            <div key={idx} className="my-12">
              <RunExamplePlayer
                config={block.config}
                lessonSlug={lesson.slug}
                i18nBaseKey={blockKey}
              />
            </div>
          );
        }
        if (block.type === 'challenge') {
          return (
            <div key={idx} className="my-12">
              <VimChallenge
                config={block.config}
                lessonSlug={lesson.slug}
                i18nBaseKey={blockKey}
                onComplete={({ next }) => {
                  if (next && onNext) onNext();
                }}
              />
            </div>
          );
        }
        return null;
      })}

      <div className="flex justify-between mt-16 border-t border-stone-800 pt-8">
        <button
          onClick={onPrev}
          disabled={!onPrev}
          className="flex items-center gap-2 text-stone-500 hover:text-white disabled:opacity-0 transition-colors"
        >
          <ChevronLeft /> {t('nav.previous', 'Previous Lesson', { ns: 'lesson' })}
        </button>
        <button
          onClick={onNext}
          disabled={!onNext}
          className="flex items-center gap-2 text-stone-500 hover:text-white disabled:opacity-0 transition-colors"
        >
          {t('nav.next', 'Next Lesson', { ns: 'lesson' })} <ChevronRight />
        </button>
      </div>
    </div>
  );
};
