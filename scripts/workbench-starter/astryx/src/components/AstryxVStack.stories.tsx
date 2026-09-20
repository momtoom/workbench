import { AstryxButton } from './AstryxButton';
import { AstryxText } from './AstryxText';
import { AstryxVStack as AstryxVStackComponent } from './AstryxVStack';

type Args = Record<string, boolean | number | string>;

const GAPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;
const ALIGNS = ['start', 'center', 'end', 'stretch'] as const;
const JUSTIFIES = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;
const WRAPS = ['nowrap', 'wrap', 'wrap-reverse'] as const;
const ELEMENTS = ['div', 'main', 'section', 'article', 'header', 'footer', 'nav'] as const;

const DEFAULT_PROPS = {
  as: 'div',
  align: 'stretch',
  justify: 'start',
  wrap: 'nowrap',
  gap: 'md',
  padding: 'none',
} as const;

const meta = {
  title: 'Astryx/VStack',
  component: AstryxVStackComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    as: { control: 'select', options: ELEMENTS },
    align: { control: 'select', options: ALIGNS },
    justify: { control: 'select', options: JUSTIFIES },
    wrap: { control: 'select', options: WRAPS },
    gap: { control: 'select', options: GAPS },
    padding: { control: 'select', options: GAPS },
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
      {
        names: ['AstryxText'],
        sourceFile: 'src/components/AstryxText.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxText as="p" display="block">Vertical stack content</AstryxText>\n<AstryxButton label="Continue" variant="primary" />',
  },
};
export default meta;

export const AstryxVStack = {
  name: 'AstryxVStack',
  render: (args: Args) => (
    <AstryxVStackComponent
      align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
      as={asOption(args.as, ELEMENTS, DEFAULT_PROPS.as)}
      gap={asNumberOption(args.gap, GAPS, DEFAULT_PROPS.gap)}
      justify={asOption(args.justify, JUSTIFIES, DEFAULT_PROPS.justify)}
      padding={asNumberOption(args.padding, GAPS, DEFAULT_PROPS.padding)}
      wrap={asOption(args.wrap, WRAPS, DEFAULT_PROPS.wrap)}
    >
      <AstryxText as="p" display="block">
        Vertical stack content
      </AstryxText>
      <AstryxButton label="Continue" variant="primary" />
    </AstryxVStackComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asNumberOption<T extends number | string>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'number' || typeof value === 'string') && options.includes(value as T) ? (value as T) : fallback;
}
