import { useEffect, useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { IconButton } from '@shared/ui/primitives';
import type { GradientStop, GradientStopColor, GradientType, GradientValue, TokenRegistry } from '@domain/design-system/tokens/types';
import {
  DEFAULT_GRADIENT_FALLBACK_COLOR,
  DEFAULT_GRADIENT_MESH_BACKGROUND,
  resolveGradientColor,
  resolveStopColor,
} from '@domain/design-system/tokens/gradient';
import { ColorTokenPicker } from './TokenPicker';
import { InlineEditActions, InlineEditFrame } from './InlineEditControls';
import { NumberScrubHandle } from './NumberScrubHandle';
import { TokenValueChip, ValueKindSelect } from './TokenValuePrimitives';
import { EditableColorSwatch, formatGradientColorLabel, TokenSwatch } from './TokenVisuals';
import {
  clamp,
  gradientStopPoint,
} from './gradientEditorGeometry';

export function GradientBackgroundRow({
  color,
  enabled,
  opacity,
  registry,
  update,
}: {
  color: GradientStopColor;
  enabled: boolean;
  opacity: number;
  registry: TokenRegistry;
  update: (next: Pick<GradientValue, 'meshBackgroundColor' | 'meshBackgroundEnabled' | 'meshBackgroundOpacity'>) => void;
}) {
  const resolvedColor = resolveGradientColor(color, registry);
  const updateColor = (meshBackgroundColor: GradientStopColor) => update({ meshBackgroundColor, meshBackgroundEnabled: enabled, meshBackgroundOpacity: opacity });

  return (
    <div className={enabled ? 'wb-gradient-stop-row wb-gradient-bg-row wb-gradient-bg-row--active' : 'wb-gradient-stop-row wb-gradient-bg-row'}>
      <TokenSwatch color={enabled ? resolvedColor : 'transparent'} />
      <span className="wb-gradient-bg-label">BG</span>
      <GradientColorValueCell
        color={color}
        fallbackRawColor={DEFAULT_GRADIENT_MESH_BACKGROUND}
        rawInputLabel="Mesh background"
        registry={registry}
        swatchLabel="Mesh background color"
        onChange={updateColor}
      />
      <div className="wb-gradient-inline-field wb-gradient-inline-field--percent">
        <NumberScrubHandle label="Adjust mesh background opacity" min={0} max={100} value={Math.round(opacity)} onChange={(next) => update({ meshBackgroundColor: color, meshBackgroundEnabled: enabled, meshBackgroundOpacity: next })}>Opacity</NumberScrubHandle>
        <input aria-label="Mesh background opacity" type="number" min={0} max={100} value={Math.round(opacity)} onChange={(event) => update({ meshBackgroundColor: color, meshBackgroundEnabled: enabled, meshBackgroundOpacity: clamp(Number(event.target.value), 0, 100) })} />
        <em>%</em>
      </div>
      <IconButton
        label={enabled ? 'Hide mesh background' : 'Show mesh background'}
        title={enabled ? 'Hide mesh background' : 'Show mesh background'}
        className="wb-gradient-bg-toggle"
        onClick={() => update({ meshBackgroundColor: color, meshBackgroundEnabled: !enabled, meshBackgroundOpacity: opacity })}
      >
        {enabled ? <Eye size={13} /> : <EyeOff size={13} />}
      </IconButton>
    </div>
  );
}

export function GradientStopRow({
  active,
  canDelete,
  registry,
  remove,
  stop,
  angle,
  type,
  update,
}: {
  angle: number;
  active: boolean;
  canDelete: boolean;
  registry: TokenRegistry;
  remove: () => void;
  stop: GradientStop;
  type: GradientType;
  update: (stop: GradientStop) => void;
}) {
  const point = gradientStopPoint(type, stop, angle);

  return (
    <div className={[
      'wb-gradient-stop-row',
      type === 'mesh' ? 'wb-gradient-stop-row--mesh' : '',
      active ? 'wb-gradient-stop-row--active' : '',
    ].filter(Boolean).join(' ')}>
      <TokenSwatch color={resolveStopColor(stop, registry)} />
      <div className="wb-gradient-inline-field wb-gradient-inline-field--percent">
        <NumberScrubHandle label="Adjust stop position" min={0} max={100} value={Math.round(stop.position)} onChange={(position) => update({ ...stop, position })}>Pos</NumberScrubHandle>
        <input aria-label="Stop position" type="number" min={0} max={100} value={Math.round(stop.position)} onChange={(event) => update({ ...stop, position: clamp(Number(event.target.value), 0, 100) })} />
        <em>%</em>
      </div>
      {type === 'mesh' ? (
        <>
          <div className="wb-gradient-inline-field wb-gradient-inline-field--coordinate">
            <NumberScrubHandle label="Adjust stop X position" min={0} max={100} value={Math.round(point.x)} onChange={(x) => update({ ...stop, x })}>X</NumberScrubHandle>
            <input aria-label="Stop X position" type="number" min={0} max={100} value={Math.round(point.x)} onChange={(event) => update({ ...stop, x: clamp(Number(event.target.value), 0, 100) })} />
          </div>
          <div className="wb-gradient-inline-field wb-gradient-inline-field--coordinate">
            <NumberScrubHandle label="Adjust stop Y position" min={0} max={100} value={Math.round(point.y)} onChange={(y) => update({ ...stop, y })}>Y</NumberScrubHandle>
            <input aria-label="Stop Y position" type="number" min={0} max={100} value={Math.round(point.y)} onChange={(event) => update({ ...stop, y: clamp(Number(event.target.value), 0, 100) })} />
          </div>
        </>
      ) : null}
      <GradientColorValueCell
        color={stop.color}
        fallbackRawColor={DEFAULT_GRADIENT_FALLBACK_COLOR}
        rawInputLabel="Stop color"
        registry={registry}
        swatchLabel="Stop color"
        onChange={(color) => update({ ...stop, color })}
      />
      <div className="wb-gradient-inline-field wb-gradient-inline-field--percent">
        <NumberScrubHandle label="Adjust stop opacity" min={0} max={100} value={Math.round(stop.opacity)} onChange={(opacity) => update({ ...stop, opacity })}>Opacity</NumberScrubHandle>
        <input aria-label="Stop opacity" type="number" min={0} max={100} value={Math.round(stop.opacity)} onChange={(event) => update({ ...stop, opacity: clamp(Number(event.target.value), 0, 100) })} />
        <em>%</em>
      </div>
      <IconButton label="Delete stop" title="Delete stop" className="wb-gradient-delete-stop" disabled={!canDelete} onClick={remove}>
        <Trash2 size={13} />
      </IconButton>
    </div>
  );
}

function GradientColorValueCell({
  color,
  fallbackRawColor,
  onChange,
  rawInputLabel,
  registry,
  swatchLabel,
}: {
  color: GradientStopColor;
  fallbackRawColor: string;
  onChange: (color: GradientStopColor) => void;
  rawInputLabel: string;
  registry: TokenRegistry;
  swatchLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draftColor, setDraftColor] = useState<GradientStopColor>(color);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const resolvedColor = resolveGradientColor(color, registry);

  useEffect(() => {
    if (!editing) {
      setDraftColor(color);
      setRefPickerOpen(false);
    }
  }, [color, editing]);

  function commitDraft() {
    onChange(draftColor);
    setEditing(false);
  }

  function cancelDraft() {
    setDraftColor(color);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="wb-gradient-color-cell">
        <TokenValueChip
          label={formatGradientColorLabel(color, registry, resolvedColor)}
          onDoubleClick={() => {
            setDraftColor(color);
            setEditing(true);
          }}
          preview={<TokenSwatch color={resolvedColor} />}
        />
      </div>
    );
  }

  return (
    <InlineEditFrame className="wb-gradient-color-cell wb-value-cell--editing" onBlurOutside={cancelDraft}>
      <GradientColorReferenceEditor
        color={draftColor}
        fallbackRawColor={fallbackRawColor}
        rawInputLabel={rawInputLabel}
        refPickerOpen={refPickerOpen}
        registry={registry}
        swatchLabel={swatchLabel}
        onChange={setDraftColor}
        onRefPickerOpenChange={setRefPickerOpen}
      />
      <GradientColorKindSelect
        color={draftColor}
        refPickerOpen={refPickerOpen}
        registry={registry}
        onChange={setDraftColor}
        onRefPickerOpenChange={setRefPickerOpen}
      />
      <InlineEditActions onCancel={cancelDraft} onCommit={commitDraft} />
    </InlineEditFrame>
  );
}

