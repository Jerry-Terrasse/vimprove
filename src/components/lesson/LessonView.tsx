import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Lesson } from '@/core/types';
import { MarkdownBlock } from '@/components/common/MarkdownBlock';
import { KeyListBlock } from '@/components/common/KeyListBlock';
import { VimChallenge } from '@/components/challenge/VimChallenge';
import { RunExamplePlayer } from '@/components/example/RunExamplePlayer';

type LessonViewProps = {
  lesson: Lesson;
  onNext?: () => void;
  onPrev?: () => void;
};

export const LessonView = ({ lesson, onNext, onPrev }: LessonViewProps) => {
  return (
    <div className="max-w-4xl mx-auto p-6 pb-32 animate-in slide-in-from-right duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{lesson.title}</h1>
        <p className="text-stone-400 text-lg">{lesson.shortDescription}</p>
      </div>

      {lesson.contentBlocks.map((block, idx) => {
        if (block.type === 'markdown') {
          return <MarkdownBlock key={idx} content={block.content} />;
        }
        if (block.type === 'key-list') {
          return <KeyListBlock key={idx} keys={block.keys} />;
        }
        if (block.type === 'run-example') {
          return (
            <div key={idx} className="my-12">
              <RunExamplePlayer config={block.config} />
            </div>
          );
        }
        if (block.type === 'challenge') {
          return (
            <div key={idx} className="my-12">
              <VimChallenge
                config={block.config}
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
          <ChevronLeft /> Previous Lesson
        </button>
        <button
          onClick={onNext}
          disabled={!onNext}
          className="flex items-center gap-2 text-stone-500 hover:text-white disabled:opacity-0 transition-colors"
        >
          Next Lesson <ChevronRight />
        </button>
      </div>
    </div>
  );
};
