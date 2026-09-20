import { type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useNumberScrub } from './useNumberScrub';

type NumberScrubHandleProps = {
  children: ReactNode;
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  scrubStep?: number;
  value: number;
};

export function NumberScrubHandle({
  children,
  label,
  max,
  min,
  onChange,
  scrubStep = 1,
  value,
}: NumberScrubHandleProps) {
  const { finiteValue, nudgeValue, startScrub } = useNumberScrub({
    max,
    min,
    onChange,
    scrubStep,
    value,
  });

  function handlePointerDown(event: ReactPointerEvent<HTMLSpanElement>) {
    startScrub(event, {
      preventDefaultOnPointerDown: true,
      stopPropagation: true,
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    nudgeValue(event.key === 'ArrowRight' ? 1 : -1, event.shiftKey ? 0.1 : event.altKey ? 10 : 1);
  }

  return (
    <span
      role="slider"
      tabIndex={0}
      className="wb-number-scrub-handle"
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={min}
      aria-valuenow={finiteValue}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
    >
      {children}
    </span>
  );
}
