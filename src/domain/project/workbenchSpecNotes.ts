import type {
  WorkbenchCommentRegistry,
  WorkbenchProjectSchemaVersion,
  WorkbenchSelectionTarget,
} from './workbenchProject';

export type WorkbenchSpecNoteType = 'behavior' | 'content' | 'intent' | 'qa' | 'question' | 'responsive';

export type WorkbenchSpecNoteFolder = {
  id: string;
  name: string;
  parentFolderId: string | null;
  target: WorkbenchSelectionTarget | null;
  targetStatus: WorkbenchSpecNoteTargetStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkbenchSpecNoteTargetStatus = 'linked' | 'missing' | 'unlinked';

export type WorkbenchSpecNoteHighlightBoxAnchor = 'center' | 'end' | 'start';
export type WorkbenchSpecNoteHighlightBoxResizeMode = 'both' | 'fixed' | 'horizontal' | 'vertical';

export type WorkbenchSpecNoteHighlightBoxRect = {
  anchorX?: WorkbenchSpecNoteHighlightBoxAnchor;
  anchorY?: WorkbenchSpecNoteHighlightBoxAnchor;
  resizeMode?: WorkbenchSpecNoteHighlightBoxResizeMode;
  targetHeight?: number;
  targetWidth?: number;
  unit?: 'px' | 'ratio';
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WorkbenchSpecNoteHighlightBox = WorkbenchSpecNoteHighlightBoxRect & {
  bodyHtml: string;
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkbenchSpecNote = {
  id: string;
  body: string;
  createdAt: string;
  folderId: string | null;
  status: 'open' | 'resolved';
  target: WorkbenchSelectionTarget | null;
  targetStatus: WorkbenchSpecNoteTargetStatus;
  title: string;
  type: WorkbenchSpecNoteType;
  updatedAt: string;
};

export type WorkbenchSpecNotesModel = {
  schemaVersion: WorkbenchProjectSchemaVersion;
  folders: WorkbenchSpecNoteFolder[];
  notes: WorkbenchSpecNote[];
};

const NOTE_FOLDER_EXTENSION_KEY = 'specNoteFolders';
const NOTE_TARGET_HIGHLIGHT_BOXES_EXTENSION_KEY = 'highlightBoxes';

export function createEmptyWorkbenchSpecNotesModel(): WorkbenchSpecNotesModel {
  return {
    schemaVersion: '0.1',
    folders: [],
    notes: [],
  };
}

export function getWorkbenchSpecNotesModel(registry: WorkbenchCommentRegistry): WorkbenchSpecNotesModel {
  const folders = getWorkbenchSpecNoteFolders(registry);
  const folderIds = new Set(folders.map((folder) => folder.id));
  return {
    schemaVersion: registry.schemaVersion,
    folders,
    notes: registry.comments.map((comment) => {
      const extensions = isRecord(comment.extensions) ? comment.extensions : {};
      const folderId = getNullableString(extensions.folderId);
      return {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        folderId: folderId && folderIds.has(folderId) ? folderId : null,
        status: comment.status,
        target: comment.target.kind === 'project' && comment.target.extensions?.unlinked === true
          ? null
          : comment.target,
        targetStatus: getSpecNoteTargetStatus(comment.target),
        title: getString(extensions.title, 'Untitled note'),
        type: getSpecNoteType(extensions.type),
        updatedAt: comment.updatedAt,
      };
    }),
  };
}

export function createWorkbenchCommentRegistryFromSpecNotes(
  current: WorkbenchCommentRegistry,
  model: WorkbenchSpecNotesModel,
): WorkbenchCommentRegistry {
  return {
    schemaVersion: current.schemaVersion,
    comments: model.notes.map((note) => ({
      id: note.id,
      body: note.body,
      createdAt: note.createdAt,
      status: note.status,
      target: note.target ?? createUnlinkedSpecNoteTarget(),
      updatedAt: note.updatedAt,
      extensions: {
        folderId: note.folderId,
        targetStatus: note.targetStatus,
        title: note.title,
        type: note.type,
      },
    })),
    extensions: {
      ...current.extensions,
      [NOTE_FOLDER_EXTENSION_KEY]: model.folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        parentFolderId: folder.parentFolderId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        ...(folder.target ? { target: folder.target } : {}),
      })),
    },
  };
}

