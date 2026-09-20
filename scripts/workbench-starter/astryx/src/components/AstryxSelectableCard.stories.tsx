import { AstryxBadge } from './AstryxBadge';
import { AstryxSelectableCard as AstryxSelectableCardComponent } from './AstryxSelectableCard';
import { AstryxText } from './AstryxText';
import { AstryxVStack } from './AstryxVStack';

type Args = Record<string, boolean | number | string>;

const PADDING = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;
const VARIANTS = [
  'default',
  'muted',
  'transparent',
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

const DEFAULT_PROPS = {
  label: 'Select design system',
  variant: 'default',
  padding: 5,
  width: '100%',
  height: '',
  defaultSelected: true,
  isDisabled: false,
  maxWidth: '360px',
} as const;

const meta = {
  title: 'Astryx/SelectableCard',
  component: AstryxSelectableCardComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    padding: { control: 'select', options: PADDING },
    width: { control: 'text' },
    height: { control: 'text' },
    defaultSelected: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    maxWidth: { control: 'text' },
  },
  authoring: {
    group: 'Content',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxText'],
        sourceFile: 'src/components/AstryxText.tsx',
      },
      {
        names: ['AstryxBadge'],
        sourceFile: 'src/components/AstryxBadge.tsx',
      },
      {
        names: ['AstryxVStack'],
        sourceFile: 'src/components/AstryxVStack.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxVStack gap="sm">\n<AstryxText as="h3" display="block" type="large">Astryx neutral</AstryxText>\n<AstryxText as="p" color="secondary" display="block" type="supporting">Theme-ready component wrapper.</AstryxText>\n<AstryxBadge label="Selected" variant="success" />\n</AstryxVStack>',
  },
};
export default meta;

export const AstryxSelectableCard = {
  name: 'AstryxSelectableCard',
  render: (args: Args) => (
    <AstryxSelectableCardComponent
      defaultSelected={asBoolean(args.defaultSelected)}
      height={asText(args.height, DEFAULT_PROPS.height)}
      isDisabled={asBoolean(args.isDisabled)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      maxWidth={asText(args.maxWidth, DEFAULT_PROPS.maxWidth)}
      padding={asNumberOption(args.padding, PADDING, DEFAULT_PROPS.padding)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxVStack gap="sm">
        <AstryxText as="h3" display="block" type="large">
          Astryx neutral
        </AstryxText>
        <AstryxText as="p" color="secondary" display="block" type="supporting">
          Theme-ready component wrapper.
        </AstryxText>
        <AstryxBadge label="Selected" variant="success" />
      </AstryxVStack>
    </AstryxSelectableCardComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumberOption<T extends number>(value: unknown, options: readonly T[], fallback: T): T {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return options.includes(numericValue as T) ? (numericValue as T) : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
