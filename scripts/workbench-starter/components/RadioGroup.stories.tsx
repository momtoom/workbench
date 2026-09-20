import { RadioGroup as WorkbenchRadioGroup } from './RadioGroup';

const DEFAULT_PROPS = {
  defaultValue: 'default',
  label: 'Interface density',
  name: 'density',
} as const;

const meta = {
  title: 'Local/RadioGroup',
  component: WorkbenchRadioGroup,
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'select', options: ['default', 'compact', 'comfortable'] },
    label: { control: 'text' },
    name: { control: 'text' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const RadioGroup = {
  name: 'RadioGroup',
  render: (args: typeof DEFAULT_PROPS) => <WorkbenchRadioGroup {...args} />,
};
