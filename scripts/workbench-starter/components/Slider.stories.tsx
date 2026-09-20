import { Slider as WorkbenchSlider } from './Slider';

const DEFAULT_PROPS = {
  defaultValue: 48,
  label: 'Density',
  max: 100,
  min: 0,
  showValue: true,
  step: 1,
} as const;

const meta = {
  title: 'Local/Slider',
  component: WorkbenchSlider,
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'number' },
    label: { control: 'text' },
    max: { control: 'number' },
    min: { control: 'number' },
    showValue: { control: 'boolean' },
    step: { control: 'number' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Slider = {
  name: 'Slider',
  render: (args: typeof DEFAULT_PROPS) => <WorkbenchSlider {...args} />,
};
