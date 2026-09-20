import { AstryxButton } from './AstryxButton';
import { AstryxCard as AstryxCardComponent } from './AstryxCard';
import { AstryxStack } from './AstryxStack';

type Args = Record<string, number | string>;

const VARIANTS = [
  'default',
  'transparent',
  'subtle',
  'muted',
  'blue',
  'cyan',
  'gray',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
] as const;
const PADDING = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;

const DEFAULT_PROPS = {
  title: 'Astryx card',
  description: 'A Workbench-owned wrapper around the Astryx Card primitive.',
  variant: 'default',
  padding: 'md',
  backgroundColor: '',
} as const;

const meta = {
  title: 'Astryx/Card',
  component: AstryxCardComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    padding: { control: 'select', options: PADDING },
    backgroundColor: { control: 'color' },
  },
  authoring: {
    group: 'Content',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxButton'],
        sourceFile: 'src/components/AstryxButton.tsx',
      },
      {
        names: ['AstryxStack'],
        sourceFile: 'src/components/AstryxStack.tsx',
      },
    ],
    jsxChildren:
      '<AstryxStack gap={3}>\n  <h2>Astryx card</h2>\n  <p>A Workbench-owned wrapper around the Astryx Card primitive.</p>\n  <AstryxButton label="Open" variant="primary" />\n</AstryxStack>',
    props: {
      variant: DEFAULT_PROPS.variant,
      padding: DEFAULT_PROPS.padding,
      backgroundColor: DEFAULT_PROPS.backgroundColor,
    },
  },
};
export default meta;

export const AstryxCard = {
  name: 'AstryxCard',
  render: (args: Args) => (
    <AstryxCardComponent
      backgroundColor={asText(args.backgroundColor) || undefined}
      padding={asNumberOption(args.padding, PADDING, DEFAULT_PROPS.padding)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    >
      <AstryxStack gap={3}>
        <h2>{asText(args.title, DEFAULT_PROPS.title)}</h2>
        <p>{asText(args.description, DEFAULT_PROPS.description)}</p>
        <AstryxButton label="Open" variant="primary" />
      </AstryxStack>
    </AstryxCardComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asNumberOption<T extends number | string>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'number' || typeof value === 'string') && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
