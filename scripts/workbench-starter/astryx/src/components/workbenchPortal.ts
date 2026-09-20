import * as React from 'react';

type WorkbenchPortalRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_PORTAL_SCOPE_CONTEXT__?: React.Context<
    HTMLElement | null | undefined
  >;
};

const WorkbenchPortalScopeContext =
  (globalThis as WorkbenchPortalRuntimeGlobal)
    .__WORKBENCH_PORTAL_SCOPE_CONTEXT__ ??
  React.createContext<HTMLElement | null | undefined>(undefined);

export function useWorkbenchPortalContainer() {
  return React.useContext(WorkbenchPortalScopeContext);
}
