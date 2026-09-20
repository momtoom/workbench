import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { IconButton } from '@shared/ui/primitives';

type WorkbenchEditorCssVariables = CSSProperties & {
  '--wb-collections-list-height'?: string;
  '--wb-inspector-width'?: string;
  '--wb-sidebar-primary-list-height'?: string;
  '--wb-sidebar-width'?: string;
};

type WorkbenchEditorFrameProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  inspectorWidth?: number;
  layout?: 'sidebar-surface' | 'sidebar-surface-inspector';
  sidebarWidth?: number;
};

export const WorkbenchEditorFrame = forwardRef<HTMLElement, WorkbenchEditorFrameProps>(
  function WorkbenchEditorFrame({
    ariaLabel,
    children,
    className,
    inspectorWidth,
    layout = 'sidebar-surface',
    sidebarWidth,
  }, ref) {
    const frameStyle: WorkbenchEditorCssVariables = {
      ...(sidebarWidth !== undefined ? { '--wb-sidebar-width': `${sidebarWidth}px` } : null),
      ...(inspectorWidth !== undefined ? { '--wb-inspector-width': `${inspectorWidth}px` } : null),
    };

    return (
      <section
        ref={ref}
        className={['wb-editor-frame', `wb-editor-frame--${layout}`, className].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
        style={frameStyle}
      >
        {children}
      </section>
    );
  },
);

type WorkbenchEditorSidebarProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  collectionsListHeight?: number;
  navigation?: ReactNode;
  primaryListHeight?: number;
};

export const WorkbenchEditorSidebar = forwardRef<HTMLElement, WorkbenchEditorSidebarProps>(
  function WorkbenchEditorSidebar({
    ariaLabel,
    children,
    className,
    collectionsListHeight,
    navigation,
    primaryListHeight,
  }, ref) {
    const panelStyle: WorkbenchEditorCssVariables = {
      ...(collectionsListHeight !== undefined ? { '--wb-collections-list-height': `${collectionsListHeight}px` } : null),
      ...(primaryListHeight !== undefined ? { '--wb-sidebar-primary-list-height': `${primaryListHeight}px` } : null),
    };

    return (
      <WorkbenchEditorPanel
        ref={ref}
        className={['wb-editor-sidebar', className].filter(Boolean).join(' ')}
        ariaLabel={ariaLabel}
        cssVariables={panelStyle}
        variant="sidebar"
      >
        {navigation ? <WorkbenchPanelNav>{navigation}</WorkbenchPanelNav> : null}
        {children}
      </WorkbenchEditorPanel>
    );
  },
);

type WorkbenchEditorPanelProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  cssVariables?: WorkbenchEditorCssVariables;
  variant?: 'sidebar' | 'inspector';
};