export function createWorkbenchCommentRegistryForSpecNoteTarget(
  registry: WorkbenchCommentRegistry,
  target: WorkbenchSelectionTarget | null | undefined,
): WorkbenchCommentRegistry {
  if (!target) return registry;
  const model = getWorkbenchSpecNotesModel(registry);
  const notes = model.notes.filter((note) => isWorkbenchSpecNoteInTargetContext(note, target));
  const folderIds = getWorkbenchSpecNoteFolderTargetContextIds(model.folders, notes, target);
  return createWorkbenchCommentRegistryFromSpecNotes(registry, {
    ...model,
    folders: model.folders.filter((folder) => folderIds.has(folder.id)),
    notes,
  });
}

export function getWorkbenchSpecNoteSidecarPath(sourceFile: string): string {
  const normalized = sourceFile.trim().replace(/\\/g, '/');
  if (!normalized) return '.workbench/notes.workbench-notes.json';
  return normalized.replace(/(\.[^./\\]+)?$/, '.workbench-notes.json');
}

export function createWorkbenchSpecNoteOwnerTarget(
  target: WorkbenchSelectionTarget | null | undefined,
  label: string | undefined,
): WorkbenchSelectionTarget | null {
  if (target?.kind === 'page' && (target.pageId || target.sourceFile)) {
    return {
      kind: 'page',
      pageId: target.pageId,
      sourceFile: target.sourceFile,
      extensions: {
        ...target.extensions,
        label: label ?? getString(target.extensions?.label, 'Page'),
      },
    };
  }
  if (target?.kind === 'component' && (target.componentId || target.sourceFile)) {
    return {
      kind: 'component',
      componentId: target.componentId,
      sourceFile: target.sourceFile,
      extensions: {
        ...target.extensions,
        label: label ?? getString(target.extensions?.label, 'Component'),
      },
    };
  }
  return null;
}

export function doesWorkbenchSpecNoteTargetMatchContext(
  target: WorkbenchSelectionTarget | null | undefined,
  contextTarget: WorkbenchSelectionTarget | null | undefined,
): boolean {
  if (!contextTarget) return true;
  if (!target) return false;
  if (target.kind === 'project' && target.extensions?.unlinked === true) return false;

  const contextKind = contextTarget.kind;
  if (contextKind !== 'page' && contextKind !== 'component') return true;

  if (contextKind === 'page') {
    if (target.kind === 'page') {
      if (contextTarget.pageId && target.pageId) return contextTarget.pageId === target.pageId;
      return Boolean(contextTarget.sourceFile && target.sourceFile && contextTarget.sourceFile === target.sourceFile);
    }
    if (target.kind === 'node') {
      return Boolean(contextTarget.sourceFile && target.sourceFile && contextTarget.sourceFile === target.sourceFile);
    }
    return false;
  }

  if (target.kind === 'component') {
    if (contextTarget.componentId && target.componentId) return contextTarget.componentId === target.componentId;
    return Boolean(contextTarget.sourceFile && target.sourceFile && contextTarget.sourceFile === target.sourceFile);
  }
  if (target.kind === 'node') {
    return Boolean(contextTarget.sourceFile && target.sourceFile && contextTarget.sourceFile === target.sourceFile);
  }
  return false;
}

export function isWorkbenchSpecNoteInTargetContext(
  note: WorkbenchSpecNote,
  contextTarget: WorkbenchSelectionTarget | null | undefined,
): boolean {
  return doesWorkbenchSpecNoteTargetMatchContext(note.target, contextTarget);
}

