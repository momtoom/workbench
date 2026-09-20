import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEventHandler,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  Ref,
  UIEventHandler,
} from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { IconButton } from '@shared/ui/primitives';
import { RowOverlayActions } from './RowOverlayActions';

export type WorkbenchSidebarDropPosition = 'before' | 'after';
type WorkbenchSidebarRowDropPosition = WorkbenchSidebarDropPosition | 'inside';
export type WorkbenchSidebarDensity = 'default' | 'compact';

export function WorkbenchSidebarSectionHeader({
  actionLabel,
  density = 'default',
  onAction,
  trailing,
  title,
}: {
  actionLabel?: string;
  density?: WorkbenchSidebarDensity;
  onAction?: () => void;
  trailing?: ReactNode;
  title: string;
}) {
  return (
    <div className={`wb-sidebar-section-head wb-sidebar-section-head--${density}`}>
      <span className="wb-sidebar-section-title">
        <p className="wb-kicker">{title}</p>
        {trailing ?? null}
      </span>
      {onAction && actionLabel ? (
        <IconButton label={actionLabel} title={actionLabel} onClick={onAction}>
          <Plus size={14} />
        </IconButton>
      ) : null}
    </div>
  );
}

export function WorkbenchSidebarRow({
  actions,
  actionsWidth,
  collapsePlaceholder,
  collapseState,
  collapseSlot = true,
  density = 'default',
  draggable,
  dropPosition,
  editingControl,
  indentLevel = 0,
  label,
  leading,
  meta,
  multiSelected,
  muted,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  onSelect,
  onToggleCollapse,
  rowId,
  selected,
  selectionGroupActive,
}: {
  actions?: ReactNode;
  actionsWidth?: number;
  collapsePlaceholder?: ReactNode;
  collapseState?: 'collapsed' | 'expanded' | 'none';
  collapseSlot?: boolean;
  density?: WorkbenchSidebarDensity;
  draggable?: boolean;
  dropPosition?: WorkbenchSidebarRowDropPosition | null;
  editingControl?: ReactNode;
  indentLevel?: number;
  label: ReactNode;
  leading?: ReactNode;
  meta?: ReactNode;
  multiSelected?: boolean;
  muted?: boolean;
  onDragEnd?: (event: ReactDragEvent<HTMLElement>) => void;
  onDragLeave?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragStart?: (event: ReactDragEvent<HTMLElement>) => void;
  onDrop?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
  onMouseEnter?: MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: MouseEventHandler<HTMLDivElement>;
  onSelect: (event: ReactMouseEvent<HTMLElement>) => void;
  onToggleCollapse?: () => void;
  rowId?: string;
  selected?: boolean;
  selectionGroupActive?: boolean;
}) {
  const className = [
    'wb-sidebar-row',
    selected ? 'wb-sidebar-row--selected' : '',
    selected && selectionGroupActive ? 'wb-sidebar-row--multi-primary' : '',
    multiSelected ? 'wb-sidebar-row--multi-selected' : '',
    muted ? 'wb-sidebar-row--muted' : '',
    editingControl ? 'wb-sidebar-row--editing' : '',
    `wb-sidebar-row--${density}`,
    actions ? 'wb-sidebar-row--has-actions' : '',
    draggable ? 'wb-sidebar-row--draggable' : '',
    dropPosition === 'before' ? 'wb-sidebar-row--drop-before' : '',
    dropPosition === 'after' ? 'wb-sidebar-row--drop-after' : '',
    dropPosition === 'inside' ? 'wb-sidebar-row--drop-inside' : '',
    collapseSlot ? '' : 'wb-sidebar-row--without-collapse',
  ].filter(Boolean).join(' ');
  const mainClassName = [
    'wb-sidebar-row-main',
    `wb-sidebar-row-main--${density}`,
    selected ? 'wb-sidebar-row-main--selected' : '',
    multiSelected ? 'wb-sidebar-row-main--multi-selected' : '',
    muted ? 'wb-sidebar-row-main--muted' : '',
    editingControl ? 'wb-sidebar-row-main--editing' : '',
  ].filter(Boolean).join(' ');
  const style = {
    ...(actionsWidth ? { '--wb-sidebar-row-actions-width': `${actionsWidth}px` } : null),
    '--wb-sidebar-row-indent-level': Math.max(0, indentLevel),
  } as CSSProperties;

  // Collapse is rendered as a sibling of the main button (NOT nested inside it).
  // Nested interactive elements inside <button> are invalid HTML and cause
  // inconsistent click delivery across browsers — previously the toggle only
  // fired when the row was already selected. Extracting it to a sibling makes
  // the collapse click reliable in all states.
  const renderCollapseSlot = () => {
    if (collapseSlot && collapseState && collapseState !== 'none') {
      return (
        <button
          type="button"
          className="wb-sidebar-row-collapse"
          aria-label={collapseState === 'collapsed' ? 'Expand layer' : 'Collapse layer'}
          aria-expanded={collapseState === 'expanded'}
          onClick={(event) => {
            event.stopPropagation();
            onToggleCollapse?.();
          }}
        >
          <ChevronRight size={12} aria-hidden="true" />
        </button>
      );
    }
    if (collapseSlot) {
      return (
        <span
          className={[
            'wb-sidebar-row-collapse',
            collapsePlaceholder ? 'wb-sidebar-row-collapse--placeholder' : 'wb-sidebar-row-collapse--empty',
          ].join(' ')}
          aria-hidden="true"
        >
          {collapsePlaceholder ?? null}
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={className}
      style={style}
      onClick={(event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest('button, a, input, select, textarea, [role="button"]')) return;
        onSelect(event);
      }}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {editingControl ? null : renderCollapseSlot()}
      <button
        type="button"
        className={mainClassName}
        aria-current={selected ? 'true' : undefined}
        data-wb-sidebar-row-id={rowId}
        draggable={draggable}
        onClick={onSelect}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onKeyDown={onKeyDown}
      >
        {editingControl ?? (
          <span className="wb-sidebar-row-content">
            <span className="wb-sidebar-row-label">
              {leading ? <span className="wb-sidebar-row-leading" aria-hidden="true">{leading}</span> : null}
              <span>{label}</span>
            </span>
            {meta !== undefined ? <small>{meta}</small> : null}
          </span>
        )}
      </button>
      {actions ? <RowOverlayActions className="wb-sidebar-item-actions">{actions}</RowOverlayActions> : null}
    </div>
  );
}

export function WorkbenchSidebarMeta({ children }: { children: ReactNode }) {
  return <span className="wb-sidebar-meta">{children}</span>;
}

export function WorkbenchSidebarRowList({
  ariaLabel,
  children,
  className,
  density = 'default',
  id,
  listRef,
  onDragLeave,
  onDragOver,
  onScroll,
}: {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  density?: WorkbenchSidebarDensity;
  id?: string;
  listRef?: Ref<HTMLDivElement>;
  onDragLeave?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: ReactDragEvent<HTMLDivElement>) => void;
  onScroll?: UIEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      id={id}
      ref={listRef}
      className={['wb-sidebar-row-list', `wb-sidebar-row-list--${density}`, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
}

export function WorkbenchPreviewStage({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      className="wb-preview-stage"
      onClick={(event) => {
        // Selection-aware preview children own their clicks. Clearing from
        // every bubbled descendant click makes inputs, menus, popovers, and
        // other runtime controls behave like a click on the empty canvas.
        // React portals can retarget the synthetic event to this logical
        // parent, so use the native composed path to retain the true origin.
        const nativeTarget = event.nativeEvent.composedPath?.()[0] ?? event.target;
        if (
          event.target !== event.currentTarget ||
          nativeTarget !== event.currentTarget
        ) return;
        onClick?.(event);
      }}
    >
      {children}
    </div>
  );
}

export function WorkbenchPreviewNode({
  actionLabel,
  appearance,
  copy,
  onSelect,
  selected,
  title,
}: {
  actionLabel: string;
  appearance?: {
    background?: string;
    borderRadius?: string;
    padding?: string;
  };
  copy: string;
  onSelect?: () => void;
  selected?: boolean;
  title: string;
}) {
  const style = appearance
    ? ({
        '--wb-preview-node-background': appearance.background,
        '--wb-preview-node-radius': appearance.borderRadius,
        '--wb-preview-node-padding': appearance.padding,
      } as CSSProperties)
    : undefined;

  return (
    <button
      type="button"
      className={selected ? 'wb-preview-node wb-preview-node--selected' : 'wb-preview-node'}
      style={style}
      onClick={onSelect}
    >
      <span className="wb-preview-node-title">{title}</span>
      <span className="wb-preview-node-copy">{copy}</span>
      <span className="wb-preview-node-action">{actionLabel}</span>
    </button>
  );
}
