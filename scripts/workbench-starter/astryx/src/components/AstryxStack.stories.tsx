import { AstryxButton } from './AstryxButton';
import { AstryxStack as AstryxStackComponent } from './AstryxStack';

type Args = Record<string, boolean | number | string>;

const DIRECTIONS = ['vertical', 'horizontal'] as const;
const GAPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;
const ALIGNS = ['start', 'center', 'end', 'stretch'] as const;
const JUSTIFIES = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;
const WRAPS = ['nowrap', 'wrap', 'wrap-reverse'] as const;
const ELEMENTS = ['div', 'main', 'section', 'article', 'aside', 'header', 'footer', 'nav'] as const;
const PADDING = GAPS;

const DEFAULT_PROPS = {
  as: 'div',
  direction: 'vertical',
  align: 'stretch',
  justify: 'start',
  wrap: 'nowrap',
  gap: 'md',
  padding: 'none',
} as const;

const meta = {
  title: 'Astryx/Stack',
  component: AstryxStackComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    as: { control: 'select', options: ELEMENTS },
    direction: { control: 'select', options: DIRECTIONS },
    align: { control: 'select', options: ALIGNS },
    justify: { control: 'select', options: JUSTIFIES },
    wrap: { control: 'select', options: WRAPS },
    gap: { control: 'select', options: GAPS },
    padding: { control: 'select', options: PADDING },
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
    jsxChildren: '<AstryxButton label="Cancel" />\n<AstryxButton label="Save" variant="primary" />',
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxStack = {
  name: 'AstryxStack',
  render: (args: Args) => (
    <AstryxStackComponent
      align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
      as={asOption(args.as, ELEMENTS, DEFAULT_PROPS.as)}
      direction={asOption(args.direction, DIRECTIONS, DEFAULT_PROPS.direction)}
      gap={asNumberOption(args.gap, GAPS, DEFAULT_PROPS.gap)}
      justify={asOption(args.justify, JUSTIFIES, DEFAULT_PROPS.justify)}
      padding={asNumberOption(args.padding, PADDING, DEFAULT_PROPS.padding)}
      wrap={asOption(args.wrap, WRAPS, DEFAULT_PROPS.wrap)}
    >
      <AstryxButton label="Cancel" />
      <AstryxButton label="Save" variant="primary" />
    </AstryxStackComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asNumberOption<T extends number | string>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'number' || typeof value === 'string') && options.includes(value as T) ? (value as T) : fallback;
}
