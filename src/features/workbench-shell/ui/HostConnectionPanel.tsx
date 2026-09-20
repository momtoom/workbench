import { useState } from 'react';
import { Plug, RefreshCw, Unplug, X } from 'lucide-react';
import {
  getWorkbenchBuildChannelLabel,
  getWorkbenchBuildInfo,
  getWorkbenchBuildRevisionLabel,
} from '@domain/core/workbenchBuildInfo';
import {
  isWorkbenchLocalBridgePairingUrl,
  type WorkbenchHostConnectionCheck,
  type WorkbenchHostPairingInput,
  type WorkbenchHostPairingKind,
  type WorkbenchHostStatus,
} from '@domain/project/workbenchHostTransport';
import { IconButton } from '@shared/ui/primitives';
import type { WorkbenchThemeMode } from './ThemeModeToggle';

export function HostConnectionPanel({
  checking,
  connecting,
  checkResult,
  coreStatusLabel,
  hostStatus,
  rotating,
  onCheck,
  onClose,
  onConnect,
  onDisconnect,
  onRotateToken,
  themeMode,
}: {
  checking: boolean;
  connecting: boolean;
  checkResult: WorkbenchHostConnectionCheck | null;
  coreStatusLabel: string;
  hostStatus: WorkbenchHostStatus;
  rotating: boolean;
  onCheck: () => void;
  onClose: () => void;
  onConnect: (input: WorkbenchHostPairingInput) => void;
  onDisconnect: () => void;
  onRotateToken: () => void;
  themeMode: WorkbenchThemeMode;
}) {
  const [bridgeUrl, setBridgeUrl] = useState('');
  const [bridgeToken, setBridgeToken] = useState('');
  const connectionState = checkResult?.state ?? (hostStatus.kind === 'local-bridge' ? 'connected' : 'same-origin');
  const statusLabel = checking ? 'Checking' : getWorkbenchHostConnectionLabel(connectionState);
  const hasPairingUrl = isWorkbenchLocalBridgePairingUrl(bridgeUrl);
  const canSubmitPairing = bridgeUrl.trim().length > 0 && (hasPairingUrl || bridgeToken.trim().length > 0) && !connecting;
  const buildInfo = getWorkbenchBuildInfo();

  return (
    <div className="wb-popover-panel wb-popover-panel--form wb-host-panel" role="dialog" aria-label="Workbench host connection">
      <div className="wb-host-panel-head">
        <div>
          <p className="wb-kicker">{statusLabel}</p>
          <strong>{hostStatus.bridgeUrl ?? 'Same-origin local host'}</strong>
        </div>
        <IconButton label="Close host connection" title="Close" onClick={onClose}>
          <X size={13} />
        </IconButton>
      </div>
      <dl className="wb-host-meta">
        <div>
          <dt>Mode</dt>
          <dd>{getWorkbenchHostPairingLabel(hostStatus.pairingKind)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{checking ? 'Checking connection' : checkResult?.message ?? statusLabel}</dd>
        </div>
        <div>
          <dt>Core</dt>
          <dd>{coreStatusLabel}</dd>
        </div>
        <div>
          <dt>Renderer</dt>
          <dd title={buildInfo.revision}>{getWorkbenchBuildRevisionLabel(buildInfo)}</dd>
        </div>
        <div>
          <dt>Build</dt>
          <dd>{getWorkbenchBuildChannelLabel(buildInfo.channel)}</dd>
        </div>
      </dl>
      {hostStatus.kind === 'same-origin' ? (
        <form
          className="wb-host-connect-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmitPairing) return;
            onConnect({ token: bridgeToken, url: bridgeUrl });
          }}
        >
          <label className="wb-host-field" htmlFor="wb-host-bridge-url">
            <span>Bridge URL</span>
            <input
              id="wb-host-bridge-url"
              className="wb-host-input"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="http://127.0.0.1:57346"
              value={bridgeUrl}
              onChange={(event) => setBridgeUrl(event.target.value)}
            />
          </label>
          <label className="wb-host-field" htmlFor="wb-host-bridge-token">
            <span>{hasPairingUrl ? 'Token from pair URL' : 'Token'}</span>
            <input
              id="wb-host-bridge-token"
              className="wb-host-input"
              type="password"
              autoComplete="off"
              disabled={hasPairingUrl}
              value={bridgeToken}
              onChange={(event) => setBridgeToken(event.target.value)}
            />
          </label>
          <button type="submit" className="wb-host-action-button wb-host-action-button--primary" disabled={!canSubmitPairing}>
            <Plug size={13} aria-hidden="true" />
            <span>{connecting ? 'Connecting' : 'Connect and reload'}</span>
          </button>
        </form>
      ) : null}
      <div className="wb-host-actions">
        <button type="button" className="wb-host-action-button" onClick={onCheck}>
          <RefreshCw size={13} aria-hidden="true" />
          <span>{checking ? 'Checking' : 'Check'}</span>
        </button>
        {hostStatus.kind === 'local-bridge' ? (
          <>
            {hostStatus.canRotateToken ? (
              <button
                type="button"
                className="wb-host-action-button"
                disabled={rotating}
                onClick={onRotateToken}
              >
                <RefreshCw size={13} aria-hidden="true" />
                <span>{rotating ? 'Rotating' : 'Rotate token'}</span>
              </button>
            ) : null}
            <button
              type="button"
              className="wb-host-action-button"
              disabled={!hostStatus.canDisconnect}
              onClick={onDisconnect}
            >
              <Unplug size={13} aria-hidden="true" />
              <span>Disconnect and reload</span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function getWorkbenchHostConnectionLabel(state: WorkbenchHostConnectionCheck['state']): string {
  if (state === 'offline') return 'Bridge unavailable';
  if (state === 'same-origin') return 'Local host';
  return 'Bridge connected';
}

function getWorkbenchHostPairingLabel(pairingKind: WorkbenchHostPairingKind): string {
  if (pairingKind === 'session-pairing') return 'Browser pairing';
  return 'Same origin';
}
