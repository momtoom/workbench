import { RiAddLine, RiArrowRightLine, RiDownloadLine, RiLoader4Line, RiSettings3Line } from '@remixicon/react';
import { Button as ShadcnButton } from './button';
import '../../workbench-shadcn.css';
import '../../workbench-tokens.css';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  'aria-label'?: boolean | string;
  children?: boolean | string;
  className?: boolean | string;
  disabled?: boolean | string;
  shape?: boolean | string;
  size?: boolean | string;
  type?: boolean | string;
  variant?: boolean | string;
};

const VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;
const SHAPES = ['rounded', 'pill'] as const;
const SIZES = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const;
const TYPES = ['button', 'submit', 'reset'] as const;

const DEFAULT_PROPS = {
  children: 'Button',
  'aria-label': '',
  disabled: false,
  type: 'button',
  variant: 'default',
  size: 'default',
  shape: 'rounded',
  className: '',
} as const;

const BUTTON_OPTION_ARG_TYPES = {
  type: { control: 'select', options: TYPES },
  variant: { control: 'select', options: VARIANTS },
  size: { control: 'select', options: SIZES },
  shape: { control: 'select', options: SHAPES },
} as const;

const meta = {
  title: 'shadcn/Base UI/Button',
  component: ShadcnButton,
  authoring: {
    group: 'Actions',
    roles: ['control.action'],
    nativeReplacements: ['button'],
    priority: 100,
  },
  args: DEFAULT_PROPS,
  argTypes: {
    'aria-label': { control: 'text' },
    children: { control: 'text' },
    className: { control: 'text' },
    disabled: { control: 'boolean' },
    ...BUTTON_OPTION_ARG_TYPES,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Button = {
  name: 'Button',
  render: (args: Args) => (
    <ShadcnButton
      aria-label={asText(args['aria-label'], DEFAULT_PROPS['aria-label']) || undefined}
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      disabled={asBoolean(args.disabled)}
      shape={asOption(args.shape, SHAPES, 'rounded')}
      size={asOption(args.size, SIZES, 'default')}
      type={asOption(args.type, TYPES, 'button')}
      variant={asOption(args.variant, VARIANTS, 'default')}
    >
      {asText(args.children, DEFAULT_PROPS.children)}
    </ShadcnButton>
  ),
};

export const ButtonWithLeadingIcon = {
  name: 'Button + leading icon',
  args: {
    children: 'Export',
    type: 'button',
    variant: 'outline',
    size: 'default',
    shape: 'rounded',
    className: '',
  },
  argTypes: {
    children: { control: 'text' },
    className: { control: 'text' },
    ...BUTTON_OPTION_ARG_TYPES,
  },
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiDownloadLine'] }],
    jsxChildren: '<><RiDownloadLine aria-hidden="true" data-icon="inline-start" />Export</>',
    props: {
      type: 'button',
      variant: 'outline',
      size: 'default',
      shape: 'rounded',
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnButton
      aria-label={asText(args['aria-label'], DEFAULT_PROPS['aria-label']) || undefined}
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      disabled={asBoolean(args.disabled)}
      shape={asOption(args.shape, SHAPES, 'rounded')}
      size={asOption(args.size, SIZES, 'default')}
      type={asOption(args.type, TYPES, 'button')}
      variant={asOption(args.variant, VARIANTS, 'outline')}
    >
      <RiDownloadLine aria-hidden="true" data-icon="inline-start" />
      {asText(args.children, 'Export')}
    </ShadcnButton>
  ),
};

export const ButtonWithTrailingIcon = {
  name: 'Button + trailing icon',
  args: {
    children: 'Continue',
    type: 'button',
    variant: 'default',
    size: 'default',
    shape: 'rounded',
    className: '',
  },
  argTypes: {
    children: { control: 'text' },
    className: { control: 'text' },
    ...BUTTON_OPTION_ARG_TYPES,
  },
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiArrowRightLine'] }],
    jsxChildren: '<><span>Continue</span><RiArrowRightLine aria-hidden="true" data-icon="inline-end" /></>',
    props: {
      type: 'button',
      variant: 'default',
      size: 'default',
      shape: 'rounded',
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnButton
      aria-label={asText(args['aria-label'], DEFAULT_PROPS['aria-label']) || undefined}
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      disabled={asBoolean(args.disabled)}
      shape={asOption(args.shape, SHAPES, 'rounded')}
      size={asOption(args.size, SIZES, 'default')}
      type={asOption(args.type, TYPES, 'button')}
      variant={asOption(args.variant, VARIANTS, 'default')}
    >
      <span>{asText(args.children, 'Continue')}</span>
      <RiArrowRightLine aria-hidden="true" data-icon="inline-end" />
    </ShadcnButton>
  ),
};

export const IconButton = {
  name: 'Icon button',
  args: {
    'aria-label': 'Settings',
    type: 'button',
    variant: 'ghost',
    size: 'icon',
    shape: 'pill',
    className: '',
  },
  argTypes: {
    'aria-label': { control: 'text' },
    className: { control: 'text' },
    ...BUTTON_OPTION_ARG_TYPES,
  },
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiSettings3Line'] }],
    jsxChildren: '<RiSettings3Line aria-hidden="true" />',
    props: {
      'aria-label': 'Settings',
      type: 'button',
      variant: 'ghost',
      size: 'icon',
      shape: 'pill',
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnButton
      aria-label={asText(args['aria-label'], 'Settings')}
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      disabled={asBoolean(args.disabled)}
      shape={asOption(args.shape, SHAPES, 'pill')}
      size={asOption(args.size, SIZES, 'icon')}
      type={asOption(args.type, TYPES, 'button')}
      variant={asOption(args.variant, VARIANTS, 'ghost')}
    >
      <RiSettings3Line aria-hidden="true" />
      {asText(args.children, '')}
    </ShadcnButton>
  ),
};

export const LoadingButton = {
  name: 'Loading button',
  args: {
    children: 'Saving',
    disabled: true,
    type: 'button',
    variant: 'secondary',
    size: 'default',
    shape: 'rounded',
    className: '',
  },
  argTypes: {
    children: { control: 'text' },
    className: { control: 'text' },
    disabled: { control: 'boolean' },
    ...BUTTON_OPTION_ARG_TYPES,
  },
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiLoader4Line'] }],
    jsxChildren: '<><RiLoader4Line aria-hidden="true" className="animate-spin" data-icon="inline-start" />Saving</>',
    props: {
      disabled: true,
      type: 'button',
      variant: 'secondary',
      size: 'default',
      shape: 'rounded',
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnButton
      aria-label={asText(args['aria-label'], DEFAULT_PROPS['aria-label']) || undefined}
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      disabled={asBoolean(args.disabled, true)}
      shape={asOption(args.shape, SHAPES, 'rounded')}
      size={asOption(args.size, SIZES, 'default')}
      type={asOption(args.type, TYPES, 'button')}
      variant={asOption(args.variant, VARIANTS, 'secondary')}
    >
      <RiLoader4Line aria-hidden="true" className="animate-spin" data-icon="inline-start" />
      {asText(args.children, 'Saving')}
    </ShadcnButton>
  ),
};

export const AddButton = {
  name: 'Add button',
  args: {
    children: 'Add item',
    type: 'button',
    variant: 'default',
    size: 'sm',
    shape: 'rounded',
    className: '',
  },
  argTypes: {
    children: { control: 'text' },
    className: { control: 'text' },
    ...BUTTON_OPTION_ARG_TYPES,
  },
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiAddLine'] }],
    jsxChildren: '<><RiAddLine aria-hidden="true" data-icon="inline-start" />Add item</>',
    props: {
      type: 'button',
      variant: 'default',
      size: 'sm',
      shape: 'rounded',
      className: '',
    },
  },
  render: (args: Args) => (
    <ShadcnButton
      aria-label={asText(args['aria-label'], DEFAULT_PROPS['aria-label']) || undefined}
      className={asText(args.className, DEFAULT_PROPS.className) || undefined}
      disabled={asBoolean(args.disabled)}
      shape={asOption(args.shape, SHAPES, 'rounded')}
      size={asOption(args.size, SIZES, 'sm')}
      type={asOption(args.type, TYPES, 'button')}
      variant={asOption(args.variant, VARIANTS, 'default')}
    >
      <RiAddLine aria-hidden="true" data-icon="inline-start" />
      {asText(args.children, 'Add item')}
    </ShadcnButton>
  ),
};
