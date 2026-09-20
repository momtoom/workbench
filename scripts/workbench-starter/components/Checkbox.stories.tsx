import { Checkbox as WorkbenchCheckbox } from './Checkbox';

const DEFAULT_PROPS = {
  label: 'Accept terms',
  defaultChecked: true,
} as const;

const meta = {
  title: 'Local/Checkbox',
  component: WorkbenchCheckbox,
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

export const Checkbox = {
  name: 'Checkbox',
  render: (args: typeof DEFAULT_PROPS) => <WorkbenchCheckbox {...args} />,
};
