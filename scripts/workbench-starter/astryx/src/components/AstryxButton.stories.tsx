import { AstryxBadge } from './AstryxBadge';
import { AstryxButton as AstryxButtonComponent } from './AstryxButton';
import { AstryxIcon } from './AstryxIcon';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | string>;

const VARIANTS = ['primary', 'secondary', 'ghost', 'destructive'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

const DEFAULT_PROPS = {
  label: 'Save changes',
  variant: 'primary',
  size: 'md',
  isDisabled: false,
  isLoading: false,
  tooltip: '',
} as const;

const meta = {
  title: 'Astryx/Button',
  component: AstryxButtonComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    tooltip: { control: 'text' },
  },
  authoring: {
    group: 'Actions',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxBadge'],
        sourceFile: 'src/components/AstryxBadge.tsx',
      },
      {
        names: ['AstryxIcon'],
        sourceFile: 'src/components/AstryxIcon.tsx',
      },
      {
        names: ['AstryxText'],
        sourceFile: 'src/components/AstryxText.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxIcon icon="check" size="sm" />\n<AstryxText as="span" color="inherit" type="label">Save changes</AstryxText>\n<AstryxBadge label="New" variant="success" />',
  },
};
export default meta;

export const AstryxButton = {
  name: 'AstryxButton',
  render: (args: Args) => (
    <AstryxButtonComponent
      isDisabled={asBoolean(args.isDisabled)}
      isLoading={asBoolean(args.isLoading)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      tooltip={asText(args.tooltip)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    >
      <AstryxIcon icon="check" size="sm" />
      <AstryxText as="span" color="inherit" type="label">
        Save changes
      </AstryxText>
      <AstryxBadge label="New" variant="success" />
    </AstryxButtonComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
