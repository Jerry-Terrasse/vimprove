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

        // Initial position (CSS transform will handle centering and offset)
        setPosition({
          top: rect.top,
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

  // Adjust horizontal position to keep tooltip in viewport (vertical handled by CSS)
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();

      // Keep horizontal position in viewport
      const idealLeft = triggerRect.left + triggerRect.width / 2;
      const clampedLeft = Math.max(
        tooltipRect.width / 2 + 10,
        Math.min(idealLeft, window.innerWidth - tooltipRect.width / 2 - 10)
      );

      setPosition({
        top: triggerRect.top,
        left: clampedLeft
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
            transform: 'translate(-50%, calc(-100% - 8px))'
          }}
        >
          {content}
        </div>
      )}
    </>
  );
};
