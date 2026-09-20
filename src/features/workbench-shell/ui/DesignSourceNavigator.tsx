import {
  ChevronRight,
  Component,
  Copy,
  FileText,
  Folder,
  FolderPlus,
  Pencil,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { Fragment, useRef, useState } from 'react';
import type { DragEvent as ReactDragEvent, ReactNode } from 'react';
import type { createEditableDocumentTreeFromProjectSource } from '@domain/document/editableTreeProjectSource';
import type {
  WorkbenchSelectionTarget,
} from '@domain/project/workbenchProject';
import {
  getPageFolderForSourceFile,
} from '@domain/project/workbenchPageFolders';
import type {
  WorkbenchOpenDesignTargetDropPosition,
} from '@domain/project/openDesignTargetOrder';
import { IconButton, TextField } from '@shared/ui/primitives';
import { InlineEditActions, InlineEditFrame } from './InlineEditControls';
import {
  WorkbenchEditorTargetTab,
  WorkbenchEditorTargetTabs,
} from './WorkbenchEditorShell';
import {
  WorkbenchSidebarRow,
  WorkbenchSidebarRowList,
} from './WorkbenchSidebarPrimitives';

/**
 * Page-tree structure work has its own undo stack, separate from any page's.
 * `label` names the step the button would act on, so the tooltip can say what
 * is about to happen instead of just "Undo".
 */
export type WorkspaceHistoryStatus = {
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
};

export const DESIGN_SOURCE_GROUP_IDS = ['pages', 'components'] as const;
export type DesignSourceGroupId = typeof DESIGN_SOURCE_GROUP_IDS[number];

export type DesignSourceTarget =
  | {
      id: string;
      kind: 'page';
      label: string;
      meta: string;
      sourceFile: string;
      target: WorkbenchSelectionTarget;
    }
  | {
      id: string;
      kind: 'component';
      label: string;
      meta: string;
      sourceFile: string;
      target: WorkbenchSelectionTarget;
    };

const DESIGN_PAGE_DRAG_MIME = 'application/x-wb-design-page';
const DESIGN_FOLDER_DRAG_MIME = 'application/x-wb-design-folder';

export type DesignSourceTreeDropIndicator =
  | { kind: 'folder'; folder: string; position: 'before' | 'after' | 'inside' }
  | { kind: 'page'; targetKey: string; position: 'before' | 'after' }
  | { kind: 'root' };

function computeRowDropPosition(
  event: ReactDragEvent<HTMLElement>,
  allowInside: boolean,
): 'before' | 'after' | 'inside' {
  const rect = event.currentTarget.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const h = rect.height || 1;
  if (!allowInside) return y < h / 2 ? 'before' : 'after';
  const edge = h * 0.3;
  if (y < edge) return 'before';
  if (y > h - edge) return 'after';
  return 'inside';
}

export function DesignSourceTargetList({
  activeSource,
  collapsedGroupIds,
  collapsedFolderPaths,
  folderPaths,
  editingTargetKey,
  editingFolderPath,
  folderNameDraft,
  draggingPageTargetKey,
  draggingFolderPath,
  dropIndicator,
  onCancelRename,
  onChangeRenameDraft,
  onCommitRename,
  onCreatePage,
  onDeletePage,
  onDuplicatePage,
  onSelectTarget,
  onStartRename,
  onToggleGroup,
  onToggleSource,
  onCreateFolder,
  onUndoWorkspace,
  onRedoWorkspace,
  workspaceHistoryStatus,
  onCreateSubfolder,
  onToggleFolder,
  onStartRenameFolder,
  onChangeFolderNameDraft,
  onCommitRenameFolder,
  onCancelRenameFolder,
  onDeleteFolder,
  onMovePageToFolder,
  onReorderPage,
  onReorderFolder,
  onNestFolder,
  onPageDragStateChange,
  onFolderDragStateChange,
  onDropIndicatorChange,
  sourceCollapsed,
  targetNameDraft,
  targets,
}: {
  activeSource: ReturnType<typeof createEditableDocumentTreeFromProjectSource>['source'];
  collapsedGroupIds: DesignSourceGroupId[];
  collapsedFolderPaths: string[];
  folderPaths: string[];
  editingTargetKey: string | null;
  editingFolderPath: string | null;
  folderNameDraft: string;
  draggingPageTargetKey: string | null;
  draggingFolderPath: string | null;
  dropIndicator: DesignSourceTreeDropIndicator | null;
  onCancelRename: () => void;
  onChangeRenameDraft: (value: string) => void;
  onCommitRename: (target: DesignSourceTarget) => void;
  onCreatePage: (folder?: string) => void;
  onDeletePage: (target: DesignSourceTarget) => void;
  onDuplicatePage: (target: DesignSourceTarget) => void;
  onSelectTarget: (target: DesignSourceTarget) => void;
  onStartRename: (target: DesignSourceTarget) => void;
  onToggleGroup: (groupId: DesignSourceGroupId) => void;
  onToggleSource: () => void;
  onCreateFolder: () => void;
  onUndoWorkspace: () => void;
  onRedoWorkspace: () => void;
  workspaceHistoryStatus: WorkspaceHistoryStatus;
  onCreateSubfolder: (folderPath: string) => void;
  onToggleFolder: (folderPath: string) => void;
  onStartRenameFolder: (folderPath: string) => void;
  onChangeFolderNameDraft: (value: string) => void;
  onCommitRenameFolder: (folderPath: string) => void;
  onCancelRenameFolder: () => void;
  onDeleteFolder: (folderPath: string) => void;
  onMovePageToFolder: (target: DesignSourceTarget, folderPath: string) => void;
  onReorderPage: (draggedKey: string, targetKey: string, position: 'before' | 'after') => void;
  onReorderFolder: (draggedPath: string, targetPath: string, position: 'before' | 'after') => void;
  onNestFolder: (draggedPath: string, parentPath: string) => void;
  onPageDragStateChange: (targetKey: string | null) => void;
  onFolderDragStateChange: (folderPath: string | null) => void;
  onDropIndicatorChange: (next: DesignSourceTreeDropIndicator | null) => void;
  sourceCollapsed: boolean;
  targetNameDraft: string;
  targets: DesignSourceTarget[];
}) {
  const pageTargets = targets.filter((target) => target.kind === 'page');
  const collapsedGroups = new Set(collapsedGroupIds);
  const collapsedFolders = new Set(collapsedFolderPaths);

  // Group pages by their folder, and folders by their parent, so the tree can
  // be rendered recursively. '' is the Pages root.
  const pagesByFolder = new Map<string, DesignSourceTarget[]>();
  for (const target of pageTargets) {
    const folder = getPageFolderForSourceFile(target.sourceFile);
    const list = pagesByFolder.get(folder) ?? [];
    list.push(target);
    pagesByFolder.set(folder, list);
  }
  const childFoldersByParent = new Map<string, string[]>();
  for (const folder of folderPaths) {
    const parent = folder.includes('/') ? folder.slice(0, folder.lastIndexOf('/')) : '';
    const list = childFoldersByParent.get(parent) ?? [];
    list.push(folder);
    childFoldersByParent.set(parent, list);
  }

  const isDraggingPage = !!draggingPageTargetKey;
  const isDraggingFolder = !!draggingFolderPath;
  const isDraggingAny = isDraggingPage || isDraggingFolder;

  function resolveDraggedPageTarget(event: ReactDragEvent): DesignSourceTarget | null {
    const targetKey = event.dataTransfer.getData(DESIGN_PAGE_DRAG_MIME) || draggingPageTargetKey;
    if (!targetKey) return null;
    return pageTargets.find((candidate) => getDesignTargetKey(candidate) === targetKey) ?? null;
  }

  function resolveDraggedFolderPath(event: ReactDragEvent): string | null {
    const path = event.dataTransfer.getData(DESIGN_FOLDER_DRAG_MIME) || draggingFolderPath;
    return path || null;
  }

  function clearDragState() {
    onPageDragStateChange(null);
    onFolderDragStateChange(null);
    onDropIndicatorChange(null);
  }

  function renderTarget(target: DesignSourceTarget, depth: number) {
    const targetKey = getDesignTargetKey(target);
    const isEditing = editingTargetKey === targetKey;
    const rowLabel = target.kind === 'page'
      ? getDesignSourceFileName(target.sourceFile)
      : target.label;
    const draggedPage = isDraggingPage
      ? pageTargets.find((candidate) => getDesignTargetKey(candidate) === draggingPageTargetKey) ?? null
      : null;
    const draggedPageFolder = draggedPage?.kind === 'page'
      ? getPageFolderForSourceFile(draggedPage.sourceFile)
      : null;
    const rowFolder = target.kind === 'page' ? getPageFolderForSourceFile(target.sourceFile) : null;
    const acceptsPageReorder = target.kind === 'page'
      && isDraggingPage
      && draggingPageTargetKey !== targetKey
      && draggedPageFolder !== null
      && draggedPageFolder === rowFolder;
    const myDropPosition = dropIndicator?.kind === 'page' && dropIndicator.targetKey === targetKey
      ? dropIndicator.position
      : null;
    return (
      <WorkbenchSidebarRow
        key={`${target.kind}:${target.id}`}
        density="compact"
        indentLevel={depth}
        draggable={!isEditing && target.kind === 'page'}
        selected={isDesignTargetActive(activeSource, target)}
        label={rowLabel}
        leading={target.kind === 'page' ? <FileText size={13} /> : <Component size={13} />}
        meta={isEditing || target.kind === 'page' ? null : target.meta}
        dropPosition={myDropPosition}
        onDragStart={(event) => {
          event.dataTransfer.setData(DESIGN_PAGE_DRAG_MIME, targetKey);
          event.dataTransfer.effectAllowed = 'move';
          onPageDragStateChange(targetKey);
        }}
        onDragOver={acceptsPageReorder ? (event) => {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = 'move';
          const position = computeRowDropPosition(event, false);
          if (position === 'inside') return;
          if (
            dropIndicator?.kind !== 'page'
            || dropIndicator.targetKey !== targetKey
            || dropIndicator.position !== position
          ) {
            onDropIndicatorChange({ kind: 'page', targetKey, position });
          }
        } : undefined}
        onDragLeave={acceptsPageReorder ? () => {
          if (dropIndicator?.kind === 'page' && dropIndicator.targetKey === targetKey) {
            onDropIndicatorChange(null);
          }
        } : undefined}
        onDrop={acceptsPageReorder ? (event) => {
          event.preventDefault();
          event.stopPropagation();
          const position = computeRowDropPosition(event, false);
          if (position !== 'inside' && draggingPageTargetKey) {
            onReorderPage(draggingPageTargetKey, targetKey, position);
          }
          clearDragState();
        } : undefined}
        onDragEnd={() => {
          clearDragState();
        }}
        editingControl={isEditing ? (
          // Commit / cancel via explicit buttons (or Enter / Escape).
          // We intentionally omit `onBlurOutside` here: clicking the Pencil to
          // start editing first unmounts the actions row, which lets focus
          // briefly fall to <body> before the input's autoFocus catches it —
          // that gap would otherwise fire onBlurOutside and cancel immediately.
          <InlineEditFrame>
            <input
              autoFocus
              className="wb-inline-edit-input"
              type="text"
              value={targetNameDraft}
              aria-label={`Rename ${target.label}`}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onChangeRenameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onCommitRename(target);
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  onCancelRename();
                }
              }}
            />
            <InlineEditActions
              onCancel={onCancelRename}
              onCommit={() => onCommitRename(target)}
            />
          </InlineEditFrame>
        ) : undefined}
        actions={isEditing ? null : target.kind === 'page' ? (
          <>
            <IconButton
              label={`Rename ${target.label}`}
              title={`Rename ${target.label}`}
              onClick={() => onStartRename(target)}
            >
              <Pencil size={12} />
            </IconButton>
            <IconButton
              label={`Duplicate ${target.label}`}
              title={`Duplicate ${target.label}`}
              onClick={() => onDuplicatePage(target)}
            >
              <Copy size={12} />
            </IconButton>
            <IconButton
              label={`Delete ${target.label}`}
              title={`Delete ${target.label}`}
              onClick={() => onDeletePage(target)}
            >
              <Trash2 size={12} />
            </IconButton>
          </>
        ) : null}
        actionsWidth={isEditing ? undefined : (target.kind === 'page' ? 80 : 52)}
        onSelect={() => onSelectTarget(target)}
      />
    );
  }

  function renderFolder(folder: string, depth: number): ReactNode {
    const folderName = folder.includes('/') ? folder.slice(folder.lastIndexOf('/') + 1) : folder;
    const isCollapsed = collapsedFolders.has(folder);
    const isEditing = editingFolderPath === folder;
    const childFolders = childFoldersByParent.get(folder) ?? [];
    const childPages = pagesByFolder.get(folder) ?? [];
    const folderParent = folder.includes('/') ? folder.slice(0, folder.lastIndexOf('/')) : '';
    const isSelfOrDescendant = (other: string) => other === folder || other.startsWith(`${folder}/`);
    const folderRowDropPosition = (() => {
      if (!dropIndicator || dropIndicator.kind !== 'folder' || dropIndicator.folder !== folder) return null;
      return dropIndicator.position;
    })();
    // Decide which drop positions this folder row accepts based on the dragged item.
    const acceptInside =
      (isDraggingPage)
      || (isDraggingFolder && draggingFolderPath !== null && !isSelfOrDescendant(draggingFolderPath));
    const acceptSibling =
      isDraggingFolder && draggingFolderPath !== null
      && draggingFolderPath !== folder
      && !isSelfOrDescendant(draggingFolderPath)
      && (draggingFolderPath.includes('/')
        ? draggingFolderPath.slice(0, draggingFolderPath.lastIndexOf('/')) === folderParent
        || true /* allow cross-parent sibling-as-nest? keep simple: allow sibling reorder only at same parent */
        : true);

    return (
      <Fragment key={`folder:${folder}`}>
        <WorkbenchSidebarRow
          density="compact"
          indentLevel={depth}
          draggable={!isEditing}
          collapseState={isCollapsed ? 'collapsed' : 'expanded'}
          onToggleCollapse={() => onToggleFolder(folder)}
          dropPosition={folderRowDropPosition}
          selected={false}
          label={isEditing ? '' : folderName}
          leading={<Folder size={13} />}
          onDragStart={(event) => {
            event.dataTransfer.setData(DESIGN_FOLDER_DRAG_MIME, folder);
            event.dataTransfer.effectAllowed = 'move';
            onFolderDragStateChange(folder);
          }}
          onDragOver={(acceptInside || acceptSibling) ? (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = 'move';
            const allowInside = acceptInside;
            let position = computeRowDropPosition(event, allowInside);
            if (!acceptSibling && position !== 'inside') return;
            if (position === 'inside' && !allowInside) {
              position = 'after';
            }
            if (
              dropIndicator?.kind !== 'folder'
              || dropIndicator.folder !== folder
              || dropIndicator.position !== position
            ) {
              onDropIndicatorChange({ kind: 'folder', folder, position });
            }
          } : undefined}
          onDragLeave={() => {
            if (dropIndicator?.kind === 'folder' && dropIndicator.folder === folder) {
              onDropIndicatorChange(null);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            const allowInside = acceptInside;
            const position = computeRowDropPosition(event, allowInside);
            const draggedPage = resolveDraggedPageTarget(event);
            const draggedFolder = resolveDraggedFolderPath(event);
            if (draggedPage) {
              if (position === 'inside') onMovePageToFolder(draggedPage, folder);
              else onMovePageToFolder(draggedPage, folderParent);
            } else if (draggedFolder && draggedFolder !== folder && !draggedFolder.startsWith(`${folder}/`)) {
              if (position === 'inside') onNestFolder(draggedFolder, folder);
              else onReorderFolder(draggedFolder, folder, position);
            }
            clearDragState();
          }}
          onDragEnd={() => {
            clearDragState();
          }}
          editingControl={isEditing ? (
            <InlineEditFrame>
              <input
                autoFocus
                className="wb-inline-edit-input"
                type="text"
                value={folderNameDraft}
                aria-label={`Rename folder ${folderName}`}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => onChangeFolderNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onCommitRenameFolder(folder);
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    onCancelRenameFolder();
                  }
                }}
              />
              <InlineEditActions
                onCancel={onCancelRenameFolder}
                onCommit={() => onCommitRenameFolder(folder)}
              />
            </InlineEditFrame>
          ) : undefined}
          actions={isEditing ? null : (
            <>
              <IconButton
                label={`New page in ${folderName}`}
                title={`New page in ${folderName}`}
                onClick={() => onCreatePage(folder)}
              >
                <Plus size={12} />
              </IconButton>
              <IconButton
                label={`New folder in ${folderName}`}
                title={`New folder in ${folderName}`}
                onClick={() => onCreateSubfolder(folder)}
              >
                <FolderPlus size={12} />
              </IconButton>
              <IconButton
                label={`Rename folder ${folderName}`}
                title={`Rename folder ${folderName}`}
                onClick={() => onStartRenameFolder(folder)}
              >
                <Pencil size={12} />
              </IconButton>
              <IconButton
                label={`Delete folder ${folderName}`}
                title={`Delete folder ${folderName}`}
                onClick={() => onDeleteFolder(folder)}
              >
                <Trash2 size={12} />
              </IconButton>
            </>
          )}
          actionsWidth={isEditing ? undefined : 108}
          onSelect={() => onToggleFolder(folder)}
        />
        {isCollapsed ? null : (
          <>
            {childFolders.map((childFolder) => renderFolder(childFolder, depth + 1))}
            {childPages.map((target) => renderTarget(target, depth + 1))}
          </>
        )}
      </Fragment>
    );
  }

  const rootFolders = childFoldersByParent.get('') ?? [];
  const rootPages = pagesByFolder.get('') ?? [];
  const isRootDropTarget = dropIndicator?.kind === 'root';

  return (
    <>
      <DesignSourceSectionHeader
        collapsed={sourceCollapsed}
        onCreatePage={() => onCreatePage()}
        onCreateFolder={onCreateFolder}
        historyStatus={workspaceHistoryStatus}
        onUndoWorkspace={onUndoWorkspace}
        onRedoWorkspace={onRedoWorkspace}
        onToggle={onToggleSource}
      />
      <WorkbenchSidebarRowList
        id="wb-design-source-list"
        className={['wb-design-source-list', sourceCollapsed ? 'wb-design-source-list--collapsed' : ''].filter(Boolean).join(' ')}
        ariaLabel="Design source targets"
        density="compact"
      >
        {sourceCollapsed ? null : (pageTargets.length > 0 || folderPaths.length > 0) ? (
          <DesignSourceTargetGroup
            collapsed={collapsedGroups.has('pages')}
            count={pageTargets.length}
            groupId="pages"
            label="Pages"
            onToggle={onToggleGroup}
            dropActive={isRootDropTarget}
            onDragOver={(event) => {
              if (!isDraggingAny) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              if (dropIndicator?.kind !== 'root') onDropIndicatorChange({ kind: 'root' });
            }}
            onDragLeave={() => {
              if (dropIndicator?.kind === 'root') onDropIndicatorChange(null);
            }}
            onDrop={(event) => {
              event.preventDefault();
              const draggedPage = resolveDraggedPageTarget(event);
              const draggedFolder = resolveDraggedFolderPath(event);
              if (draggedPage) onMovePageToFolder(draggedPage, '');
              else if (draggedFolder) onNestFolder(draggedFolder, '');
              clearDragState();
            }}
          >
            {rootFolders.map((folder) => renderFolder(folder, 0))}
            {rootPages.map((target) => renderTarget(target, 0))}
          </DesignSourceTargetGroup>
        ) : (
          <WorkbenchSidebarRow
            density="compact"
            selected={false}
            label="No source"
            meta="Add a page"
            onSelect={() => {}}
          />
        )}
      </WorkbenchSidebarRowList>
    </>
  );
}

