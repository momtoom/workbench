import type { PropsWithChildren } from 'react';

type ShellPanelProps = PropsWithChildren<{
  title: string;
}>;

export function ShellPanel({ title, children }: ShellPanelProps) {
  return (
    <section className="wb-shell-panel">
      <header className="wb-shell-panel__header">{title}</header>
      <div className="wb-shell-panel__content">{children}</div>
    </section>
  );
}
