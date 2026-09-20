import { AstryxGradient as AstryxGradientComponent } from './AstryxGradient';
import type { AstryxGradientBlendMode, AstryxGradientEasing, AstryxGradientKind } from './AstryxGradient';

type Args = Record<string, number | string>;

const EASINGS = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'smoothstep', 'sine'] as const satisfies readonly AstryxGradientEasing[];
const KINDS = ['linear', 'radial', 'conic', 'repeating-linear', 'repeating-radial'] as const satisfies readonly AstryxGradientKind[];
const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
  'plus-darker',
  'plus-lighter',
] as const satisfies readonly AstryxGradientBlendMode[];

const DEFAULT_PROPS = {
  kind: 'linear',
  backdropBlur: 0,
  blendMode: 'normal',
  easing: 'ease-in-out',
  endColor: 'rgba(253, 238, 140, 0.2)',
  endX: 100,
  endY: 100,
  fadeEnd: 100,
  fadeStart: 65,
  gradientSize: '100% 100%',
  opacity: 1,
  repeatSize: 18,
  rotation: 0,
  startColor: 'rgba(34, 91, 255, 0.95)',
  startX: 0,
  startY: 0,
} as const;

const meta = {
  title: 'Astryx/Gradient',
  component: AstryxGradientComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    kind: { control: 'select', options: KINDS },
    backdropBlur: { control: 'number' },
    blendMode: { control: 'select', options: BLEND_MODES },
    easing: { control: 'select', options: EASINGS },
    endColor: { control: 'color', tokenTypes: ['color'] },
    endX: { control: 'number' },
    endY: { control: 'number' },
    fadeEnd: { control: 'number' },
    fadeStart: { control: 'number' },
    gradientSize: { control: 'text' },
    opacity: { control: 'number' },
    repeatSize: { control: 'number' },
    rotation: { control: 'number' },
    startColor: { control: 'color', tokenTypes: ['color'] },
    startX: { control: 'number' },
    startY: { control: 'number' },
  },
  authoring: {
    group: 'Layout',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxGradient = {
  name: 'AstryxGradient',
  render: (args: Args) => (
    <AstryxGradientComponent
      backdropBlur={asNumber(args.backdropBlur, DEFAULT_PROPS.backdropBlur)}
      blendMode={asOption(args.blendMode, BLEND_MODES, DEFAULT_PROPS.blendMode)}
      easing={asOption(args.easing, EASINGS, DEFAULT_PROPS.easing)}
      endColor={asText(args.endColor, DEFAULT_PROPS.endColor)}
      endX={asNumber(args.endX, DEFAULT_PROPS.endX)}
      endY={asNumber(args.endY, DEFAULT_PROPS.endY)}
      fadeEnd={asNumber(args.fadeEnd, DEFAULT_PROPS.fadeEnd)}
      fadeStart={asNumber(args.fadeStart, DEFAULT_PROPS.fadeStart)}
      gradientSize={asText(args.gradientSize, DEFAULT_PROPS.gradientSize)}
      kind={asOption(args.kind, KINDS, DEFAULT_PROPS.kind)}
      opacity={asNumber(args.opacity, DEFAULT_PROPS.opacity)}
      repeatSize={asNumber(args.repeatSize, DEFAULT_PROPS.repeatSize)}
      rotation={asNumber(args.rotation, DEFAULT_PROPS.rotation)}
      startColor={asText(args.startColor, DEFAULT_PROPS.startColor)}
      startX={asNumber(args.startX, DEFAULT_PROPS.startX)}
      startY={asNumber(args.startY, DEFAULT_PROPS.startY)}
    />
  ),
};

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}
