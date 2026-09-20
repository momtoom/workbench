import { AstryxPowerSearchOperatorOption as Component } from './AstryxPowerSearchOperatorOption';

const DEFAULT_PROPS = { label: 'is', value: 'is' } as const;
const meta = {
  title: 'Astryx/PowerSearchOperatorOption',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
  },
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};

export default meta;

export const AstryxPowerSearchOperatorOption = {
  name: 'AstryxPowerSearchOperatorOption',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
