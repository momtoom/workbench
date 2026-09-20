import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';
import * as jsxRuntime from 'react/jsx-runtime';

type WorkbenchReactRuntimeGlobal = typeof globalThis & {
  __WORKBENCH_PORTAL_SCOPE_CONTEXT__?: React.Context<HTMLElement | null | undefined>;
  __WORKBENCH_REACT__?: typeof React;
  __WORKBENCH_REACT_DOM__?: typeof ReactDOM;
  __WORKBENCH_REACT_DOM_CLIENT__?: typeof ReactDOMClient;
  __WORKBENCH_REACT_JSX_DEV_RUNTIME__?: typeof jsxDevRuntime;
  __WORKBENCH_REACT_JSX_RUNTIME__?: typeof jsxRuntime;
};

export const WorkbenchPortalScopeContext = React.createContext<HTMLElement | null | undefined>(undefined);

export function installWorkbenchReactRuntimeGlobals(): void {
  const target = globalThis as WorkbenchReactRuntimeGlobal;
  target.__WORKBENCH_PORTAL_SCOPE_CONTEXT__ = WorkbenchPortalScopeContext;
  target.__WORKBENCH_REACT__ = React;
  target.__WORKBENCH_REACT_DOM__ = ReactDOM;
  target.__WORKBENCH_REACT_DOM_CLIENT__ = ReactDOMClient;
  target.__WORKBENCH_REACT_JSX_DEV_RUNTIME__ = jsxDevRuntime;
  target.__WORKBENCH_REACT_JSX_RUNTIME__ = jsxRuntime;
}
