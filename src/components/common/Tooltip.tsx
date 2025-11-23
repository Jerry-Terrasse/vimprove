import { useState, useRef, useEffect, type ReactNode } from 'react';

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  delay?: number;
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const tooltipHeight = 80; // estimate
        const spaceAbove = rect.top;
        const showAbove = spaceAbove > tooltipHeight + 10;

        setPosition({
          top: showAbove ? rect.top - 8 : rect.bottom + 8,
          left: rect.left + rect.width / 2
        });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Adjust position after tooltip renders
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const spaceAbove = triggerRect.top;
      const showAbove = spaceAbove > tooltipRect.height + 10;

      setPosition({
        top: showAbove ? triggerRect.top - tooltipRect.height - 8 : triggerRect.bottom + 8,
        left: Math.max(10, Math.min(
          triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
          window.innerWidth - tooltipRect.width - 10
        ))
      });
    }
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-xs font-mono bg-stone-800 border border-stone-600 rounded-lg shadow-xl text-stone-200 max-w-xs whitespace-pre-wrap"
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};
