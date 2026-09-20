import { spawn } from 'node:child_process';
import { join } from 'node:path';

const DEFAULT_TERMINATION_TIMEOUT_MS = 2500;

export function createBinResolver(root) {
  const isWindows = process.platform === 'win32';
  return (name) => join(root, 'node_modules', '.bin', isWindows ? `${name}.cmd` : name);
}

export function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: options.stdio ?? 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolveRun();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with ${signal ?? code}`));
    });
  });
}

export function terminateChildProcess(child, options = {}) {
  if (!child || child.exitCode !== null || child.signalCode !== null || child.killed) {
    return Promise.resolve();
  }

  const signal = options.signal ?? 'SIGTERM';
  const timeoutMs = options.timeoutMs ?? DEFAULT_TERMINATION_TIMEOUT_MS;

  return new Promise((resolveTermination) => {
    let resolved = false;
    let forceTimer = null;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      if (forceTimer) clearTimeout(forceTimer);
      resolveTermination();
    };

    child.once('exit', finish);

    try {
      child.kill(signal);
    } catch {
      finish();
      return;
    }

    forceTimer = setTimeout(() => {
      if (resolved) return;
      try {
        child.kill('SIGKILL');
      } catch {
        finish();
      }
    }, timeoutMs);
  });
}

export async function closeViteServer(viteServer) {
  if (!viteServer) return;
  await viteServer.close();
}
