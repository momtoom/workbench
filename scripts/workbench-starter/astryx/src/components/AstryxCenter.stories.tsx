import { AstryxButton } from './AstryxButton';
import { AstryxCenter as AstryxCenterComponent } from './AstryxCenter';

type Args = Record<string, boolean | string>;

const AXES = ['both', 'horizontal', 'vertical'] as const;

const DEFAULT_PROPS = {
  width: '100%',
  height: '120px',
  axis: 'both',
  isInline: false,
} as const;

const meta = {
  title: 'Astryx/Center',
  component: AstryxCenterComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    width: { control: 'text' },
    height: { control: 'text' },
    axis: { control: 'select', options: AXES },
    isInline: { control: 'boolean' },
  },
  authoring: {
    group: 'Layout',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxButton'],
        sourceFile: 'src/components/AstryxButton.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxButton label="Centered action" variant="primary" />',
  },
};
export default meta;

export const AstryxCenter = {
  name: 'AstryxCenter',
  render: (args: Args) => (
    <AstryxCenterComponent
      axis={asOption(args.axis, AXES, DEFAULT_PROPS.axis)}
      height={asText(args.height, DEFAULT_PROPS.height)}
      isInline={asBoolean(args.isInline)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxButton label="Centered action" variant="primary" />
    </AstryxCenterComponent>
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
