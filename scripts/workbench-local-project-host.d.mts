export const CONFIG_PATH: '.workbench/workbench.config.json';
export const ASSET_PUBLIC_ROOT: 'public/workbench-assets';
export const DEPENDENCY_INSTALL_STATUS_PATH: '.workbench/dependency-install.json';
export const MAX_IMPORT_TREE_FILES: 512;
export const MAX_IMPORT_TREE_BYTES: number;
export const WORKBENCH_SOURCE_FILE_EXTENSION_PATTERN: RegExp;
export const BLOCKED_SOURCE_PATH_PARTS: ReadonlySet<string>;

export type WorkbenchHostSource = 'dev-server' | 'local-bridge';
export type WorkbenchProjectTemplateId = 'standard' | 'tailwind' | 'shadcn-base' | 'astryx';

export type WorkbenchDependencyInstallStatus = {
  schemaVersion: '0.1';
  cachePath: '.workbench/.npm-cache';
  command: string;
  finishedAt?: string;
  manager: 'npm';
  message?: string;
  ok: boolean;
  startedAt: string;
  status: 'installing' | 'failed' | 'installed' | 'skipped';
  templateId: WorkbenchProjectTemplateId;
};

export type WorkbenchProjectLocationPayload = {
  kind: 'local';
  rootPath: string | null;
  workbenchDir: string | null;
  configPath: typeof CONFIG_PATH;
  source: WorkbenchHostSource;
  dependencyInstall?: WorkbenchDependencyInstallStatus;
};

export type WorkbenchQueuedDependencyInstall = {
  completion: Promise<WorkbenchDependencyInstallStatus>;
  started: boolean;
  status: WorkbenchDependencyInstallStatus;
};

export type WorkbenchProjectValidationResult =
  | {
      ok: true;
      configPath: string;
      rootPath: string;
      workbenchDir: string;
    }
  | {
      ok: false;
      message: string;
    };

export type WorkbenchDiskImportFile = {
  contents: string;
  name: string;
  relativePath: string;
  size: number;
};

export type WorkbenchDiskImportOptions = {
  allowAppRootImports?: boolean;
  appRoot?: string;
  includeContents?: boolean;
  includePresetTokens?: boolean;
  projectRoot: string;
  sourcePath: string;
};

export type WorkbenchAssetWriteAction = {
  collection?: string;
  dataUrl: string;
  fileName: string;
  kind: 'image' | 'video' | 'font' | 'icon';
};

export type WorkbenchAssetDeleteAction = {
  paths: string[];
};

export type WorkbenchAssetInstallAction =
  | {
      kind: 'font' | 'icon';
      name?: string;
      source?: 'git';
      url: string;
    }
  | {
      family: string;
      kind: 'font';
      name?: string;
      source: 'google-fonts';
      weights?: string[];
    };

export function writeFileAtomic(filePath: string, contents: string): Promise<void>;
export function createProjectLocation(
  projectRoot: string | null,
  source?: WorkbenchHostSource,
  dependencyInstall?: WorkbenchDependencyInstallStatus | null,
): WorkbenchProjectLocationPayload;
export function validateWorkbenchProjectRoot(rootPath: string): Promise<WorkbenchProjectValidationResult>;
export function scaffoldWorkbenchProjectFolder(
  parentPath: string,
  projectName: string,
  templateId?: WorkbenchProjectTemplateId,
): Promise<{
  dependencyInstall: WorkbenchDependencyInstallStatus;
  rootPath: string;
}>;
export function createWorkbenchProjectFolder(
  parentPath: string,
  projectName: string,
  templateId?: WorkbenchProjectTemplateId,
): Promise<{
  dependencyInstall: WorkbenchDependencyInstallStatus;
  rootPath: string;
}>;
export function initializeWorkbenchProject(
  projectRoot: string,
  projectNameOverride?: string,
  options?: { templateId?: WorkbenchProjectTemplateId },
): Promise<void>;
export function installWorkbenchProjectDependencies(
  projectRoot: string,
  templateId?: WorkbenchProjectTemplateId,
): Promise<WorkbenchDependencyInstallStatus>;
export function queueWorkbenchProjectDependencyInstall(
  projectRoot: string,
  templateId?: WorkbenchProjectTemplateId,
): Promise<WorkbenchQueuedDependencyInstall>;
export function readWorkbenchProjectDependencyInstallStatus(
  projectRoot: string | null,
): Promise<WorkbenchDependencyInstallStatus | null>;
export function workbenchProjectDependenciesNeedInstall(projectRoot: string | null): Promise<boolean>;
export function readWorkbenchProjectTemplateId(
  projectRoot: string | null,
): Promise<WorkbenchProjectTemplateId>;
export function resolveWorkbenchExecutablePath(command: string): Promise<string | null>;
export function resolveWorkbenchNodeCommandPath(): Promise<string | null>;
export function resolveWorkbenchProjectPath(projectRoot: string, projectPath: string): string | null;
export function resolveWorkbenchSourcePath(projectRoot: string, sourcePath: string): string | null;
export function resolveWorkbenchSourceDirPath(projectRoot: string, dirPath: string): string | null;
export function resolveWorkbenchSourcePathOrDir(projectRoot: string, sourcePath: string): string | null;
export function readWorkbenchImportTree(options: WorkbenchDiskImportOptions): Promise<{
  ok: true;
  files: WorkbenchDiskImportFile[];
  rootPath: string;
}>;
export function readProjectPublicAsset(projectRoot: string, pathname: string): Promise<{
  buffer: Buffer;
  contentType: string;
  size: number;
} | null>;
export function writeWorkbenchAssetFile(projectRoot: string, action: WorkbenchAssetWriteAction): Promise<{
  ok: true;
  filePath: string;
  publicPath: string;
}>;
export function deleteWorkbenchAssetPaths(projectRoot: string, action: WorkbenchAssetDeleteAction): Promise<{
  ok: true;
  removed: string[];
}>;
export function installWorkbenchAssets(projectRoot: string, action: WorkbenchAssetInstallAction): Promise<{
  ok: true;
  assets: unknown[];
}>;
export function searchGoogleFontsCatalog(query: string, limit: number): Promise<{
  fonts: Array<{
    category?: string;
    family: string;
    subsets: string[];
    variants: string[];
    weights: string[];
  }>;
  message?: string;
  ok: true;
  source: 'fallback' | 'google-fonts';
}>;
export function writeProjectAssetCopy(projectRoot: string, sourcePath: string, relativeFilePath: string): Promise<void>;
export function writeProjectAssetBuffer(projectRoot: string, buffer: Buffer, relativeFilePath: string): Promise<void>;
export function getAssetContentType(filePath: string): string;
export function createSafeAssetFileName(fileName: string): string;
export function createSafeAssetFolderName(name: string): string;
