import { AstryxPowerSearchOption as Component } from './AstryxPowerSearchOption';

type Args = Record<string, string>;
const DEFAULT_PROPS = {
  label: 'Option',
  value: 'value',
} as const;
const meta = {
  title: 'Astryx/PowerSearchOption',
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
export const AstryxPowerSearchOption = {
  name: 'AstryxPowerSearchOption',
  render: (args: Args) => <Component {...(args as typeof DEFAULT_PROPS)} />,
};
