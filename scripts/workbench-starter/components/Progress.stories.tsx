import { Progress as WorkbenchProgress } from './Progress';

type Args = {
  label: string;
  max: number;
  showValue: boolean;
  value: number;
};

const DEFAULT_PROPS = {
  label: 'Project setup',
  max: 100,
  showValue: true,
  value: 66,
} as const;

const meta = {
  title: 'Local/Progress',
  component: WorkbenchProgress,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    max: { control: 'number' },
    showValue: { control: 'boolean' },
    value: { control: 'number' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Progress = {
  name: 'Progress',
  render: (args: Args) => (
    <WorkbenchProgress
      label={asText(args.label, 'Project setup')}
      max={asNumber(args.max, 100)}
      showValue={Boolean(args.showValue)}
      value={asNumber(args.value, 66)}
    />
  ),
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