export const WorkbenchEditorPanel = forwardRef<HTMLElement, WorkbenchEditorPanelProps>(
  function WorkbenchEditorPanel({
    ariaLabel,
    children,
    className,
    cssVariables,
    variant = 'sidebar',
  }, ref) {
    return (
      <aside
        ref={ref}
        className={['wb-editor-panel', `wb-editor-panel--${variant}`, className].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
        style={cssVariables}
      >
        {children}
      </aside>
    );
  },
);

type WorkbenchEditorSurfaceProps = {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
};

export function WorkbenchEditorSurface({
  ariaLabel,
  children,
  className,
}: WorkbenchEditorSurfaceProps) {
  return (
    <main className={['wb-editor-surface', className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      {children}
    </main>
  );
}

type WorkbenchEditorPanelBodyProps = {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
};

export function WorkbenchEditorPanelBody({
  ariaLabel,
  children,
  className,
}: WorkbenchEditorPanelBodyProps) {
  return (
    <div className={['wb-editor-panel-body', className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function WorkbenchPanelFooter({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="wb-panel-footer">{children}</div>;
}

type WorkbenchEditorChromeHeaderProps = {
  ariaLabel?: string;
  children: ReactNode;
  className?: string;
};

export function WorkbenchEditorChromeHeader({
  ariaLabel,
  children,
  className,
}: WorkbenchEditorChromeHeaderProps) {
  return (
    <div className={['wb-editor-chrome-header', className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function WorkbenchEditorPanelHeader({
  ariaLabel,
  className,
  title,
  trailing,
}: {
  ariaLabel?: string;
  className?: string;
  title: ReactNode;
  trailing?: ReactNode;
}) {
  const headerLabel = typeof title === 'string' ? `${title} header` : 'Panel header';
  return (
    <WorkbenchEditorChromeHeader
      ariaLabel={ariaLabel ?? headerLabel}
      className={['wb-editor-panel-header', className].filter(Boolean).join(' ')}
    >
      <p className="wb-kicker">{title}</p>
      {trailing ? <span className="wb-editor-panel-header-trailing">{trailing}</span> : null}
    </WorkbenchEditorChromeHeader>
  );
}

export function WorkbenchPanelNav({
  children,
}: {
  children: ReactNode;
}) {
  return <WorkbenchEditorChromeHeader className="wb-panel-nav" ariaLabel="Workbench surface navigation">{children}</WorkbenchEditorChromeHeader>;
}

type WorkbenchEditorToolbarProps = {
  actions?: ReactNode;
  className?: string;
  meta?: ReactNode;
  status?: ReactNode;
  title: ReactNode;
};

export function WorkbenchEditorToolbar({
  actions,
  className,
  meta,
  status,
  title,
}: WorkbenchEditorToolbarProps) {
  return (
    <WorkbenchEditorChromeHeader className={['wb-editor-toolbar', className].filter(Boolean).join(' ')}>
      <div className="wb-editor-title-block">
        <h2 title={typeof title === 'string' ? title : undefined}>{title}</h2>
        {meta ? <span>{meta}</span> : null}
      </div>
      {actions || status ? (
        <div className="wb-toolbar-actions">
          {actions}
          {status ? <span className="wb-editor-status-pill">{status}</span> : null}
        </div>
      ) : null}
    </WorkbenchEditorChromeHeader>
  );
}

export function WorkbenchEditorTargetTabs({
  ariaLabel,
  children,
  trailing,
}: {
  ariaLabel: string;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [fadeEdges, setFadeEdges] = useState('');
  const updateFadeEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const maxScrollLeft = Math.max(0, list.scrollWidth - list.clientWidth);
    const hasLeftFade = list.scrollLeft > 1;
    const hasRightFade = list.scrollLeft < maxScrollLeft - 1;
    setFadeEdges(hasLeftFade && hasRightFade ? 'both' : hasLeftFade ? 'left' : hasRightFade ? 'right' : '');
  }, []);

  useEffect(() => {
    updateFadeEdges();
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(updateFadeEdges);
    observer.observe(list);
    return () => observer.disconnect();
  }, [children, updateFadeEdges]);

  return (
    <WorkbenchEditorChromeHeader className="wb-editor-target-tabs" ariaLabel={ariaLabel}>
      <div
        ref={listRef}
        className={['wb-editor-target-tab-list', fadeEdges ? `wb-editor-target-tab-list--fade-${fadeEdges}` : ''].filter(Boolean).join(' ')}
        onScroll={updateFadeEdges}
      >
        {children}
      </div>
      {trailing ? <span className="wb-editor-target-tabs-trailing">{trailing}</span> : null}
    </WorkbenchEditorChromeHeader>
  );
}

export function WorkbenchEditorTargetTab({
  active,
  closeIcon,
  closeLabel,
  draggable,
  dropPosition,
  editingControl,
  label,
  leading,
  meta,
  onClose,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onStartEdit,
  onSelect,
  title,
}: {
  active?: boolean;
  closeIcon?: ReactNode;
  closeLabel?: string;
  draggable?: boolean;
  dropPosition?: 'before' | 'after' | null;
  editingControl?: ReactNode;
  label: ReactNode;
  leading?: ReactNode;
  meta?: ReactNode;
  onClose?: () => void;
  onDragEnd?: (event: ReactDragEvent<HTMLButtonElement>) => void;
  onDragLeave?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragStart?: (event: ReactDragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onStartEdit?: () => void;
  onSelect: () => void;
  title?: string;
}) {
  const tabClassName = [
    'wb-editor-target-tab',
    active ? 'wb-editor-target-tab--active' : '',
    draggable ? 'wb-editor-target-tab--draggable' : '',
    dropPosition ? `wb-editor-target-tab--drop-${dropPosition}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={tabClassName}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {onClose && closeLabel ? (
        <IconButton
          className="wb-editor-target-tab-close"
          label={closeLabel}
          title={closeLabel}
          onClick={onClose}
        >
          {closeIcon}
        </IconButton>
      ) : null}
      {editingControl ? (
        <div className="wb-editor-target-tab-button wb-editor-target-tab-button--editing">
          {leading ? <span className="wb-editor-target-tab-leading" aria-hidden="true">{leading}</span> : null}
          <span className="wb-editor-target-tab-main">
            {editingControl}
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="wb-editor-target-tab-button"
          aria-current={active ? 'page' : undefined}
          draggable={draggable}
          title={title}
          onClick={onSelect}
          onDoubleClick={onStartEdit}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
        >
          {leading ? <span className="wb-editor-target-tab-leading" aria-hidden="true">{leading}</span> : null}
          <span className="wb-editor-target-tab-main">
            <span className="wb-editor-target-tab-label">{label}</span>
            {meta ? <span className="wb-editor-target-tab-meta">{meta}</span> : null}
          </span>
        </button>
      )}
    </div>
  );
}

export function WorkbenchSidebarSplitHandle({
  label,
  onPointerDown,
  title = label,
}: {
  label: string;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      className="wb-sidebar-resize-handle"
      aria-label={label}
      title={title}
      onPointerDown={onPointerDown}
    />
  );
}

type WorkbenchResizeHandleProps = {
  label: string;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  placement: 'sidebar' | 'inspector';
  title?: string;
};

export function WorkbenchResizeHandle({
  label,
  onPointerDown,
  placement,
  title = label,
}: WorkbenchResizeHandleProps) {
  return (
    <button
      type="button"
      className={placement === 'sidebar' ? 'wb-sidebar-width-handle' : 'wb-inspector-width-handle'}
      aria-label={label}
      title={title}
      onPointerDown={onPointerDown}
    />
  );
}
