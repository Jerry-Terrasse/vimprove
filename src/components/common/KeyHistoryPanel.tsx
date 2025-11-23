import { useEffect, useRef } from 'react';
import type { KeyHistory } from '@/core/keyHistory.types';
import { KeyGroupBlock } from './KeyGroupBlock';
import { useTranslationSafe } from '@/hooks/useI18n';

type KeyHistoryPanelProps = {
  history: KeyHistory;
};

export const KeyHistoryPanel: React.FC<KeyHistoryPanelProps> = ({
  history
}) => {
  const { t } = useTranslationSafe('keyHistory');
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const prevHistoryLength = useRef(history.length);

  // Auto-scroll to bottom when new items added
  useEffect(() => {
    if (containerRef.current && history.length > prevHistoryLength.current) {
      if (shouldAutoScroll.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
    prevHistoryLength.current = history.length;
  }, [history.length]);

  const handleScroll = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      shouldAutoScroll.current = isAtBottom;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-700/50 bg-stone-900/50">
        <h3 className="text-sm font-medium text-stone-300">
          {t('title', 'Key History', { ns: 'keyHistory' })}
        </h3>
      </div>

      {/* History list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3"
      >
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-full text-stone-500 text-sm">
            {t('empty', 'No keystrokes yet', { ns: 'keyHistory' })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 items-center">
            {history.map((group) => (
              <KeyGroupBlock key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
