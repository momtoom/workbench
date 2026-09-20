import { AstryxText as AstryxTextComponent } from './AstryxText';

type Args = Record<string, boolean | number | string>;

const TYPES = ['body', 'large', 'label', 'supporting', 'code', 'display-1', 'display-2', 'display-3', 'inherit'] as const;
const SIZES = ['4xs', '3xs', '2xs', 'xsm', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'] as const;
const COLORS = ['primary', 'secondary', 'disabled', 'placeholder', 'accent', 'inherit', 'inverted', 'static-light', 'static-dark'] as const;
const WEIGHTS = ['normal', 'medium', 'semibold', 'bold'] as const;
const DISPLAYS = ['inline', 'block'] as const;
const ELEMENTS = ['span', 'p', 'div', 'label', 'h1', 'h2', 'h3'] as const;
const WRAPS = ['wrap', 'nowrap', 'balance', 'pretty'] as const;
const JUSTIFIES = ['start', 'center', 'end'] as const;
const LINE_HEIGHTS = ['inherit', 'tight', 'snug', 'normal', 'relaxed', 'loose'] as const;
const WORD_BREAKS = ['normal', 'break-all', 'keep-all', 'break-word'] as const;

const DEFAULT_PROPS = {
  children: 'Theme-aware text from Astryx.',
  type: 'body',
  as: 'p',
  weight: 'normal',
  justify: 'start',
  wrap: 'wrap',
  size: 'base',
  color: 'inherit',
  display: 'block',
  hasCapsize: false,
  hasTabularNumbers: false,
  lineHeight: 'inherit',
  wordBreak: 'normal',
  maxLines: 0,
} as const;

const meta = {
  title: 'Astryx/Text',
  component: AstryxTextComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
    type: { control: 'select', options: TYPES },
    as: { control: 'select', options: ELEMENTS },
    weight: { control: 'select', options: WEIGHTS },
    justify: { control: 'select', options: JUSTIFIES },
    wrap: { control: 'select', options: WRAPS },
    size: { control: 'select', options: SIZES },
    color: { control: 'select', options: COLORS },
    display: { control: 'select', options: DISPLAYS },
    hasCapsize: { control: 'boolean' },
    hasTabularNumbers: { control: 'boolean' },
    lineHeight: { control: 'select', options: LINE_HEIGHTS },
    wordBreak: { control: 'select', options: WORD_BREAKS },
    maxLines: { control: 'number' },
  },
  authoring: {
    group: 'Typography',
  },
  sourceInsert: {
    jsxChildren: DEFAULT_PROPS.children,
    props: {
      type: DEFAULT_PROPS.type,
      as: DEFAULT_PROPS.as,
      weight: DEFAULT_PROPS.weight,
      justify: DEFAULT_PROPS.justify,
      wrap: DEFAULT_PROPS.wrap,
      size: DEFAULT_PROPS.size,
      color: DEFAULT_PROPS.color,
      display: DEFAULT_PROPS.display,
      hasCapsize: DEFAULT_PROPS.hasCapsize,
      hasTabularNumbers: DEFAULT_PROPS.hasTabularNumbers,
      lineHeight: DEFAULT_PROPS.lineHeight,
      wordBreak: DEFAULT_PROPS.wordBreak,
      maxLines: DEFAULT_PROPS.maxLines,
    },
  },
};
export default meta;

export const AstryxText = {
  name: 'AstryxText',
  render: (args: Args) => (
    <AstryxTextComponent
      as={asOption(args.as, ELEMENTS, DEFAULT_PROPS.as)}
      color={asOption(args.color, COLORS, DEFAULT_PROPS.color)}
      display={asOption(args.display, DISPLAYS, DEFAULT_PROPS.display)}
      hasCapsize={asOptionalBoolean(args.hasCapsize)}
      hasTabularNumbers={asBoolean(args.hasTabularNumbers)}
      justify={asOption(args.justify, JUSTIFIES, DEFAULT_PROPS.justify)}
      lineHeight={asOption(args.lineHeight, LINE_HEIGHTS, DEFAULT_PROPS.lineHeight)}
      wordBreak={asOption(args.wordBreak, WORD_BREAKS, DEFAULT_PROPS.wordBreak)}
      maxLines={asNumber(args.maxLines, DEFAULT_PROPS.maxLines)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      type={asOption(args.type, TYPES, DEFAULT_PROPS.type)}
      weight={asOption(args.weight, WEIGHTS, DEFAULT_PROPS.weight)}
      wrap={asOption(args.wrap, WRAPS, DEFAULT_PROPS.wrap)}
    >
      {asText(args.children, DEFAULT_PROPS.children)}
    </AstryxTextComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
