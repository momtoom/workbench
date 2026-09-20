import { Alert as ShadcnAlert, AlertAction, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  className?: boolean | string;
  icon?: boolean | string;
  showIcon?: boolean | string;
  variant?: boolean | string;
};

const VARIANTS = ['default', 'destructive'] as const;

const DEFAULT_PROPS = {
  icon: 'alert-circle',
  variant: 'default',
  className: 'max-w-md',
  showIcon: true,
} as const;

const DEFAULT_TITLE = 'Text';
const DEFAULT_DESCRIPTION = 'Title';
const ACTION_BUTTON_LABEL = 'Button';
const ACTION_BUTTON_PROPS = {
  variant: 'default',
  size: 'xs',
} as const;

const meta = {
  title: 'shadcn/Base UI/Alert',
  component: ShadcnAlert,
  authoring: {
    group: 'Feedback',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    icon: { control: 'icon' },
    variant: { control: 'select', options: VARIANTS },
    className: { control: 'text' },
    showIcon: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['AlertTitle', 'AlertDescription', 'AlertAction'],
        sourceFile: 'src/components/ui/alert.tsx',
      },
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren:
      '<AlertTitle>Text</AlertTitle><AlertDescription>Title</AlertDescription><AlertAction><Button size="xs" variant="default">Button</Button></AlertAction>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Alert = {
  name: 'Alert',
  render: (args: Args) => (
    <ShadcnAlert
      className={asText(args.className, DEFAULT_PROPS.className)}
      icon={asText(args.icon, DEFAULT_PROPS.icon)}
      showIcon={asBoolean(args.showIcon, DEFAULT_PROPS.showIcon)}
      variant={asOption(args.variant, VARIANTS, 'default')}
    >
      <AlertTitle>{DEFAULT_TITLE}</AlertTitle>
      <AlertDescription>{DEFAULT_DESCRIPTION}</AlertDescription>
      <AlertAction>
        <Button size={ACTION_BUTTON_PROPS.size} variant={ACTION_BUTTON_PROPS.variant}>{ACTION_BUTTON_LABEL}</Button>
      </AlertAction>
    </ShadcnAlert>
  ),
};

export const AlertWithIcon = {
  name: 'Alert + icon',
  args: {
    icon: 'info',
    variant: 'default',
    className: 'max-w-md',
    showIcon: true,
  },
  argTypes: {
    icon: { control: 'icon' },
    variant: { control: 'select', options: VARIANTS },
    className: { control: 'text' },
    showIcon: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['AlertTitle', 'AlertDescription'],
        sourceFile: 'src/components/ui/alert.tsx',
      },
    ],
    jsxChildren:
      '<AlertTitle>New feature available</AlertTitle><AlertDescription>We added dark mode support. You can enable it in your account settings.</AlertDescription>',
    props: {
      icon: 'info',
      variant: 'default',
      className: 'max-w-md',
      showIcon: true,
    },
  },
  render: (args: Args) => (
    <ShadcnAlert
      className={asText(args.className, DEFAULT_PROPS.className)}
      icon={asText(args.icon, 'info')}
      showIcon={asBoolean(args.showIcon, true)}
      variant={asOption(args.variant, VARIANTS, 'default')}
    >
      <AlertTitle>New feature available</AlertTitle>
      <AlertDescription>We added dark mode support. You can enable it in your account settings.</AlertDescription>
    </ShadcnAlert>
  ),
};

export const AlertWithAction = {
  name: 'Alert + action',
  args: {
    icon: 'alert-circle',
    variant: 'default',
    className: 'max-w-md',
    showIcon: true,
  },
  argTypes: {
    icon: { control: 'icon' },
    variant: { control: 'select', options: VARIANTS },
    className: { control: 'text' },
    showIcon: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['AlertTitle', 'AlertDescription', 'AlertAction'],
        sourceFile: 'src/components/ui/alert.tsx',
      },
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren:
      '<AlertTitle>Text</AlertTitle><AlertDescription>Title</AlertDescription><AlertAction><Button size="xs" variant="default">Button</Button></AlertAction>',
    props: {
      icon: 'alert-circle',
      variant: 'default',
      className: 'max-w-md',
      showIcon: true,
    },
  },
  render: (args: Args) => (
    <ShadcnAlert
      className={asText(args.className, DEFAULT_PROPS.className)}
      icon={asText(args.icon, DEFAULT_PROPS.icon)}
      showIcon={asBoolean(args.showIcon, true)}
      variant={asOption(args.variant, VARIANTS, 'default')}
    >
      <AlertTitle>{DEFAULT_TITLE}</AlertTitle>
      <AlertDescription>{DEFAULT_DESCRIPTION}</AlertDescription>
      <AlertAction>
        <Button size="xs" variant="default">{ACTION_BUTTON_LABEL}</Button>
      </AlertAction>
    </ShadcnAlert>
  ),
};

export const AlertCustomColor = {
  name: 'Alert + custom color',
  args: {
    icon: 'alert-triangle',
    variant: 'default',
    className: 'max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50',
    showIcon: true,
  },
  argTypes: {
    icon: { control: 'icon' },
    variant: { control: 'select', options: VARIANTS },
    className: { control: 'text' },
    showIcon: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['AlertTitle', 'AlertDescription'],
        sourceFile: 'src/components/ui/alert.tsx',
      },
    ],
    jsxChildren:
      '<AlertTitle>Your subscription will expire in 3 days.</AlertTitle><AlertDescription>Renew now to avoid service interruption or upgrade to a paid plan to continue using the service.</AlertDescription>',
    props: {
      icon: 'alert-triangle',
      variant: 'default',
      className: 'max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50',
      showIcon: true,
    },
  },
  render: (args: Args) => (
    <ShadcnAlert
      className={asText(args.className, 'max-w-md border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50')}
      icon={asText(args.icon, 'alert-triangle')}
      showIcon={asBoolean(args.showIcon, true)}
      variant={asOption(args.variant, VARIANTS, 'default')}
    >
      <AlertTitle>Your subscription will expire in 3 days.</AlertTitle>
      <AlertDescription>Renew now to avoid service interruption or upgrade to a paid plan to continue using the service.</AlertDescription>
    </ShadcnAlert>
  ),
};

export const AlertTitleStory = {
  name: 'AlertTitle',
  sourceInsert: {
    props: {
      children: 'Title',
    },
  },
  render: () => (
    <ShadcnAlert className="max-w-md">
      <AlertTitle>Title</AlertTitle>
      <AlertDescription>Description</AlertDescription>
    </ShadcnAlert>
  ),
};

export const AlertDescriptionStory = {
  name: 'AlertDescription',
  sourceInsert: {
    props: {
      children: 'Description',
    },
  },
  render: () => (
    <ShadcnAlert className="max-w-md">
      <AlertTitle>Title</AlertTitle>
      <AlertDescription>Description</AlertDescription>
    </ShadcnAlert>
  ),
};

export const AlertActionStory = {
  name: 'AlertAction',
  sourceInsert: {
    imports: [
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren: '<Button size="xs" variant="outline">Review</Button>',
  },
  render: () => (
    <ShadcnAlert className="max-w-md">
      <AlertTitle>Title</AlertTitle>
      <AlertDescription>Description</AlertDescription>
      <AlertAction>
        <Button size="xs" variant="outline">Review</Button>
      </AlertAction>
    </ShadcnAlert>
  ),
};
