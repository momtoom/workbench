import type { TokenRegistry, TokenType } from '@domain/design-system/tokens/types';
import type { WorkbenchInspectorTokenPickerFilters } from './workbenchInspectorSession';
import type {
  WorkbenchDesignPreviewAppearance,
  WorkbenchDesignPreviewViewport,
  WorkbenchPreviewTokenModeSelection,
} from './workbenchPreviewSession';
import type { PageSourceFramework } from '@domain/document/pageSourceFramework';
import type { WorkbenchStoryArgs } from './workbenchStoryArgs';

export type WorkbenchProjectSchemaVersion = '0.1';

export type WorkbenchProjectFramework = PageSourceFramework;

export type WorkbenchLibraryMergePolicy = 'overwrite';

export type WorkbenchLibraryUpdatePolicy = 'manual';

export type WorkbenchLibraryRegistryEntry = {
  id: string;
  name?: string;
  kind: 'project-local' | 'library-snapshot';
  sourcePath: string;
  snapshotRoot: string;
  updatePolicy: WorkbenchLibraryUpdatePolicy;
  mergePolicy: WorkbenchLibraryMergePolicy;
  createdAt?: string;
  updatedAt: string;
  extensions?: Record<string, unknown>;
};

export type WorkbenchProjectPaths = {
  assets?: string;
  notes?: string;
  tokenCss?: string;
  tokens: string;
  pages: string;
  components: string;
  comments: string;
  selection: string;
  workspaceState: string;
  history?: string;
};

export type WorkbenchProjectCapabilities = {
  localFiles: boolean;
  codexDesktopPreview: boolean;
  optionalCloudSync: boolean;
};

export type WorkbenchProjectLocation = {
  kind: 'local';
  rootPath: string | null;
  workbenchDir: string | null;
  configPath: string;
  source: 'dev-server' | 'local-bridge' | 'static-fallback';
  dependencyInstall?: {
    message?: string;
    ok: boolean;
    status: 'installing' | 'failed' | 'installed' | 'skipped';
  };
};

export type WorkbenchProjectConfig = {
  schemaVersion: WorkbenchProjectSchemaVersion;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  workbench: {
    app: 'workbench-v1';
    installMode: 'local-project';
    devCommand: string;
    // Absent on every config written before the Vue port; readers must go
    // through getWorkbenchProjectFramework, which defaults to 'react'.
    framework?: WorkbenchProjectFramework;
    previewUrl?: string;
  };
  paths: WorkbenchProjectPaths;
  capabilities: WorkbenchProjectCapabilities;
  extensions: Record<string, unknown>;
};

export type WorkbenchTokenRegistry = TokenRegistry;

export type WorkbenchDesignAssetKind = 'image' | 'video' | 'font' | 'icon';

export type WorkbenchDesignAssetSource = {
  type: 'project-file' | 'url';
  value: string;
  filePath?: string;
};

export type WorkbenchDesignAsset = {
  id: string;
  name: string;
  kind: WorkbenchDesignAssetKind;
  source: WorkbenchDesignAssetSource;
  fileName?: string;
  mimeType?: string;
  size?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  extensions?: Record<string, unknown>;
};

export type WorkbenchAssetRegistry = {
  schemaVersion: WorkbenchProjectSchemaVersion;
  assets: WorkbenchDesignAsset[];
  extensions: Record<string, unknown>;
};

export type WorkbenchPageRegistry = {
  schemaVersion: WorkbenchProjectSchemaVersion;
  pages: Array<{
    id: string;
    name: string;
    route: string;
    sourceFile: string;
    rootNodeId: string;
    status: 'draft' | 'ready';
    extensions?: Record<string, unknown>;
  }>;
  extensions: Record<string, unknown>;
};

