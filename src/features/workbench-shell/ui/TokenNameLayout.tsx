import type { ReactNode } from 'react';

type TokenNameLayoutProps = {
  children: ReactNode;
  chip?: ReactNode;
  className?: string;
  handle: ReactNode;
};

export function TokenNameLayout({
  children,
  chip,
  className,
  handle,
}: TokenNameLayoutProps) {
  return (
    <div className={['wb-token-name-layout', chip ? '' : 'wb-token-name-layout--no-chip', className].filter(Boolean).join(' ')}>
      <span className="wb-token-name-handle">{handle}</span>
      {chip ? <span className="wb-token-name-chip">{chip}</span> : null}
      <span className="wb-token-name-label">{children}</span>
    </div>
  );
}
