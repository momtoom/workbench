import ReactDOM from 'react-dom/client';
import { App } from '@app/App';
import { installWorkbenchRuntimeAssetUrlResolver } from './domain/project/workbenchHostTransport';
import { installWorkbenchLocalBrowserPresence } from './domain/project/workbenchBrowserPresence';
import { installWorkbenchReactRuntimeGlobals } from './runtime/workbenchReactRuntimeGlobals';
import './styles.css';

installWorkbenchReactRuntimeGlobals();
installWorkbenchRuntimeAssetUrlResolver();
installWorkbenchLocalBrowserPresence();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
);
