import { AstryxLayoutPanel as AstryxLayoutPanelComponent } from './AstryxLayoutPanel';
import { AstryxList } from './AstryxList';
import { AstryxListItem } from './AstryxListItem';

type Args = Record<string, boolean | string>;

const SLOTS = ['start', 'end'] as const;
const PADDINGS = ['inherit', 'none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;

const DEFAULT_PROPS = {
  label: 'Layout panel',
  role: 'navigation',
  padding: 'md',
  width: '240px',
  hasDivider: true,
  isScrollable: true,
  slot: 'start',
} as const;

const meta = {
  title: 'Astryx/LayoutPanel',
  component: AstryxLayoutPanelComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    role: { control: 'text' },
    padding: { control: 'select', options: PADDINGS },
    width: { control: 'text' },
    hasDivider: { control: 'boolean' },
    isScrollable: { control: 'boolean' },
    slot: { control: 'select', options: SLOTS },
  },
  authoring: {
    group: 'Layout',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxList'], sourceFile: 'src/components/AstryxList.tsx' },
      { names: ['AstryxListItem'], sourceFile: 'src/components/AstryxListItem.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxList density="compact" listStyle="none"><AstryxListItem label="Overview" /><AstryxListItem label="Components" /><AstryxListItem label="Tokens" /></AstryxList>',
  },
};
export default meta;

export const AstryxLayoutPanel = {
  name: 'AstryxLayoutPanel',
  render: (args: Args) => (
    <AstryxLayoutPanelComponent
      hasDivider={asBoolean(args.hasDivider)}
      isScrollable={asBoolean(args.isScrollable)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      padding={asNumberOption(args.padding, PADDINGS, DEFAULT_PROPS.padding)}
      role={asText(args.role, DEFAULT_PROPS.role)}
      slot={asOption(args.slot, SLOTS, DEFAULT_PROPS.slot)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxList density="compact" listStyle="none">
        <AstryxListItem label="Overview" />
        <AstryxListItem label="Components" />
        <AstryxListItem label="Tokens" />
      </AstryxList>
    </AstryxLayoutPanelComponent>
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
