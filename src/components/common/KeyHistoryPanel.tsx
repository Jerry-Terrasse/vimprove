import { useEffect, useRef } from 'react';
import type { KeyHistory } from '@/core/keyHistory.types';
import { KeyGroupBlock } from './KeyGroupBlock';
import { useTranslationSafe } from '@/hooks/useI18n';

type KeyHistoryPanelProps = {
  history: KeyHistory;
  maxVisible?: number;
};

export const KeyHistoryPanel: React.FC<KeyHistoryPanelProps> = ({
  history,
  maxVisible = 50
}) => {
  const { t } = useTranslationSafe(['keyHistory']);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Auto-scroll to bottom when new items added
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      const container = containerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      if (isNearBottom || history.length === 1) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [history]);

  const handleScroll = () => {
    if (containerRef.current) {
      const container = containerRef.current;
      const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10;
      shouldAutoScroll.current = isAtBottom;
    }
  };

  // Only show last N items
  const visibleHistory = history.slice(-maxVisible);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 border-b border-stone-700/50 bg-stone-900/50">
        <h3 className="text-sm font-medium text-stone-300">
          {t('title', 'Key History', { ns: 'keyHistory' })}
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          {t('subtitle', 'All keystrokes recorded', { ns: 'keyHistory' })}
        </p>
      </div>

      {/* History list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth"
      >
        {visibleHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full text-stone-500 text-sm">
            {t('empty', 'No keystrokes yet', { ns: 'keyHistory' })}
          </div>
        ) : (
          visibleHistory.map((group) => (
            <KeyGroupBlock key={group.id} group={group} />
          ))
        )}
      </div>

      {/* Footer - show if history is truncated */}
      {history.length > maxVisible && (
        <div className="px-4 py-2 border-t border-stone-700/50 bg-stone-900/50 text-xs text-stone-500">
          {t('truncated', 'Showing last {{count}} of {{total}} commands', {
            ns: 'keyHistory',
            count: maxVisible,
            total: history.length
          })}
        </div>
      )}
    </div>
  );
};
