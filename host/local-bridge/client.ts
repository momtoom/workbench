import type { WorkbenchLocalBridge } from './server.js';

export type WorkbenchLocalBridgeDescriptor = {
  protocolVersion: 1;
  token: string;
  url: string;
};

export async function rotateWorkbenchLocalBridgeToken(
  bridge: WorkbenchLocalBridge,
): Promise<WorkbenchLocalBridgeDescriptor> {
  const response = await fetch(`${bridge.url}/__workbench-bridge/token/rotate.json`, {
    headers: {
      Authorization: `Bearer ${bridge.token}`,
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Workbench local bridge token rotation failed with ${response.status}.`);
  }

  const payload = await response.json() as { protocolVersion?: unknown; token?: unknown };
  if (payload.protocolVersion !== 1 || typeof payload.token !== 'string' || payload.token.length === 0) {
    throw new Error('Workbench local bridge returned an invalid token.');
  }

  return {
    protocolVersion: 1,
    token: payload.token,
    url: bridge.url,
  };
}
