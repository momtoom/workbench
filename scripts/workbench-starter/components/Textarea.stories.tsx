import { Textarea as WorkbenchTextarea } from './Textarea';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  label: 'Message',
  placeholder: 'Write a note',
  description: 'A multiline input adapted from shadcn/ui textarea.',
  error: '',
} as const;

const meta = {
  title: 'Local/Textarea',
  component: WorkbenchTextarea,
  authoring: {
    roles: ['control.input'],
    nativeReplacements: ['textarea'],
    priority: 90,
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

export const Textarea = {
  name: 'Textarea',
  render: (args: Args) => (
    <WorkbenchTextarea
      description={asText(args.description)}
      error={asText(args.error)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
    />
  ),
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