export type WorkbenchComponentRegistry = {
  schemaVersion: WorkbenchProjectSchemaVersion;
  components: Array<{
    id: string;
    name: string;
    sourceFile: string;
    componentSetId?: string;
    variants: Array<{
      id: string;
      axes: Record<string, string>;
      state: string;
    }>;
    extensions?: Record<string, unknown>;
  }>;
  extensions: Record<string, unknown> & {
    libraries?: Record<string, WorkbenchLibraryRegistryEntry>;
  };
};

export type WorkbenchCommentRegistry = {
  schemaVersion: WorkbenchProjectSchemaVersion;
  comments: Array<{
    id: string;
    target: WorkbenchSelectionTarget;
    body: string;
    status: 'open' | 'resolved';
    createdAt: string;
    updatedAt: string;
    extensions?: Record<string, unknown>;
  }>;
  extensions: Record<string, unknown>;
};

export type WorkbenchSelectionTarget = {
  kind: 'project' | 'page' | 'component' | 'node' | 'token';
  pageId?: string;
  componentId?: string;
  tokenId?: string;
  nodeId?: string;
  sourceFile?: string;
  variant?: Record<string, string>;
  state?: string;
  extensions?: Record<string, unknown>;
};

export type WorkbenchSurface = 'tokens' | 'assets' | 'storybook' | 'design';
export type WorkbenchDesignTargetKind = 'page' | 'component';

export type WorkbenchTokenEditorSessionState = Record<string, unknown> & {
  query: string;
  sidebarSearchQuery: string;
  tableColumnWidthsByCollection: Record<string, Record<string, number>>;
  typeFilter: TokenType | 'all';
};

export type WorkbenchWorkspaceSessionExtensions = {
  activeDesignLayerId?: string | null;
  activeDesignSourceFile?: string | null;
  activeDesignStoryArgs?: WorkbenchStoryArgs | null;
  activeDesignStoryComponentId?: string | null;
  activeDesignTargetId?: string | null;
  activeDesignTargetKind?: WorkbenchDesignTargetKind | null;
  activeStorybookTargetId?: string | null;
  activeStorybookTargetKind?: 'component' | 'foundation' | null;
  activeTokenCollectionId?: string | null;
  activeTokenGroupId?: string | null;
  activeWorkbenchSurface?: WorkbenchSurface;
  collapsedDesignLayerIds?: string[];
  collapsedDesignLayerSection?: boolean;
  collapsedDesignPageFolders?: string[];
  collapsedDesignSourceGroups?: string[];
  collapsedDesignSourceSection?: boolean;
  designPreviewAppearance?: WorkbenchDesignPreviewAppearance;
  designPreviewDrillPath?: string[];
  designPreviewViewport?: WorkbenchDesignPreviewViewport;
  inspectorTokenPickerFilters?: WorkbenchInspectorTokenPickerFilters;
  openDesignTargetKeys?: string[];
  previewTokenModes?: WorkbenchPreviewTokenModeSelection;
  selectedDesignLayerIds?: string[];
  tokenSelectionAnchorCollectionId?: string | null;
  tokenSelectionAnchorId?: string | null;
  workbenchDesignSourceListHeight?: number;
  workbenchInspectorWidth?: number;
  workbenchSidebarWidth?: number;
  workbenchTokenCollectionListHeight?: number;
  workbenchTokenEditorSession?: WorkbenchTokenEditorSessionState;
};

export type WorkbenchSelectionExtensions = Record<string, unknown> & WorkbenchWorkspaceSessionExtensions;

export type WorkbenchSelectionState = {
  schemaVersion: WorkbenchProjectSchemaVersion;
  activeTarget: WorkbenchSelectionTarget | null;
  selectedTargets: WorkbenchSelectionTarget[];
  updatedAt: string;
  extensions: WorkbenchSelectionExtensions;
};

export type WorkbenchWorkspaceState = {
  schemaVersion: WorkbenchProjectSchemaVersion;
  activePageId: string | null;
  activeComponentId: string | null;
  activeMode: 'preview-edit' | 'token-edit' | 'comment-review';
  updatedAt: string;
  extensions: Record<string, unknown>;
};
