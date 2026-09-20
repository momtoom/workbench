import { AstryxButton } from './AstryxButton';
import { AstryxLayoutFooter as AstryxLayoutFooterComponent } from './AstryxLayoutFooter';

type Args = Record<string, boolean | string>;

const PADDINGS = ['inherit', 'none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;

const DEFAULT_PROPS = {
  label: 'Layout footer',
  role: 'contentinfo',
  padding: 'md',
  height: '',
  hasDivider: true,
} as const;

const meta = {
  title: 'Astryx/LayoutFooter',
  component: AstryxLayoutFooterComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    role: { control: 'text' },
    padding: { control: 'select', options: PADDINGS },
    height: { control: 'text' },
    hasDivider: { control: 'boolean' },
  },
  authoring: {
    group: 'Layout',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxButton label="Cancel" />\n<AstryxButton label="Save" variant="primary" />',
  },
};
export default meta;

export const AstryxLayoutFooter = {
  name: 'AstryxLayoutFooter',
  render: (args: Args) => (
    <AstryxLayoutFooterComponent
      hasDivider={asBoolean(args.hasDivider)}
      height={asText(args.height)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      padding={asNumberOption(args.padding, PADDINGS, DEFAULT_PROPS.padding)}
      role={asText(args.role, DEFAULT_PROPS.role)}
    >
      <AstryxButton label="Cancel" />
      <AstryxButton label="Save" variant="primary" />
    </AstryxLayoutFooterComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumberOption<T extends number | string>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'number' || typeof value === 'string') && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