function GradientColorKindSelect({
  color,
  onChange,
  onRefPickerOpenChange,
  refPickerOpen,
  registry,
}: {
  color: GradientStopColor;
  onChange: (color: GradientStopColor) => void;
  onRefPickerOpenChange: (open: boolean) => void;
  refPickerOpen: boolean;
  registry: TokenRegistry;
}) {
  return (
    <ValueKindSelect
      ariaLabel="Gradient color value kind"
      kind={refPickerOpen ? 'ref' : color.kind}
      onKindChange={(kind) => {
        if (kind === 'ref') {
          onRefPickerOpenChange(true);
          return;
        }
        onRefPickerOpenChange(false);
        onChange({ kind: 'raw', value: resolveGradientColor(color, registry) });
      }}
    />
  );
}

function GradientColorReferenceEditor({
  color,
  fallbackRawColor,
  onChange,
  onRefPickerOpenChange,
  rawInputLabel,
  refPickerOpen,
  registry,
  swatchLabel,
}: {
  color: GradientStopColor;
  fallbackRawColor: string;
  onChange: (color: GradientStopColor) => void;
  onRefPickerOpenChange: (open: boolean) => void;
  rawInputLabel: string;
  refPickerOpen: boolean;
  registry: TokenRegistry;
  swatchLabel: string;
}) {
  const resolvedColor = resolveGradientColor(color, registry);

  if (color.kind === 'raw' && refPickerOpen) {
    return (
      <ColorTokenPicker
        registry={registry}
        selected={null}
        autoOpen
        onSelect={(ref) => {
          onRefPickerOpenChange(false);
          onChange({ kind: 'ref', collectionId: ref.collectionId, tokenId: ref.tokenId });
        }}
        onClear={() => onRefPickerOpenChange(false)}
        onOpenChange={(isOpen) => {
          if (!isOpen) onRefPickerOpenChange(false);
        }}
      />
    );
  }

  if (color.kind === 'ref') {
    return (
      <ColorTokenPicker
        registry={registry}
        selected={{ collectionId: color.collectionId, tokenId: color.tokenId }}
        onSelect={(ref) => onChange({ kind: 'ref', collectionId: ref.collectionId, tokenId: ref.tokenId })}
        onClear={() => onChange({ kind: 'raw', value: resolveGradientColor(color, registry) || fallbackRawColor })}
      />
    );
  }

  return (
    <div className="wb-gradient-color-value">
      <EditableColorSwatch
        label={swatchLabel}
        value={isHexColor(resolvedColor) ? resolvedColor : fallbackRawColor}
        onChange={(next) => onChange({ kind: 'raw', value: next })}
      />
      <input
        aria-label={rawInputLabel}
        value={color.value}
        onChange={(event) => onChange({ kind: 'raw', value: event.target.value })}
      />
    </div>
  );
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}
