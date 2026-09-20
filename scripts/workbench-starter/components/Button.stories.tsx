import { Button as WorkbenchButton } from './Button';

type Args = Record<string, boolean | string>;

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive'] as const;
const SIZES = ['sm', 'md', 'lg', 'icon'] as const;

const DEFAULT_PROPS = {
  children: 'Button',
  variant: 'default',
  size: 'md',
  leadingIcon: '',
  trailingIcon: 'arrow-right',
  loading: false,
} as const;

const meta = {
  title: 'Local/Button',
  component: WorkbenchButton,
  authoring: {
    roles: ['control.action'],
    nativeReplacements: ['button'],
    priority: 100,
  },
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
    leadingIcon: { control: 'icon' },
    trailingIcon: { control: 'icon' },
    loading: { control: 'boolean' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Button = {
  name: 'Button',
  render: (args: Args) => {
    const size = asOption(args.size, SIZES, 'md');
    const label = asText(args.children, 'Button');
    const leadingIcon = asOptionalIcon(args.leadingIcon);
    const trailingIcon = asOptionalIcon(args.trailingIcon);
    return (
      <WorkbenchButton
        leadingIcon={leadingIcon}
        loading={asBoolean(args.loading)}
        size={size}
        trailingIcon={trailingIcon}
        variant={asOption(args.variant, VARIANTS, 'default')}
      >
        {label}
      </WorkbenchButton>
    );
  },
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

function asOptionalIcon(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}
