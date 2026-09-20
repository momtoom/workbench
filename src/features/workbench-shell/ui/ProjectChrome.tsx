import { useState } from 'react';
import { FolderOpen, FolderPlus, FolderX, X } from 'lucide-react';
import { Button, IconButton, TextField } from '@shared/ui/primitives';
import {
  getWorkbenchHistoryPath,
  getWorkbenchNotesPath,
  getWorkbenchTokenCssPath,
  type WorkbenchProjectTemplateId,
  type WorkbenchProjectSnapshot,
} from '@domain/project/workbenchProjectLoader';
import type { WorkbenchProjectLocation } from '@domain/project/workbenchProject';
import type { TokenCollection } from '@domain/design-system/tokens/types';
import { normalizeImportedRegistry } from '@domain/design-system/tokens/operations';
import { ModalLayer } from './ModalLayer';

const PROJECT_TEMPLATE_OPTIONS: {
  description: string;
  id: WorkbenchProjectTemplateId;
  label: string;
  meta: string;
}[] = [
  {
    id: 'standard',
    label: 'Default',
    meta: 'React + Tailwind utilities',
    description: 'Creates a source-backed project with Workbench tokens, Tailwind utilities, and preview CSS metadata.',
  },
  {
    id: 'shadcn-base',
    label: 'shadcn',
    meta: 'Vite + Base UI',
    description: 'For shadcn-style components built on Base UI primitives, Tailwind theme variables, and utility classes.',
  },
  {
    id: 'astryx',
    label: 'Astryx',
    meta: 'Components + themes',
    description: 'Creates the Astryx component library, editable theme tokens, and local design samples without Apple Music credentials.',
  },
];

export function ProjectInfoLayer({
  closing,
  onClose,
  onCloseProject,
  onOpenLicenses,
  snapshot,
}: {
  closing: boolean;
  onClose: () => void;
  onCloseProject: () => void;
  onOpenLicenses: () => void;
  snapshot: WorkbenchProjectSnapshot;
}) {
  const registry = normalizeImportedRegistry(snapshot.tokens);
  const storage = getProjectStorageSummary(snapshot.location);

  return (
    <div className="wb-popover-panel wb-popover-panel--form wb-project-info-layer" role="dialog" aria-label="Project information">
      <div className="wb-project-info-head">
        <div>
          <p className="wb-kicker">{storage.kicker}</p>
          <strong>{snapshot.config.projectName}</strong>
        </div>
        <IconButton label="Close project information" title="Close" onClick={onClose}>
          <X size={13} />
        </IconButton>
      </div>
      <div className="wb-project-info-metrics" aria-label="Project registries">
        <span><strong>{countTokens(registry.collections)}</strong><small>Tokens</small></span>
        <span><strong>{snapshot.pages.pages.length}</strong><small>Pages</small></span>
        <span><strong>{snapshot.components.components.length}</strong><small>Components</small></span>
        <span><strong>{snapshot.comments.comments.length}</strong><small>Notes</small></span>
      </div>
      <dl className="wb-project-paths">
        <div>
          <dt>Storage</dt>
          <dd className="wb-project-storage-value">
            <span>{storage.label}</span>
            <small>{storage.detail}</small>
          </dd>
        </div>
        <div>
          <dt>Root</dt>
          <dd title={snapshot.location.rootPath ?? undefined}>{snapshot.location.rootPath ?? 'Current app root'}</dd>
        </div>
        <div>
          <dt>Manifest</dt>
          <dd>{snapshot.location.configPath}</dd>
        </div>
        <div>
          <dt>Tokens</dt>
          <dd>{snapshot.config.paths.tokens}</dd>
        </div>
        <div>
          <dt>Token CSS</dt>
          <dd>{getWorkbenchTokenCssPath(snapshot.config)}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{getWorkbenchNotesPath(snapshot.config)}</dd>
        </div>
        <div>
          <dt>Pages</dt>
          <dd>{snapshot.config.paths.pages}</dd>
        </div>
        <div>
          <dt>Components</dt>
          <dd>{snapshot.config.paths.components}</dd>
        </div>
        <div>
          <dt>History</dt>
          <dd>{snapshot.config.paths.history ?? getWorkbenchHistoryPath(snapshot.config)}</dd>
        </div>
      </dl>
      <div className="wb-project-info-actions">
        <Button
          className="wb-project-license-button"
          tone="ghost"
          onClick={onOpenLicenses}
        >
          Open-source licenses
        </Button>
        <Button
          className="wb-icon-text-button wb-project-close-button"
          tone="ghost"
          disabled={closing}
          onClick={onCloseProject}
        >
          <FolderX size={14} aria-hidden="true" />
          <span>{closing ? 'Closing project' : 'Close project'}</span>
        </Button>
      </div>
    </div>
  );
}