export function isWorkbenchSpecNoteFolderInTargetContext(
  folder: WorkbenchSpecNoteFolder,
  contextTarget: WorkbenchSelectionTarget | null | undefined,
): boolean {
  return doesWorkbenchSpecNoteTargetMatchContext(folder.target, contextTarget);
}

function getWorkbenchSpecNoteFolderTargetContextIds(
  folders: WorkbenchSpecNoteFolder[],
  notes: WorkbenchSpecNote[],
  target: WorkbenchSelectionTarget,
): Set<string> {
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const folderIds = new Set<string>();
  const addFolderAndAncestors = (folderId: string | null) => {
    const visited = new Set<string>();
    let currentFolderId = folderId;
    while (currentFolderId) {
      if (visited.has(currentFolderId)) break;
      visited.add(currentFolderId);
      const folder = folderById.get(currentFolderId);
      if (!folder) break;
      folderIds.add(folder.id);
      currentFolderId = folder.parentFolderId;
    }
  };

  for (const folder of folders) {
    if (isWorkbenchSpecNoteFolderInTargetContext(folder, target)) addFolderAndAncestors(folder.id);
  }
  for (const note of notes) addFolderAndAncestors(note.folderId);
  return folderIds;
}

export function createWorkbenchSpecNoteTarget(
  sourceFile: string | undefined,
  nodeId: string | undefined,
  label: string | undefined,
  jsxName: string | undefined,
): WorkbenchSelectionTarget | null {
  if (!sourceFile || !nodeId) return null;
  return {
    kind: 'node',
    nodeId,
    sourceFile,
    extensions: {
      label,
      jsxName,
    },
  };
}

