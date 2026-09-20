import { AstryxPowerSearchAction as Component } from './AstryxPowerSearchAction';

const DEFAULT_PROPS = { label: 'Apply', action: 'apply' } as const;
const meta = {
  title: 'Astryx/PowerSearchAction',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    action: { control: 'select', options: ['cancel', 'apply'] },
  },
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxPowerSearchAction = {
  name: 'AstryxPowerSearchAction',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
