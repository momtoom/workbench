import { AstryxAspectRatio as AstryxAspectRatioComponent } from './AstryxAspectRatio';

type Args = Record<string, string>;

const PRESETS = ['1:1', '4:3', '16:9', '21:9'] as const;
const SHAPES = ['rectangle', 'ellipse'] as const;

const DEFAULT_PROPS = {
  label: '16:9 media',
  shape: 'rectangle',
  preset: '16:9',
} as const;

const meta = {
  title: 'Astryx/AspectRatio',
  component: AstryxAspectRatioComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    shape: { control: 'select', options: SHAPES },
    preset: { control: 'select', options: PRESETS },
  },
  authoring: {
    group: 'Layout',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxAspectRatio = {
  name: 'AstryxAspectRatio',
  render: (args: Args) => (
    <AstryxAspectRatioComponent
      label={asText(args.label, DEFAULT_PROPS.label)}
      preset={asOption(args.preset, PRESETS, DEFAULT_PROPS.preset)}
      shape={asOption(args.shape, SHAPES, DEFAULT_PROPS.shape)}
    />
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
