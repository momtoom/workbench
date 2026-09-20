import { AstryxHeading as AstryxHeadingComponent } from './AstryxHeading';

type Args = Record<string, number | string>;

const LEVELS = ['1', '2', '3', '4', '5', '6'] as const;
const TYPES = ['default', 'display-1', 'display-2', 'display-3'] as const;
const COLORS = ['primary', 'secondary', 'disabled', 'placeholder', 'accent', 'inherit', 'inverted', 'static-light', 'static-dark'] as const;
const DISPLAYS = ['inline', 'block'] as const;
const WRAPS = ['wrap', 'nowrap', 'balance', 'pretty'] as const;
const JUSTIFIES = ['start', 'center', 'end'] as const;

const DEFAULT_PROPS = {
  children: 'Source-backed Astryx heading',
  type: 'default',
  justify: 'start',
  wrap: 'balance',
  color: 'primary',
  display: 'block',
  level: '2',
  maxLines: 0,
} as const;

const meta = {
  title: 'Astryx/Heading',
  component: AstryxHeadingComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
    type: { control: 'select', options: TYPES },
    justify: { control: 'select', options: JUSTIFIES },
    wrap: { control: 'select', options: WRAPS },
    color: { control: 'select', options: COLORS },
    display: { control: 'select', options: DISPLAYS },
    level: { control: 'select', options: LEVELS },
    maxLines: { control: 'number' },
  },
  authoring: {
    group: 'Typography',
  },
  sourceInsert: {
    jsxChildren: DEFAULT_PROPS.children,
    props: {
      type: DEFAULT_PROPS.type,
      justify: DEFAULT_PROPS.justify,
      wrap: DEFAULT_PROPS.wrap,
      color: DEFAULT_PROPS.color,
      display: DEFAULT_PROPS.display,
      level: DEFAULT_PROPS.level,
      maxLines: DEFAULT_PROPS.maxLines,
    },
  },
};
export default meta;

export const AstryxHeading = {
  name: 'AstryxHeading',
  render: (args: Args) => (
    <AstryxHeadingComponent
      color={asOption(args.color, COLORS, DEFAULT_PROPS.color)}
      display={asOption(args.display, DISPLAYS, DEFAULT_PROPS.display)}
      justify={asOption(args.justify, JUSTIFIES, DEFAULT_PROPS.justify)}
      level={asOption(args.level, LEVELS, DEFAULT_PROPS.level)}
      maxLines={asNumber(args.maxLines, DEFAULT_PROPS.maxLines)}
      type={asOption(args.type, TYPES, DEFAULT_PROPS.type)}
      wrap={asOption(args.wrap, WRAPS, DEFAULT_PROPS.wrap)}
    >
      {asText(args.children, DEFAULT_PROPS.children)}
    </AstryxHeadingComponent>
  ),
};

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
