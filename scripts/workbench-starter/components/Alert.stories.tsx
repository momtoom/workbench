import {
  Alert as WorkbenchAlert,
  AlertDescription as WorkbenchAlertDescription,
  AlertTitle as WorkbenchAlertTitle,
} from './Alert';

type Args = Record<string, string>;

const VARIANTS = ['default', 'destructive'] as const;

const DEFAULT_PROPS = {
  title: 'Heads up',
  description: 'This alert is adapted from the shadcn/ui alert structure.',
  icon: 'circle-alert',
  variant: 'default',
} as const;

const meta = {
  title: 'Local/Alert',
  component: WorkbenchAlert,
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    icon: { control: 'icon' },
    variant: { control: 'select', options: VARIANTS },
  },
  sourceInsert: {
    imports: [
      {
        names: ['AlertTitle', 'AlertDescription'],
        sourceFile: 'src/components/Alert.tsx',
      },
    ],
    jsxChildren: '<AlertTitle>Heads up</AlertTitle>\n<AlertDescription>This alert is adapted from the shadcn/ui alert structure.</AlertDescription>',
    props: {
      icon: DEFAULT_PROPS.icon,
      variant: DEFAULT_PROPS.variant,
    },
  },
};
export default meta;

export const Alert = {
  name: 'Alert',
  render: (args: Args) => (
    <WorkbenchAlert icon={asText(args.icon, 'circle-alert')} variant={asOption(args.variant, VARIANTS, 'default')}>
      <WorkbenchAlertTitle>{asText(args.title, DEFAULT_PROPS.title)}</WorkbenchAlertTitle>
      <WorkbenchAlertDescription>{asText(args.description, DEFAULT_PROPS.description)}</WorkbenchAlertDescription>
    </WorkbenchAlert>
  ),
};

export const AlertTitle = {
  name: 'AlertTitle',
  render: () => (
    <WorkbenchAlert icon="circle-alert">
      <WorkbenchAlertTitle>Heads up</WorkbenchAlertTitle>
      <WorkbenchAlertDescription>Use inside Alert to name the message.</WorkbenchAlertDescription>
    </WorkbenchAlert>
  ),
  sourceInsert: {
    jsxChildren: 'Heads up',
  },
};

export const AlertDescription = {
  name: 'AlertDescription',
  render: () => (
    <WorkbenchAlert icon="circle-alert">
      <WorkbenchAlertTitle>Alert description</WorkbenchAlertTitle>
      <WorkbenchAlertDescription>Use inside Alert to explain the message.</WorkbenchAlertDescription>
    </WorkbenchAlert>
  ),
  sourceInsert: {
    jsxChildren: 'Use inside Alert to explain the message.',
  },
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
