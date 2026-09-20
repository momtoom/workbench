import { Switch as WorkbenchSwitch } from './Switch';

type Args = Record<string, string | boolean>;

const DEFAULT_PROPS = {
  label: 'Enable notifications',
  defaultChecked: true,
} as const;

const meta = {
  title: 'Local/Switch',
  component: WorkbenchSwitch,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    defaultChecked: { control: 'boolean' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Switch = {
  name: 'Switch',
  render: (args: Args) => (
    <WorkbenchSwitch
      defaultChecked={asBoolean(args.defaultChecked)}
      label={asText(args.label, DEFAULT_PROPS.label)}
    />
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
