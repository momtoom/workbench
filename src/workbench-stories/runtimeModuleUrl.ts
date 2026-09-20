import { toWorkbenchPreviewUrl, workbenchFetch } from '@domain/project/workbenchHostTransport';
import { normalizeProjectSourceFileReference } from '@domain/document/sourceImportRouting';

const PROJECT_RUNTIME_MODULE_PATH = '/__workbench/preview/source-module.json';

type WorkbenchRuntimeModuleResponse = {
  moduleUrl?: string;
  ok?: boolean;
};

export async function resolveWorkbenchRuntimeModuleUrl(
  sourceFile: string,
  dependencySourceFile?: string,
): Promise<string | null> {
  const normalizedSourceFile = normalizeProjectSourceFileReference(sourceFile);
  const normalizedDependency = dependencySourceFile
    ? normalizeProjectSourceFileReference(dependencySourceFile)
    : '';
  if (!normalizedSourceFile) return null;

  const query = new URLSearchParams({ source: normalizedSourceFile });
  if (normalizedDependency && normalizedDependency !== normalizedSourceFile) {
    query.set('dependency', normalizedDependency);
  }

  try {
    const response = await workbenchFetch(`${PROJECT_RUNTIME_MODULE_PATH}?${query}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const result = await response.json() as WorkbenchRuntimeModuleResponse;
    return result.ok === true && typeof result.moduleUrl === 'string' && result.moduleUrl
      ? toWorkbenchPreviewUrl(result.moduleUrl)
      : null;
  } catch {
    return null;
  }
}