function DesignSourceSectionHeader({
  collapsed,
  historyStatus,
  onCreatePage,
  onCreateFolder,
  onRedoWorkspace,
  onUndoWorkspace,
  onToggle,
}: {
  collapsed: boolean;
  historyStatus: WorkspaceHistoryStatus;
  onCreatePage: () => void;
  onCreateFolder: () => void;
  onRedoWorkspace: () => void;
  onUndoWorkspace: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="wb-sidebar-section-head wb-sidebar-section-head--compact">
      <button
        type="button"
        className="wb-design-source-section-toggle"
        aria-controls="wb-design-source-list"
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <ChevronRight size={13} aria-hidden="true" />
        <span className="wb-kicker">Source</span>
      </button>
      <div className="wb-sidebar-section-actions">
        {/*
          Page-tree work (move, reorder, folder create/rename/delete) has its own
          stack, because a deleted folder's undo cannot live in the stack of a
          page that no longer exists. The buttons make that stack visible: which
          one they act on is never ambiguous, and disabled says "nothing here".
        */}
        <IconButton
          label="Undo source change"
          title={historyStatus.undoLabel ? `Undo ${historyStatus.undoLabel}` : 'Nothing to undo here'}
          disabled={!historyStatus.canUndo}
          onClick={onUndoWorkspace}
        >
          <Undo2 size={14} />
        </IconButton>
        <IconButton
          label="Redo source change"
          title={historyStatus.redoLabel ? `Redo ${historyStatus.redoLabel}` : 'Nothing to redo here'}
          disabled={!historyStatus.canRedo}
          onClick={onRedoWorkspace}
        >
          <Redo2 size={14} />
        </IconButton>
        <IconButton label="New folder" title="New folder" onClick={onCreateFolder}>
          <FolderPlus size={14} />
        </IconButton>
        <IconButton label="Create page" title="Create page" onClick={onCreatePage}>
          <Plus size={14} />
        </IconButton>
      </div>
    </div>
  );
}

