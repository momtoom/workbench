import { AstryxSkeleton as AstryxSkeletonComponent } from './AstryxSkeleton';

type Args = Record<string, number | string>;

const RADII = ['none', 0, 1, 2, 3, 4, 'rounded'] as const;

const DEFAULT_PROPS = {
  radius: 3,
  width: '100%',
  height: 20,
  index: 0,
} as const;

const meta = {
  title: 'Astryx/Skeleton',
  component: AstryxSkeletonComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    radius: { control: 'select', options: RADII },
    width: { control: 'text' },
    height: { control: 'text' },
    index: { control: 'number' },
  },
  authoring: {
    group: 'Feedback',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxSkeleton = {
  name: 'AstryxSkeleton',
  render: (args: Args) => (
    <AstryxSkeletonComponent
      height={asDimension(args.height, DEFAULT_PROPS.height)}
      index={asNumber(args.index, DEFAULT_PROPS.index)}
      radius={asNumberOption(args.radius, RADII, DEFAULT_PROPS.radius)}
      width={asDimension(args.width, DEFAULT_PROPS.width)}
    />
  ),
};

function asDimension(value: unknown, fallback: number | string): number | string {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : trimmed;
  }
  return fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asNumberOption<T extends number | string>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'number' || typeof value === 'string') && options.includes(value as T) ? (value as T) : fallback;
}
