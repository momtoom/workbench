import { AstryxLink as AstryxLinkComponent } from './AstryxLink';

type Args = Record<string, boolean | number | string>;

const TYPES = ['body', 'large', 'label', 'supporting', 'code', 'inherit'] as const;
const COLORS = ['primary', 'secondary', 'disabled', 'placeholder', 'accent', 'inherit'] as const;
const WEIGHTS = ['normal', 'medium', 'semibold', 'bold'] as const;
const DISPLAYS = ['inline', 'block'] as const;

const DEFAULT_PROPS = {
  children: 'Astryx documentation',
  href: 'https://astryx.atmeta.com',
  type: 'body',
  weight: 'medium',
  color: 'accent',
  display: 'inline',
  hasUnderline: false,
  isDisabled: false,
  isExternalLink: true,
  isStandalone: false,
  maxLines: 0,
  tooltip: '',
} as const;

const meta = {
  title: 'Astryx/Link',
  component: AstryxLinkComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
    href: { control: 'text' },
    type: { control: 'select', options: TYPES },
    weight: { control: 'select', options: WEIGHTS },
    color: { control: 'select', options: COLORS },
    display: { control: 'select', options: DISPLAYS },
    hasUnderline: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isExternalLink: { control: 'boolean' },
    isStandalone: { control: 'boolean' },
    maxLines: { control: 'number' },
    tooltip: { control: 'text' },
  },
  authoring: {
    group: 'Actions',
  },
  sourceInsert: {
    jsxChildren: DEFAULT_PROPS.children,
    props: {
      href: DEFAULT_PROPS.href,
      weight: DEFAULT_PROPS.weight,
      color: DEFAULT_PROPS.color,
      isExternalLink: DEFAULT_PROPS.isExternalLink,
    },
  },
};
export default meta;

export const AstryxLink = {
  name: 'AstryxLink',
  render: (args: Args) => (
    <AstryxLinkComponent
      color={asOption(args.color, COLORS, DEFAULT_PROPS.color)}
      display={asOption(args.display, DISPLAYS, DEFAULT_PROPS.display)}
      hasUnderline={asBoolean(args.hasUnderline)}
      href={asText(args.href, DEFAULT_PROPS.href)}
      isDisabled={asBoolean(args.isDisabled)}
      isExternalLink={asBoolean(args.isExternalLink)}
      isStandalone={asBoolean(args.isStandalone)}
      maxLines={asNumber(args.maxLines, DEFAULT_PROPS.maxLines)}
      tooltip={asText(args.tooltip)}
      type={asOption(args.type, TYPES, DEFAULT_PROPS.type)}
      weight={asOption(args.weight, WEIGHTS, DEFAULT_PROPS.weight)}
    >
      {asText(args.children, DEFAULT_PROPS.children)}
    </AstryxLinkComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
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
