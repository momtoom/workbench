import { AstryxHeading } from './AstryxHeading';
import { AstryxSection as AstryxSectionComponent } from './AstryxSection';
import { AstryxStack } from './AstryxStack';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | number | string>;

const VARIANTS = ['section', 'transparent', 'muted'] as const;
const PADDING = ['inherit', 'none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;

const DEFAULT_PROPS = {
  variant: 'section',
  padding: 'md',
  width: '100%',
  height: '',
  bleed: false,
  dividerBottom: false,
  dividerEnd: false,
  dividerStart: false,
  dividerTop: false,
  maxWidth: '',
  minHeight: '',
  paddingBlock: 'inherit',
} as const;

const meta = {
  title: 'Astryx/Section',
  component: AstryxSectionComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    padding: { control: 'select', options: PADDING },
    width: { control: 'text' },
    height: { control: 'text' },
    bleed: { control: 'boolean' },
    dividerBottom: { control: 'boolean' },
    dividerEnd: { control: 'boolean' },
    dividerStart: { control: 'boolean' },
    dividerTop: { control: 'boolean' },
    maxWidth: { control: 'text' },
    minHeight: { control: 'text' },
    paddingBlock: { control: 'select', options: PADDING },
  },
  authoring: {
    group: 'Layout',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxHeading'],
        sourceFile: 'src/components/AstryxHeading.tsx',
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
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxStack gap="sm">\n  <AstryxHeading level={3}>Section title</AstryxHeading>\n  <AstryxText as="p" color="secondary" display="block">Use sections for themed page regions.</AstryxText>\n</AstryxStack>',
  },
};
export default meta;

export const AstryxSection = {
  name: 'AstryxSection',
  render: (args: Args) => (
    <AstryxSectionComponent
      dividerBottom={asBoolean(args.dividerBottom)}
      dividerEnd={asBoolean(args.dividerEnd)}
      dividerStart={asBoolean(args.dividerStart)}
      dividerTop={asBoolean(args.dividerTop)}
      bleed={asBoolean(args.bleed)}
      height={asText(args.height)}
      maxWidth={asText(args.maxWidth)}
      minHeight={asText(args.minHeight)}
      padding={asNumberOption(args.padding, PADDING, DEFAULT_PROPS.padding)}
      paddingBlock={asNumberOption(args.paddingBlock, PADDING, DEFAULT_PROPS.paddingBlock)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxStack gap="sm">
        <AstryxHeading level={3}>Section title</AstryxHeading>
        <AstryxText as="p" color="secondary" display="block">
          Use sections for themed page regions.
        </AstryxText>
      </AstryxStack>
    </AstryxSectionComponent>
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
