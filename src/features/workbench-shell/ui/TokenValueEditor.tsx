import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { DesignToken, ResolvedTokenValue, TokenCollection, TokenRegistry, TokenValue } from '@domain/design-system/tokens/types';
import { isGradientValue } from '@domain/design-system/tokens/types';
import { gradientPreviewCss, isCssGradientLiteral } from '@domain/design-system/tokens/gradient';
import { setTokenValue } from '@domain/design-system/tokens/operations';
import { createHistoryChangeSummary } from '@domain/history/historyChangeSummary';
import { resolveTokenValue } from '@domain/design-system/tokens/resolver';
import type { Notice, TokenCommit } from './useTokenEditorHistory';
import { useTokenValueDraft } from './useTokenValueDraft';
import { GradientModal } from './GradientTokenEditor';
import { InlineEditFrame } from './InlineEditControls';
import { formatGradientType, TokenPreview } from './TokenVisuals';
import { TokenValueChip } from './TokenValuePrimitives';
import { TokenValueEditControls } from './TokenValueEditControls';
import { TokenInlineValueEditor } from './TokenInlineValueEditor';
import { formatTokenCellLabel } from './tokenValueLabels';

type EditingCell = { tokenId: string; modeId: string } | null;

/**
 * Renders a token value for the history work log. A reference reads as the
 * token it points at rather than its resolved value, because that is what the
 * edit actually set.
 */
function formatTokenValueForHistorySummary(value: TokenValue | undefined): string | null {
  if (!value) return null;
  if (value.kind === 'ref') return `${value.collectionId}/${value.tokenId}`;
  if (value.kind === 'formula') return value.unit ? `${value.expression}${value.unit}` : value.expression;
  return typeof value.value === 'object' ? JSON.stringify(value.value) : String(value.value);
}

const TOKEN_VALUE_POPOVER_WIDTH = 420;
const TOKEN_VALUE_POPOVER_GAP = 8;
const TOKEN_VALUE_POPOVER_ESTIMATED_HEIGHT = 52;

export function TokenValueCells({
  collection,
  commit,
  editingCell,
  modes,
  registry,
  setEditingCell,
  setNotice,
  token,
}: {
  collection: TokenCollection;
  commit: TokenCommit;
  editingCell: EditingCell;
  modes: TokenCollection['modes'];
  registry: TokenRegistry;
  setEditingCell: (cell: EditingCell) => void;
  setNotice: (notice: Notice) => void;
  token: DesignToken;
}) {
  return (
    <>
      {modes.map((mode, index) => (
        <td
          key={mode.id}
          className={editingCell?.tokenId === token.id && editingCell.modeId === mode.id ? 'wb-token-value-cell--active' : undefined}
        >
          <TokenValueCell
            collection={collection}
            copyFromValue={index > 0 ? token.values[modes[0]!.id] : undefined}
            isEditing={editingCell?.tokenId === token.id && editingCell.modeId === mode.id}
            modeId={mode.id}
            registry={registry}
            setNotice={setNotice}
            token={token}
            setEditing={(editing) => setEditingCell(editing ? { tokenId: token.id, modeId: mode.id } : null)}
            updateValue={(value) => {
              const result = setTokenValue(registry, collection.id, token.id, mode.id, value);
              commit(
                result.registry,
                {
                  label: 'Change token value',
                  kind: 'patch',
                  intent: 'write',
                  target: { kind: 'token-value', collectionId: collection.id, tokenId: token.id, modeId: mode.id, field: 'value' },
                  identityEffect: 'preserve',
                  mergeKey: `token:${token.id}:mode:${mode.id}:value`,
                  changes: [
                    createHistoryChangeSummary(
                      modes.length > 1 ? `${token.name} (${mode.name})` : token.name,
                      formatTokenValueForHistorySummary(token.values[mode.id]),
                      formatTokenValueForHistorySummary(value),
                    ),
                  ],
                },
                result.error ? { tone: 'error', message: result.error } : null,
              );
            }}
          />
        </td>
      ))}
    </>
  );
}

