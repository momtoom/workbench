import { Input as WorkbenchInput } from './Input';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  label: 'Project name',
  placeholder: 'Workbench project',
  description: 'This field is rendered from a registered source component.',
  error: '',
} as const;

const meta = {
  title: 'Local/Input',
  component: WorkbenchInput,
  authoring: {
    roles: ['control.input'],
    nativeReplacements: ['input'],
    priority: 100,
  },
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Input = {
  name: 'Input',
  render: (args: Args) => (
    <WorkbenchInput
      description={asText(args.description)}
      error={asText(args.error)}
      label={asText(args.label, 'Project name')}
      placeholder={asText(args.placeholder, 'Workbench project')}
    />
  ),
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
