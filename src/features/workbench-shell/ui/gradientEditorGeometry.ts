import type { GradientStop, GradientType } from '@domain/design-system/tokens/types';
import {
  DEFAULT_GRADIENT_NEW_STOP_COLOR,
  makeTokenId,
} from '@domain/design-system/tokens/gradient';

export type GradientPreviewMetrics = {
  width: number;
  height: number;
};

export function newGradientStop(
  point: { x: number; y: number } = { x: 50, y: 50 },
  type: GradientType = 'linear',
  angle = 90,
  metrics: GradientPreviewMetrics = { width: 1, height: 1 },
): GradientStop {
  const position = type === 'mesh' ? Math.round((point.x + point.y) / 2) : gradientStopPositionFromPoint(type, point, angle, metrics);
  return {
    id: makeTokenId('stop'),
    position,
    x: clamp(point.x, 0, 100),
    y: clamp(point.y, 0, 100),
    color: { kind: 'raw', value: DEFAULT_GRADIENT_NEW_STOP_COLOR },
    opacity: 100,
  };
}

export function pointFromPointer(pointerEvent: PointerEvent | { clientX: number; clientY: number }, element: HTMLElement | null): { x: number; y: number } {
  if (!element) return { x: 50, y: 50 };
  const rect = element.getBoundingClientRect();
  return {
    x: clamp(((pointerEvent.clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((pointerEvent.clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

export function gradientStopPositionFromPoint(
  type: GradientType,
  point: { x: number; y: number },
  angle: number,
  metrics: GradientPreviewMetrics = { width: 1, height: 1 },
): number {
  if (type === 'angular') {
    const dx = ((point.x - 50) / 100) * metrics.width;
    const dy = ((point.y - 50) / 100) * metrics.height;
    const visualAngle = normalizeAngle(Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90));
    return clamp(normalizeAngle(visualAngle - angle) / 3.6, 0, 100);
  }
  if (type === 'radial') {
    const center = gradientCenterPoint();
    const radius = gradientGuideRadius(metrics);
    const dx = ((point.x - center.x) / 100) * metrics.width;
    const dy = ((point.y - center.y) / 100) * metrics.height;
    return clamp(Math.round((Math.hypot(dx, dy) / radius) * 100), 0, 100);
  }
  if (type === 'diamond') {
    const center = gradientCenterPoint();
    const axis = gradientDirection(angle);
    const radius = gradientGuideRadius(metrics);
    const dx = ((point.x - center.x) / 100) * metrics.width;
    const dy = ((point.y - center.y) / 100) * metrics.height;
    const distance = dx * axis.x + dy * axis.y;
    return clamp(Math.round((Math.max(0, distance) / radius) * 100), 0, 100);
  }
  const axis = gradientAxis(angle, metrics);
  const dx = ((point.x - 50) / 100) * metrics.width;
  const dy = ((point.y - 50) / 100) * metrics.height;
  const distance = (dx * axis.x + dy * axis.y) / axis.extent;
  return clamp(Math.round(50 + distance * 50), 0, 100);
}

export function gradientStopPoint(
  type: GradientType,
  stop: GradientStop,
  angle: number,
  metrics: GradientPreviewMetrics = { width: 1, height: 1 },
): { x: number; y: number } {
  if (type === 'mesh') {
    return {
      x: clamp(stop.x ?? stop.position, 0, 100),
      y: clamp(stop.y ?? 50, 0, 100),
    };
  }
  if (type === 'angular') {
    const radians = (normalizeAngle(angle + (stop.position / 100) * 360) - 90) * (Math.PI / 180);
    return pointFromCenter(Math.cos(radians), Math.sin(radians), gradientGuideRadius(metrics), metrics);
  }
  if (type === 'radial') {
    const radius = (clamp(stop.position, 0, 100) / 100) * gradientGuideRadius(metrics);
    return pointFromCenter(1, 0, radius, metrics);
  }
  if (type === 'diamond') {
    const direction = gradientDirection(angle);
    const radius = (clamp(stop.position, 0, 100) / 100) * gradientGuideRadius(metrics);
    return pointFromCenter(direction.x, direction.y, radius, metrics);
  }
  const axis = gradientAxis(angle, metrics);
  const distance = ((clamp(stop.position, 0, 100) - 50) / 50) * axis.extent;
  return pointFromCenter(axis.x, axis.y, distance, metrics);
}

function gradientAxis(angle: number, metrics: GradientPreviewMetrics): { x: number; y: number; extent: number } {
  const direction = gradientDirection(angle);
  return {
    ...direction,
    extent: Math.max(1, Math.min(
      direction.x === 0 ? Infinity : metrics.width / 2 / Math.abs(direction.x),
      direction.y === 0 ? Infinity : metrics.height / 2 / Math.abs(direction.y),
    )),
  };
}

function gradientCenterPoint(): { x: number; y: number } {
  return { x: 50, y: 50 };
}

function gradientGuideRadius(metrics: GradientPreviewMetrics): number {
  return Math.min(metrics.width * 0.76, 240, metrics.height * 0.76) / 2;
}

function gradientDirection(angle: number): { x: number; y: number } {
  const radians = (normalizeAngle(angle) * Math.PI) / 180;
  return { x: Math.sin(radians), y: -Math.cos(radians) };
}

function pointFromCenter(x: number, y: number, radius: number, metrics: GradientPreviewMetrics): { x: number; y: number } {
  const center = gradientCenterPoint();
  return {
    x: center.x + (x * radius / metrics.width) * 100,
    y: center.y + (y * radius / metrics.height) * 100,
  };
}

export function normalizeAngle(value: number): number {
  const normalized = Number.isFinite(value) ? value % 360 : 0;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}