export function ProjectMenu({
  busyState,
  onInitializeProject,
  onOpenProject,
}: {
  busyState: 'idle' | 'opening' | 'initializing' | 'closing';
  onInitializeProject: () => void;
  onOpenProject: () => void;
}) {
  return (
    <div className="wb-popover-panel wb-project-menu" role="menu" aria-label="Project menu">
      <button type="button" role="menuitem" disabled={busyState !== 'idle'} onClick={onOpenProject}>
        <FolderOpen size={13} />
        <span>{busyState === 'opening' ? 'Opening project' : 'Open project'}</span>
      </button>
      <button type="button" role="menuitem" disabled={busyState !== 'idle'} onClick={onInitializeProject}>
        <FolderPlus size={13} />
        <span>{busyState === 'initializing' ? 'Initializing project' : 'Initialize project'}</span>
      </button>
    </div>
  );
}

export function InitializeProjectModal({
  busy,
  onClose,
  onInitialize,
}: {
  busy: boolean;
  onClose: () => void;
  onInitialize: (projectName: string, templateId: WorkbenchProjectTemplateId) => void;
}) {
  const [projectName, setProjectName] = useState('');
  const [templateId, setTemplateId] = useState<WorkbenchProjectTemplateId>('standard');

  return (
    <ModalLayer className="wb-initialize-project-modal" title="Initialize project" onClose={onClose}>
      <label className="wb-field-label">
        <span>Project name</span>
        <TextField
          autoFocus
          aria-label="New project name"
          placeholder="New project"
          value={projectName}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onInitialize(projectName, templateId);
          }}
          onValueChange={setProjectName}
        />
      </label>
      <div className="wb-field-label">
        <span>Project setup</span>
        <div className="wb-project-template-options" role="radiogroup" aria-label="Project setup">
          {PROJECT_TEMPLATE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-checked={templateId === option.id}
              className={templateId === option.id ? 'wb-project-template-option wb-project-template-option--selected' : 'wb-project-template-option'}
              disabled={busy}
              role="radio"
              onClick={() => setTemplateId(option.id)}
            >
              <span className="wb-project-template-option-head">
                <strong>{option.label}</strong>
                <span>{option.meta}</span>
              </span>
              <span className="wb-project-template-option-copy">{option.description}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="wb-modal-actions">
        <Button tone="ghost" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button className="wb-icon-text-button" tone="primary" disabled={busy} onClick={() => onInitialize(projectName, templateId)}>
          <FolderPlus size={13} />
          <span>{busy ? 'Initializing' : 'Initialize'}</span>
        </Button>
      </div>
    </ModalLayer>
  );
}

export function ProjectMessageModal({
  message,
  onClose,
  title,
}: {
  message: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <ModalLayer title={title} onClose={onClose}>
      <p className="wb-modal-copy">{message}</p>
      <div className="wb-modal-actions">
        <Button tone="primary" onClick={onClose}>OK</Button>
      </div>
    </ModalLayer>
  );
}

function countTokens(collections: TokenCollection[]): number {
  return collections.reduce((total, collection) => total + collection.tokens.length, 0);
}

function getProjectStorageSummary(location: WorkbenchProjectLocation): {
  detail: string;
  kicker: string;
  label: string;
} {
  if (location.source === 'local-bridge') {
    return {
      detail: 'Desktop bridge',
      kicker: 'Local folder connected',
      label: 'Local folder',
    };
  }

  if (location.source === 'dev-server') {
    return {
      detail: 'Same-origin host',
      kicker: 'Project host connected',
      label: 'App host',
    };
  }

  return {
    detail: 'Read-only fallback',
    kicker: 'Bundled project loaded',
    label: 'Bundled files',
  };
}
