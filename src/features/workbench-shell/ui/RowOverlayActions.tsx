import type { ReactNode } from 'react';

export function RowOverlayActions({
  children,
  className,
  stopClickPropagation = true,
}: {
  children: ReactNode;
  className?: string;
  stopClickPropagation?: boolean;
}) {
  return (
    <div
      className={['wb-row-overlay-actions', className].filter(Boolean).join(' ')}
      onClick={stopClickPropagation ? (event) => event.stopPropagation() : undefined}
    >
      {children}
    </div>
  );
}
