import type { Lesson } from '@/core/types';
import { LessonView } from '@/components/lesson/LessonView';

type LessonPageProps = {
  lesson: Lesson;
  onNext?: () => void;
  onPrev?: () => void;
};

export const LessonPage = ({ lesson, onNext, onPrev }: LessonPageProps) => {
  return <LessonView lesson={lesson} onNext={onNext} onPrev={onPrev} />;
};