function DesignSourceTargetGroup({
  children,
  collapsed,
  count,
  groupId,
  label,
  onToggle,
  dropActive = false,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  children: ReactNode;
  collapsed: boolean;
  count: number;
  groupId: DesignSourceGroupId;
  label: string;
  onToggle: (groupId: DesignSourceGroupId) => void;
  dropActive?: boolean;
  onDragOver?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDrop?: (event: ReactDragEvent<HTMLDivElement>) => void;
}) {
  const bodyId = `wb-design-source-group-${groupId}`;

  return (
    <div
      className={['wb-design-source-group', dropActive ? 'wb-design-source-group--drop-active' : ''].filter(Boolean).join(' ')}
      aria-label={label}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <button
        type="button"
        className="wb-design-source-group-toggle"
        aria-controls={bodyId}
        aria-expanded={!collapsed}
        onClick={() => onToggle(groupId)}
      >
        <ChevronRight size={12} aria-hidden="true" />
        <span className="wb-design-source-group-label">{label}</span>
        <span className="wb-design-source-group-count">{count}</span>
      </button>
      {collapsed ? null : (
        <div id={bodyId} className="wb-design-source-group-body">
          {children}
        </div>
      )}
    </div>
  );
}

export function DesignSourceTargetTabs({
  activeSource,
  editingTargetKey,
  nameDraft,
  onCancelRename,
  onCloseTarget,
  onCommitRename,
  onDraftNameChange,
  onReorderTarget,
  onStartRename,
  onSelectTarget,
  targets,
  trailing,
}: {
  activeSource: ReturnType<typeof createEditableDocumentTreeFromProjectSource>['source'];
  editingTargetKey: string | null;
  nameDraft: string;
  onCancelRename: () => void;
  onCloseTarget: (target: DesignSourceTarget) => void;
  onCommitRename: (target: DesignSourceTarget) => void;
  onDraftNameChange: (value: string) => void;
  onReorderTarget: (
    draggedKey: string,
    targetKey: string,
    position: WorkbenchOpenDesignTargetDropPosition,
  ) => void;
  onStartRename: (target: DesignSourceTarget) => void;
  onSelectTarget: (target: DesignSourceTarget) => void;
  targets: DesignSourceTarget[];
  trailing?: ReactNode;
}) {
  const draggedTargetKeyRef = useRef<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    position: WorkbenchOpenDesignTargetDropPosition;
    targetKey: string;
  } | null>(null);

  const clearDragState = () => {
    draggedTargetKeyRef.current = null;
    setDropIndicator(null);
  };
  const resolveDropPosition = (
    draggedKey: string,
    targetKey: string,
  ): WorkbenchOpenDesignTargetDropPosition | null => {
    const draggedIndex = targets.findIndex((target) => getDesignTargetKey(target) === draggedKey);
    const targetIndex = targets.findIndex((target) => getDesignTargetKey(target) === targetKey);
    if (draggedIndex < 0 || targetIndex < 0 || draggedIndex === targetIndex) return null;
    return draggedIndex < targetIndex ? 'after' : 'before';
  };

  return (
    <WorkbenchEditorTargetTabs ariaLabel="Preview source targets" trailing={trailing}>
      {targets.map((target) => {
        const targetKey = getDesignTargetKey(target);
        const isEditing = editingTargetKey === targetKey;

        return (
          <WorkbenchEditorTargetTab
            key={targetKey}
            active={isDesignTargetActive(activeSource, target)}
            closeIcon={<X size={12} />}
            closeLabel={`Close ${target.label}`}
            draggable={!isEditing}
            dropPosition={dropIndicator?.targetKey === targetKey ? dropIndicator.position : null}
            editingControl={isEditing ? (
              <TextField
                aria-label={`Rename ${target.label}`}
                autoFocus
                className="wb-editor-target-tab-input"
                value={nameDraft}
                onBlur={() => onCommitRename(target)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onCommitRename(target);
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    onCancelRename();
                  }
                }}
                onValueChange={onDraftNameChange}
              />
            ) : null}
            label={target.label}
            title={`${target.label} · ${target.sourceFile}`}
            onClose={() => onCloseTarget(target)}
            onDragEnd={clearDragState}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              setDropIndicator((current) => current?.targetKey === targetKey ? null : current);
            }}
            onDragOver={(event) => {
              const draggedTargetKey = draggedTargetKeyRef.current;
              if (!draggedTargetKey || draggedTargetKey === targetKey) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              const position = resolveDropPosition(draggedTargetKey, targetKey);
              if (!position) return;
              setDropIndicator((current) => (
                current?.targetKey === targetKey && current.position === position
                  ? current
                  : { position, targetKey }
              ));
            }}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', targetKey);
              draggedTargetKeyRef.current = targetKey;
              setDropIndicator(null);
            }}
            onDrop={(event) => {
              const draggedTargetKey = draggedTargetKeyRef.current
                ?? event.dataTransfer.getData('text/plain');
              if (!draggedTargetKey || draggedTargetKey === targetKey) {
                clearDragState();
                return;
              }
              const position = resolveDropPosition(draggedTargetKey, targetKey);
              if (!position) {
                clearDragState();
                return;
              }
              event.preventDefault();
              onReorderTarget(draggedTargetKey, targetKey, position);
              clearDragState();
            }}
            onSelect={() => onSelectTarget(target)}
            onStartEdit={() => onStartRename(target)}
          />
        );
      })}
    </WorkbenchEditorTargetTabs>
  );
}


export function getDesignSourceFileName(sourceFile: string): string {
  const normalizedSourceFile = sourceFile.replace(/\\/g, '/');
  return normalizedSourceFile.slice(normalizedSourceFile.lastIndexOf('/') + 1) || sourceFile;
}

export function getDesignTargetKey(target: DesignSourceTarget): string {
  return `${target.kind}:${target.id}`;
}

export function isDesignTargetActive(
  activeSource: ReturnType<typeof createEditableDocumentTreeFromProjectSource>['source'],
  target: DesignSourceTarget,
): boolean {
  return activeSource.kind === target.kind && activeSource.id === target.id;
}