export function createWorkbenchSpecNoteHighlightBox(
  rect: WorkbenchSpecNoteHighlightBoxRect,
  label = 'Highlight',
): WorkbenchSpecNoteHighlightBox {
  const now = new Date().toISOString();
  return {
    ...normalizeWorkbenchSpecNoteHighlightBoxRect(rect),
    bodyHtml: '',
    id: `note-box-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    createdAt: now,
    updatedAt: now,
  };
}

export function getWorkbenchSpecNoteTargetHighlightBoxes(
  target: WorkbenchSelectionTarget | null | undefined,
): WorkbenchSpecNoteHighlightBox[] {
  const value = target?.extensions?.[NOTE_TARGET_HIGHLIGHT_BOXES_EXTENSION_KEY];
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = getString(item.id, '');
    if (!id) return [];
    const rect = normalizeWorkbenchSpecNoteHighlightBoxRect({
      anchorX: getSpecNoteHighlightBoxAnchor(item.anchorX),
      anchorY: getSpecNoteHighlightBoxAnchor(item.anchorY),
      height: getNumber(item.height, 0),
      resizeMode: getSpecNoteHighlightBoxResizeMode(item.resizeMode),
      targetHeight: getPositiveNumber(item.targetHeight),
      targetWidth: getPositiveNumber(item.targetWidth),
      unit: item.unit === 'px' ? 'px' : 'ratio',
      width: getNumber(item.width, 0),
      x: getNumber(item.x, 0),
      y: getNumber(item.y, 0),
    });
    if (rect.width <= 0 || rect.height <= 0) return [];
    const createdAt = getString(item.createdAt, new Date().toISOString());
    return [{
      ...rect,
      bodyHtml: getString(item.bodyHtml, ''),
      id,
      label: getString(item.label, 'Highlight'),
      createdAt,
      updatedAt: getString(item.updatedAt, createdAt),
    }];
  });
}

export function setWorkbenchSpecNoteTargetHighlightBoxes(
  target: WorkbenchSelectionTarget | null,
  boxes: WorkbenchSpecNoteHighlightBox[],
): WorkbenchSelectionTarget | null {
  if (!target) return null;
  const extensions = isRecord(target.extensions) ? target.extensions : {};
  const { [NOTE_TARGET_HIGHLIGHT_BOXES_EXTENSION_KEY]: removedHighlightBoxes, ...restExtensions } = extensions;
  void removedHighlightBoxes;
  const normalizedBoxes = boxes.flatMap((box) => {
    const rect = normalizeWorkbenchSpecNoteHighlightBoxRect(box);
    if (rect.width <= 0 || rect.height <= 0) return [];
    return [{
      ...box,
      ...rect,
    }];
  });
  return {
    ...target,
    extensions: normalizedBoxes.length > 0
      ? { ...restExtensions, [NOTE_TARGET_HIGHLIGHT_BOXES_EXTENSION_KEY]: normalizedBoxes }
      : restExtensions,
  };
}

export function createWorkbenchSpecNoteId(): string {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createWorkbenchSpecNoteFolderId(): string {
  return `folder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getWorkbenchSpecNoteTargetLabel(note: WorkbenchSpecNote): string {
  if (!note.target) return 'Unlinked';
  const extensions = isRecord(note.target.extensions) ? note.target.extensions : {};
  if (note.target.kind === 'page') return getString(extensions.label, note.target.pageId ?? 'Page');
  if (note.target.kind === 'component') return getString(extensions.label, note.target.componentId ?? 'Component');
  if (note.target.kind === 'node') return getString(extensions.label, note.target.nodeId ?? 'Linked node');
  return getString(extensions.label, 'Project');
}

function createUnlinkedSpecNoteTarget(): WorkbenchSelectionTarget {
  return {
    kind: 'project',
    extensions: {
      unlinked: true,
    },
  };
}

function getWorkbenchSpecNoteFolders(registry: WorkbenchCommentRegistry): WorkbenchSpecNoteFolder[] {
  const value = registry.extensions?.[NOTE_FOLDER_EXTENSION_KEY];
  if (!Array.isArray(value)) return [];
  const folders = value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = getString(item.id, '');
    const name = getString(item.name, '');
    if (!id || !name) return [];
    const createdAt = getString(item.createdAt, new Date().toISOString());
    const updatedAt = getString(item.updatedAt, createdAt);
    const target = getWorkbenchSpecNoteFolderTarget(item.target);
    return [{
      id,
      name,
      parentFolderId: getNullableString(item.parentFolderId),
      target,
      targetStatus: getSpecNoteTargetStatus(target ?? createUnlinkedSpecNoteTarget()),
      createdAt,
      updatedAt,
    }];
  });
  return normalizeWorkbenchSpecNoteFolders(folders);
}

function normalizeWorkbenchSpecNoteFolders(folders: WorkbenchSpecNoteFolder[]): WorkbenchSpecNoteFolder[] {
  const folderIds = new Set(folders.map((folder) => folder.id));
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));

  return folders.map((folder) => {
    const parentFolderId = folder.parentFolderId;
    if (!parentFolderId || !folderIds.has(parentFolderId) || parentFolderId === folder.id) {
      return { ...folder, parentFolderId: null };
    }
    if (wouldCreateSpecNoteFolderCycle(folder.id, parentFolderId, folderById)) {
      return { ...folder, parentFolderId: null };
    }
    return folder;
  });
}

function wouldCreateSpecNoteFolderCycle(
  folderId: string,
  parentFolderId: string,
  folderById: Map<string, WorkbenchSpecNoteFolder>,
): boolean {
  const visited = new Set<string>();
  let currentParentId: string | null = parentFolderId;

  while (currentParentId) {
    if (currentParentId === folderId || visited.has(currentParentId)) return true;
    visited.add(currentParentId);
    currentParentId = folderById.get(currentParentId)?.parentFolderId ?? null;
  }

  return false;
}

