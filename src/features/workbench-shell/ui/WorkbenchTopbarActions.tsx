import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const WorkbenchTopbarActionsHostContext = createContext<HTMLElement | null>(null);

export function WorkbenchTopbarActionsProvider({
  children,
  host,
}: {
  children: ReactNode;
  host: HTMLElement | null;
}) {
  return (
    <WorkbenchTopbarActionsHostContext.Provider value={host}>
      {children}
    </WorkbenchTopbarActionsHostContext.Provider>
  );
}

export function WorkbenchTopbarActions({ children }: { children: ReactNode }) {
  const host = useContext(WorkbenchTopbarActionsHostContext);
  return host ? createPortal(children, host) : null;
}
