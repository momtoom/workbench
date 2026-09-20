import { Input } from './Input';
import { Label as WorkbenchLabel } from './Label';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  children: 'Email address',
  disabled: false,
} as const;

const meta = {
  title: 'Local/Label',
  component: WorkbenchLabel,
  authoring: {
    roles: ['content.text'],
    priority: 60,
  },
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Label = {
  name: 'Label',
  render: (args: Args) => (
    <div className="wb-stack">
      <WorkbenchLabel disabled={asBoolean(args.disabled)}>{asText(args.children, DEFAULT_PROPS.children)}</WorkbenchLabel>
      <Input placeholder="name@example.com" />
    </div>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
