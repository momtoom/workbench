import { AstryxNavIcon as Component } from './AstryxNavIcon';
type Args = Record<string, string>;
const DEFAULT_PROPS = { icon: 'home' } as const;
const meta = {
  title: 'Astryx/NavIcon', component: Component, args: DEFAULT_PROPS,
  argTypes: { icon: { control: 'icon' } }, sourceInsert: { props: DEFAULT_PROPS },
  authoring: {
    group: 'Navigation',
  },
};
export default meta;
export const AstryxNavIcon = { name: 'AstryxNavIcon', render: (args: Args) => <Component {...args} /> };
