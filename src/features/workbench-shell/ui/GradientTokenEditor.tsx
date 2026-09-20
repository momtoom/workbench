import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent as ReactDragEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton, SelectControl } from '@shared/ui/primitives';
import type { GradientStop, GradientType, GradientValue, TokenRegistry } from '@domain/design-system/tokens/types';
import {
  DEFAULT_GRADIENT_MESH_BACKGROUND,
  gradientToCss,
  resolveStopColor,
} from '@domain/design-system/tokens/gradient';
import { GRADIENT_TYPES, formatGradientType } from '@domain/design-system/tokens/metadata';
import { closeAllTokenPickers } from './TokenPicker';
import { NumberScrubHandle } from './NumberScrubHandle';
import type { Notice } from './useTokenEditorHistory';
import {
  clamp,
  gradientStopPoint,
  gradientStopPositionFromPoint,
  newGradientStop,
  normalizeAngle,
  pointFromPointer,
  type GradientPreviewMetrics,
} from './gradientEditorGeometry';
import { GradientBackgroundRow, GradientStopRow } from './GradientStopRows';

export function GradientModal({
  registry,
  value,
  onChange,
  onClose,
}: {
  registry: TokenRegistry;
  value: GradientValue;
  onChange: (value: GradientValue) => void;
  onClose: () => void;
  setNotice: (notice: Notice) => void;
}) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [activeStopId, setActiveStopId] = useState(value.stops[0]?.id ?? '');
  const [previewMetrics, setPreviewMetrics] = useState<GradientPreviewMetrics>({ width: 1, height: 1 });
  const sortedStops = useMemo(() => [...value.stops].sort((a, b) => a.position - b.position), [value.stops]);
  const activeStop = value.stops.find((stop) => stop.id === activeStopId) ?? sortedStops[0] ?? null;
  const meshBlur = clamp(value.meshBlur ?? 42, 0, 80);

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return;
    const observedElement = element;

    function updateMetrics() {
      const rect = observedElement.getBoundingClientRect();
      setPreviewMetrics({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
    }

    updateMetrics();
    const observer = new ResizeObserver(updateMetrics);
    observer.observe(observedElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeStop && sortedStops[0]) setActiveStopId(sortedStops[0].id);
  }, [activeStop, sortedStops]);

  function updateStop(stopId: string, updater: (stop: GradientStop) => GradientStop) {
    onChange({ ...value, stops: value.stops.map((stop) => (stop.id === stopId ? updater(stop) : stop)) });
  }

  function updateStopFromPoint(stopId: string, point: { x: number; y: number }) {
    updateStop(stopId, (stop) => {
      if (value.type === 'mesh') {
        return { ...stop, x: point.x, y: point.y, position: clamp(Math.round((point.x + point.y) / 2), 0, 100) };
      }
      return { ...stop, position: gradientStopPositionFromPoint(value.type, point, value.angle, previewMetrics) };
    });
  }

  function addStopFromPoint(point: { x: number; y: number }) {
    const next = newGradientStop(point, value.type, value.angle, previewMetrics);
    closeAllTokenPickers();
    setActiveStopId(next.id);
    onChange({ ...value, stops: [...value.stops, next] });
  }

  function startStopDrag(event: ReactPointerEvent<HTMLButtonElement>, stop: GradientStop) {
    event.preventDefault();
    event.stopPropagation();
    setActiveStopId(stop.id);
    updateStopFromPoint(stop.id, pointFromPointer(event, previewRef.current));

    function move(pointerEvent: PointerEvent) {
      updateStopFromPoint(stop.id, pointFromPointer(pointerEvent, previewRef.current));
    }

    function stopDrag() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stopDrag);
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stopDrag);
  }

  function stopModalPointer(event: ReactPointerEvent | ReactMouseEvent | ReactDragEvent) {
    event.stopPropagation();
  }

  function preventModalDrag(event: ReactDragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  return createPortal(
    <div
      className="wb-modal-backdrop"
      draggable={false}
      onDragStartCapture={preventModalDrag}
      onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div
        className="wb-gradient-modal"
        draggable={false}
        onDragStartCapture={preventModalDrag}
        onDragOverCapture={preventModalDrag}
        onMouseDown={stopModalPointer}
        onPointerDown={stopModalPointer}
      >
        <div className="wb-modal-header">
          <strong>Gradient editor</strong>
          <IconButton label="Close gradient editor" onClick={onClose}>
            <X size={14} />
          </IconButton>
        </div>
        <div
          ref={previewRef}
          className={`wb-gradient-preview wb-gradient-preview--${value.type}`}
          style={{ background: gradientToCss(value, registry), '--angle': `${value.angle}deg` } as CSSProperties}
          onPointerDown={(event) => {
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            event.stopPropagation();
            addStopFromPoint(pointFromPointer(event, previewRef.current));
          }}
        >
          {sortedStops.map((stop) => {
            const point = gradientStopPoint(value.type, stop, value.angle, previewMetrics);
            const handlePoint = { x: clamp(point.x, 0, 100), y: clamp(point.y, 0, 100) };
            return (
              <button
                key={stop.id}
                type="button"
                className={stop.id === activeStop?.id ? 'wb-gradient-stop-handle wb-gradient-stop-handle--active' : 'wb-gradient-stop-handle'}
                style={{ left: `${handlePoint.x}%`, top: `${handlePoint.y}%`, background: resolveStopColor(stop, registry) }}
                aria-label={`Gradient stop ${Math.round(stop.position)}%`}
                onPointerDown={(event) => startStopDrag(event, stop)}
              />
            );
          })}
        </div>
        <div className="wb-gradient-controls">
          <SelectControl<GradientType>
            aria-label="Gradient type"
            value={value.type}
            onValueChange={(type) => onChange({ ...value, type })}
          >
            {GRADIENT_TYPES.map((type) => <option key={type} value={type}>{formatGradientType(type)}</option>)}
          </SelectControl>
          <div className={value.type === 'mesh' || value.type === 'radial' ? 'wb-gradient-angle-control wb-gradient-angle-control--hidden' : 'wb-gradient-angle-control'}>
            <div className="wb-gradient-angle-fields">
              <input
                type="range"
                min={0}
                max={359}
                value={normalizeAngle(value.angle)}
                draggable={false}
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onDragStart={preventModalDrag}
                onChange={(event) => onChange({ ...value, angle: Number(event.target.value) })}
              />
              <div className="wb-gradient-inline-field wb-gradient-inline-field--angle">
                <NumberScrubHandle label="Adjust gradient angle" min={0} max={359} value={normalizeAngle(value.angle)} onChange={(angle) => onChange({ ...value, angle: normalizeAngle(angle) })}>Angle</NumberScrubHandle>
                <input
                  aria-label="Gradient angle"
                  type="number"
                  min={0}
                  max={359}
                  value={normalizeAngle(value.angle)}
                  onChange={(event) => onChange({ ...value, angle: normalizeAngle(Number(event.target.value)) })}
                />
                <em>deg</em>
              </div>
            </div>
          </div>
          {value.type === 'mesh' ? (
            <div className="wb-gradient-mesh-controls">
              <div className="wb-gradient-blur-control">
                <NumberScrubHandle label="Adjust mesh blur" min={0} max={80} value={Math.round(meshBlur)} onChange={(next) => onChange({ ...value, meshBlur: next })}>Blur</NumberScrubHandle>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={meshBlur}
                  draggable={false}
                  onPointerDown={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  onDragStart={preventModalDrag}
                  onChange={(event) => onChange({ ...value, meshBlur: Number(event.target.value) })}
                />
                <input
                  aria-label="Mesh blur"
                  type="number"
                  min={0}
                  max={80}
                  value={Math.round(meshBlur)}
                  onChange={(event) => onChange({ ...value, meshBlur: clamp(Number(event.target.value), 0, 80) })}
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="wb-gradient-stop-list">
          {value.type === 'mesh' ? (
            <GradientBackgroundRow
              registry={registry}
              color={value.meshBackgroundColor ?? { kind: 'raw', value: value.meshBackground ?? DEFAULT_GRADIENT_MESH_BACKGROUND }}
              enabled={value.meshBackgroundEnabled !== false}
              opacity={value.meshBackgroundOpacity ?? 100}
              update={(next) => onChange({ ...value, ...next })}
            />
          ) : null}
          {sortedStops.map((stop) => (
            <GradientStopRow
              key={stop.id}
              registry={registry}
              stop={stop}
              angle={value.angle}
              type={value.type}
              active={stop.id === activeStop?.id}
              canDelete={value.stops.length > 2}
              update={(updated) => {
                setActiveStopId(stop.id);
                onChange({ ...value, stops: value.stops.map((candidate) => candidate.id === stop.id ? updated : candidate) });
              }}
              remove={() => onChange({ ...value, stops: value.stops.filter((candidate) => candidate.id !== stop.id) })}
            />
          ))}
        </div>
      </div>
    </div>
  , document.body);
}
