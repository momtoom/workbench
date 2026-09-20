import { AstryxBadge } from './AstryxBadge';
import { AstryxButton } from './AstryxButton';
import { AstryxTextInput } from './AstryxTextInput';
import { AstryxToolbar as AstryxToolbarComponent } from './AstryxToolbar';
import { AstryxToolbarSlot } from './AstryxToolbarSlot';

type Args = Record<string, boolean | number | string>;

const SIZES = ['sm', 'md', 'lg'] as const;
const ORIENTATIONS = ['horizontal', 'vertical'] as const;
const VARIANTS = ['transparent', 'section', 'muted'] as const;
const GAPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;

const DEFAULT_PROPS = {
  label: 'Component actions',
  variant: 'transparent',
  orientation: 'horizontal',
  gap: 1,
  size: 'md',
  dividerBottom: true,
  dividerEnd: false,
  dividerStart: false,
  dividerTop: false,
} as const;

const meta = {
  title: 'Astryx/Toolbar',
  component: AstryxToolbarComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    orientation: { control: 'select', options: ORIENTATIONS },
    gap: { control: 'select', options: GAPS },
    size: { control: 'select', options: SIZES },
    dividerBottom: { control: 'boolean' },
    dividerEnd: { control: 'boolean' },
    dividerStart: { control: 'boolean' },
    dividerTop: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxToolbarSlot'],
    group: 'Actions',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxBadge'], sourceFile: 'src/components/AstryxBadge.tsx' },
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
      { names: ['AstryxTextInput'], sourceFile: 'src/components/AstryxTextInput.tsx' },
      { names: ['AstryxToolbarSlot'], sourceFile: 'src/components/AstryxToolbarSlot.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxToolbarSlot slot="start"><AstryxButton label="Filter" /></AstryxToolbarSlot>\n<AstryxToolbarSlot slot="center"><AstryxBadge label="77 registered" variant="success" /></AstryxToolbarSlot>\n<AstryxToolbarSlot slot="end"><AstryxTextInput isLabelHidden label="Search" placeholder="Search components" /></AstryxToolbarSlot>',
  },
};
export default meta;

export const AstryxToolbar = {
  name: 'AstryxToolbar',
  render: (args: Args) => (
    <AstryxToolbarComponent
      dividerBottom={asBoolean(args.dividerBottom)}
      dividerEnd={asBoolean(args.dividerEnd)}
      dividerStart={asBoolean(args.dividerStart)}
      dividerTop={asBoolean(args.dividerTop)}
      gap={asNumberOption(args.gap, GAPS, DEFAULT_PROPS.gap)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      orientation={asOption(args.orientation, ORIENTATIONS, DEFAULT_PROPS.orientation)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    >
      <AstryxToolbarSlot slot="start">
        <AstryxButton label="Filter" />
      </AstryxToolbarSlot>
      <AstryxToolbarSlot slot="center">
        <AstryxBadge label="77 registered" variant="success" />
      </AstryxToolbarSlot>
      <AstryxToolbarSlot slot="end">
        <AstryxTextInput isLabelHidden label="Search" placeholder="Search components" />
      </AstryxToolbarSlot>
    </AstryxToolbarComponent>
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
