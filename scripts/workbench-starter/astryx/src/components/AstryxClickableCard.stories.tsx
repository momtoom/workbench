import { AstryxButton } from './AstryxButton';
import { AstryxClickableCard as AstryxClickableCardComponent } from './AstryxClickableCard';
import { AstryxStack } from './AstryxStack';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | number | string>;

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
  label: 'Open Astryx workflow',
  href: '',
  variant: 'default',
  padding: 'md',
  width: '100%',
  height: '',
  isClickable: true,
  isDisabled: false,
  maxWidth: '420px',
  target: '_self',
} as const;

const meta = {
  title: 'Astryx/ClickableCard',
  component: AstryxClickableCardComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    href: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    padding: { control: 'select', options: PADDING },
    width: { control: 'text' },
    height: { control: 'text' },
    isClickable: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    maxWidth: { control: 'text' },
    target: { control: 'text' },
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
      {
        names: ['AstryxText'],
        sourceFile: 'src/components/AstryxText.tsx',
      },
    ],
    jsxChildren:
      '<AstryxStack gap={3}>\n  <AstryxText as="h3" display="block" type="large">Clickable Astryx card</AstryxText>\n  <AstryxText as="p" color="secondary" display="block" type="supporting">The card remains source-backed and supports nested controls.</AstryxText>\n  <AstryxButton label="Nested action" />\n</AstryxStack>',
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxClickableCard = {
  name: 'AstryxClickableCard',
  render: (args: Args) => (
    <AstryxClickableCardComponent
      height={asText(args.height)}
      href={asText(args.href)}
      isClickable={asBoolean(args.isClickable)}
      isDisabled={asBoolean(args.isDisabled)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      maxWidth={asText(args.maxWidth, DEFAULT_PROPS.maxWidth)}
      padding={asNumberOption(args.padding, PADDING, DEFAULT_PROPS.padding)}
      target={asText(args.target, DEFAULT_PROPS.target)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxStack gap={3}>
        <AstryxText as="h3" display="block" type="large">Clickable Astryx card</AstryxText>
        <AstryxText as="p" color="secondary" display="block" type="supporting">
          The card remains source-backed and supports nested controls.
        </AstryxText>
        <AstryxButton label="Nested action" />
      </AstryxStack>
    </AstryxClickableCardComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumberOption<T extends number | string>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'number' || typeof value === 'string') && options.includes(value as T) ? (value as T) : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
