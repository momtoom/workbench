import { AstryxPowerSearchFieldOption as Component } from './AstryxPowerSearchFieldOption';

const DEFAULT_PROPS = { label: 'Field', value: 'field' } as const;
const meta = {
  title: 'Astryx/PowerSearchFieldOption',
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

export const AstryxPowerSearchFieldOption = {
  name: 'AstryxPowerSearchFieldOption',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
