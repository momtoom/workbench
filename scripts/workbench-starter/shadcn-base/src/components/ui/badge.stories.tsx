import { Badge } from './badge';
import { Spinner } from './spinner';
import { asOption, asText } from './story-utils';

type Args = {
  children?: boolean | string;
  className?: boolean | string;
  variant?: boolean | string;
};

const VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;

const DEFAULT_PROPS = {
  children: 'Badge',
  variant: 'default',
  className: '',
} as const;

const meta = {
  title: 'shadcn/Base UI/Badge',
  component: Badge,
  authoring: {
    group: 'Content',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    className: { control: 'text' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

function BadgeCheckIcon() {
  return (
    <svg aria-hidden="true" data-icon="inline-start" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function BadgeWarningIcon() {
  return (
    <svg aria-hidden="true" data-icon="inline-start" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function BadgeArrowUpRightIcon() {
  return (
    <svg aria-hidden="true" data-icon="inline-end" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export const Default = {
  name: 'Badge',
  render: (args: Args) => (
    <Badge
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      variant={asOption(args.variant, VARIANTS, 'default')}
    >
      {asText(args.children, DEFAULT_PROPS.children)}
    </Badge>
  ),
};

export const BadgeWithIcon = {
  name: 'Badge + icon',
  args: {
    children: 'Ready',
    variant: 'secondary',
    className: '',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    className: { control: 'text' },
  },
  sourceInsert: {
    jsxChildren: '<svg aria-hidden="true" data-icon="inline-start" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></svg>Ready',
    props: {
      variant: 'secondary',
      className: '',
    },
  },
  render: (args: Args) => (
    <Badge
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      variant={asOption(args.variant, VARIANTS, 'secondary')}
    >
      <BadgeCheckIcon />
      {asText(args.children, 'Ready')}
    </Badge>
  ),
};

export const DestructiveBadge = {
  name: 'Destructive badge',
  args: {
    children: 'Blocked',
    variant: 'destructive',
    className: '',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    className: { control: 'text' },
  },
  sourceInsert: {
    jsxChildren: '<svg aria-hidden="true" data-icon="inline-start" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>Blocked',
    props: {
      variant: 'destructive',
      className: '',
    },
  },
  render: (args: Args) => (
    <Badge
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      variant={asOption(args.variant, VARIANTS, 'destructive')}
    >
      <BadgeWarningIcon />
      {asText(args.children, 'Blocked')}
    </Badge>
  ),
};

export const BadgeWithSpinner = {
  name: 'Badge + spinner',
  args: {
    children: 'Deleting',
    variant: 'destructive',
    className: '',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    className: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['Spinner'],
        sourceFile: 'src/components/ui/spinner.tsx',
      },
    ],
    jsxChildren: '<Spinner />Deleting',
    props: {
      variant: 'destructive',
      className: '',
    },
  },
  render: (args: Args) => (
    <Badge
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      variant={asOption(args.variant, VARIANTS, 'destructive')}
    >
      <Spinner />
      {asText(args.children, 'Deleting')}
    </Badge>
  ),
};

export const BadgeAsLink = {
  name: 'Badge as link',
  args: {
    children: 'Open Link',
    variant: 'default',
    className: '',
  },
  argTypes: {
    children: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    className: { control: 'text' },
  },
  sourceInsert: {
    jsxProps: { render: '<a href="#link" />' },
    jsxChildren: 'Open Link <svg aria-hidden="true" data-icon="inline-end" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"><path d="M7 17 17 7" /><path d="M9 7h8v8" /></svg>',
    props: {
      variant: 'default',
      className: '',
    },
  },
  render: (args: Args) => (
    <Badge
      render={<a href="#link" />}
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      variant={asOption(args.variant, VARIANTS, 'default')}
    >
      {asText(args.children, 'Open Link')}
      <BadgeArrowUpRightIcon />
    </Badge>
  ),
};
