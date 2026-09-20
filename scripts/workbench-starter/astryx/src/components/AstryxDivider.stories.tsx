import { AstryxDivider as AstryxDividerComponent } from './AstryxDivider';

type Args = Record<string, boolean | string>;

const ORIENTATIONS = ['horizontal', 'vertical'] as const;
const VARIANTS = ['subtle', 'strong'] as const;

const DEFAULT_PROPS = {
  label: 'Section',
  variant: 'subtle',
  orientation: 'horizontal',
  isFullBleed: false,
} as const;

const meta = {
  title: 'Astryx/Divider',
  component: AstryxDividerComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    orientation: { control: 'select', options: ORIENTATIONS },
    isFullBleed: { control: 'boolean' },
  },
  authoring: {
    group: 'Layout',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxDivider = {
  name: 'AstryxDivider',
  render: (args: Args) => (
    <AstryxDividerComponent
      isFullBleed={asBoolean(args.isFullBleed)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      orientation={asOption(args.orientation, ORIENTATIONS, DEFAULT_PROPS.orientation)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