function TokenValueCell({
  collection,
  copyFromValue,
  isEditing,
  modeId,
  registry,
  setNotice,
  token,
  setEditing,
  updateValue,
}: {
  collection: TokenCollection;
  copyFromValue?: TokenValue;
  isEditing: boolean;
  modeId: string;
  registry: TokenRegistry;
  setNotice: (notice: Notice) => void;
  token: DesignToken;
  setEditing: (editing: boolean) => void;
  updateValue: (value: TokenValue) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const editPopoverRef = useRef<HTMLDivElement>(null);
  const persistedValue = token.values[modeId];
  const resolved = resolveTokenValue(token, collection, registry, modeId);
  const {
    applyDraft,
    cancelDraft,
    changeKind,
    closeGradientEditor,
    gradientModalValue,
    gradientOpen,
    kind,
    openValueEditor,
    setGradientOpen,
    updateDraft,
    value,
  } = useTokenValueDraft({
    isEditing,
    modeId,
    persistedValue,
    setEditing,
    tokenType: token.type,
    updateValue,
  });
  const popoverLayout = useTokenValuePopoverLayout(isEditing, rootRef);
  const gradientCss = token.type === 'gradient' ? gradientPreviewCss(resolved, registry) : null;
  const gradientLabel = token.type === 'gradient' ? getGradientCellLabel(resolved) : undefined;

  const content = (
    <>
      <TokenValueChip
        onDoubleClick={openValueEditor}
        preview={<TokenPreview token={token} resolved={resolved} registry={registry} />}
        label={formatTokenCellLabel(value, resolved, registry)}
        gradientCss={gradientCss ?? undefined}
        gradientLabel={gradientLabel}
      />

      {gradientOpen && gradientModalValue?.kind === 'raw' && isGradientValue(gradientModalValue.value) ? (
        <GradientModal
          registry={registry}
          value={gradientModalValue.value}
          onChange={(next) => updateDraft({ kind: 'raw', value: next })}
          onClose={closeGradientEditor}
          setNotice={setNotice}
        />
      ) : null}
    </>
  );

  return (
    <div className="wb-value-cell" ref={rootRef}>
      {content}
      {isEditing && popoverLayout ? createPortal(
        <InlineEditFrame
          className="wb-token-value-popover"
          frameRef={editPopoverRef}
          onBlurOutside={cancelDraft}
          style={popoverLayout}
        >
          <TokenInlineValueEditor
            collection={collection}
            kind={kind}
            openGradient={() => setGradientOpen(true)}
            popoverAnchorRef={editPopoverRef}
            registry={registry}
            token={token}
            updateDraft={updateDraft}
            value={value}
          />
          <TokenValueEditControls
            copyFromValue={copyFromValue}
            kind={kind}
            onCancel={cancelDraft}
            onCommit={applyDraft}
            onCopyFromValue={() => copyFromValue ? updateDraft(copyFromValue) : undefined}
            onKindChange={changeKind}
            token={token}
            value={value}
          />
        </InlineEditFrame>,
        document.body,
      ) : null}
    </div>
  );
}

function getGradientCellLabel(value: ResolvedTokenValue): string | undefined {
  if (isGradientValue(value)) return formatGradientType(value.type);
  if (isCssGradientLiteral(value)) return 'Gradient';
  return undefined;
}

function useTokenValuePopoverLayout(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
): CSSProperties | null {
  const [layout, setLayout] = useState<CSSProperties | null>(null);
  const layoutFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setLayout(null);
      return;
    }

    function measureLayout() {
      layoutFrameRef.current = null;
      const anchor = anchorRef.current?.getBoundingClientRect();
      const nextLayout = anchor ? getTokenValuePopoverLayout(anchor) : null;
      setLayout((current) => (
        arePopoverLayoutsEqual(current, nextLayout) ? current : nextLayout
      ));
    }

    function scheduleLayout() {
      if (layoutFrameRef.current !== null) return;
      layoutFrameRef.current = window.requestAnimationFrame(measureLayout);
    }

    measureLayout();
    window.addEventListener('resize', scheduleLayout);
    window.addEventListener('scroll', scheduleLayout, true);
    return () => {
      if (layoutFrameRef.current !== null) {
        window.cancelAnimationFrame(layoutFrameRef.current);
        layoutFrameRef.current = null;
      }
      window.removeEventListener('resize', scheduleLayout);
      window.removeEventListener('scroll', scheduleLayout, true);
    };
  }, [anchorRef, open]);

  return layout;
}

function arePopoverLayoutsEqual(left: CSSProperties | null, right: CSSProperties | null): boolean {
  return left?.left === right?.left && left?.top === right?.top && left?.width === right?.width;
}

function getTokenValuePopoverLayout(anchor: DOMRect): CSSProperties {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(TOKEN_VALUE_POPOVER_WIDTH, Math.max(280, viewportWidth - TOKEN_VALUE_POPOVER_GAP * 2));
  const spaceBelow = viewportHeight - anchor.bottom - TOKEN_VALUE_POPOVER_GAP;
  const openAbove = spaceBelow < TOKEN_VALUE_POPOVER_ESTIMATED_HEIGHT && anchor.top > spaceBelow;
  const top = openAbove
    ? Math.max(TOKEN_VALUE_POPOVER_GAP, anchor.top - TOKEN_VALUE_POPOVER_ESTIMATED_HEIGHT - TOKEN_VALUE_POPOVER_GAP)
    : anchor.bottom + TOKEN_VALUE_POPOVER_GAP;
  const left = clamp(
    anchor.left,
    TOKEN_VALUE_POPOVER_GAP,
    Math.max(TOKEN_VALUE_POPOVER_GAP, viewportWidth - width - TOKEN_VALUE_POPOVER_GAP),
  );

  return { left, top, width };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}