function getSpecNoteTargetStatus(target: WorkbenchSelectionTarget): WorkbenchSpecNoteTargetStatus {
  if (target.kind === 'project' && target.extensions?.unlinked === true) return 'unlinked';
  if (target.kind === 'node') return target.nodeId && target.sourceFile ? 'linked' : 'missing';
  if (target.kind === 'page') return target.pageId || target.sourceFile ? 'linked' : 'missing';
  if (target.kind === 'component') return target.componentId || target.sourceFile ? 'linked' : 'missing';
  return 'missing';
}

function getWorkbenchSpecNoteFolderTarget(value: unknown): WorkbenchSelectionTarget | null {
  if (!isRecord(value)) return null;
  const kind = value.kind;
  if (kind === 'page') {
    const pageId = getNullableString(value.pageId);
    const sourceFile = getNullableString(value.sourceFile);
    if (!pageId && !sourceFile) return null;
    return {
      kind,
      ...(pageId ? { pageId } : {}),
      ...(sourceFile ? { sourceFile } : {}),
      extensions: isRecord(value.extensions) ? value.extensions : {},
    };
  }
  if (kind === 'component') {
    const componentId = getNullableString(value.componentId);
    const sourceFile = getNullableString(value.sourceFile);
    if (!componentId && !sourceFile) return null;
    return {
      kind,
      ...(componentId ? { componentId } : {}),
      ...(sourceFile ? { sourceFile } : {}),
      extensions: isRecord(value.extensions) ? value.extensions : {},
    };
  }
  return null;
}

function getSpecNoteType(value: unknown): WorkbenchSpecNoteType {
  if (
    value === 'behavior' ||
    value === 'content' ||
    value === 'intent' ||
    value === 'qa' ||
    value === 'question' ||
    value === 'responsive'
  ) {
    return value;
  }
  return 'intent';
}

function getNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getPositiveNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function normalizeWorkbenchSpecNoteHighlightBoxRect(
  rect: WorkbenchSpecNoteHighlightBoxRect,
): WorkbenchSpecNoteHighlightBoxRect {
  const unit = rect.unit === 'px' ? 'px' : 'ratio';
  const resizeMode = getSpecNoteHighlightBoxResizeMode(rect.resizeMode);
  if (unit === 'px') {
    return {
      unit,
      x: normalizePixelCoordinate(rect.x),
      y: normalizePixelCoordinate(rect.y),
      width: normalizePixelDimension(rect.width),
      height: normalizePixelDimension(rect.height),
      ...(rect.anchorX ? { anchorX: rect.anchorX } : {}),
      ...(rect.anchorY ? { anchorY: rect.anchorY } : {}),
      ...(resizeMode === 'fixed' ? {} : { resizeMode }),
      ...(rect.targetWidth ? { targetWidth: normalizePixelDimension(rect.targetWidth) } : {}),
      ...(rect.targetHeight ? { targetHeight: normalizePixelDimension(rect.targetHeight) } : {}),
    };
  }

  const x = clampUnit(rect.x);
  const y = clampUnit(rect.y);
  const maxWidth = Math.max(0, 1 - x);
  const maxHeight = Math.max(0, 1 - y);
  return {
    unit,
    x,
    y,
    width: Math.min(maxWidth, clampUnit(rect.width)),
    height: Math.min(maxHeight, clampUnit(rect.height)),
  };
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 10000) / 10000));
}

function normalizePixelCoordinate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 2) / 2);
}

function normalizePixelDimension(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 2) / 2);
}

function getSpecNoteHighlightBoxAnchor(value: unknown): WorkbenchSpecNoteHighlightBoxAnchor | undefined {
  return value === 'center' || value === 'end' || value === 'start' ? value : undefined;
}

function getSpecNoteHighlightBoxResizeMode(value: unknown): WorkbenchSpecNoteHighlightBoxResizeMode {
  return value === 'both' || value === 'horizontal' || value === 'vertical' ? value : 'fixed';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
