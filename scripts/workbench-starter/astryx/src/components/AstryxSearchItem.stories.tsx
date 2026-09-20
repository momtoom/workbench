import { AstryxSearchItem as Component } from './AstryxSearchItem';

type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  label: 'Search item',
  description: 'Engineering',
  id: 'ada-lovelace',
  icon: 'none',
  endLabel: '',
  group: 'People',
  isDefaultSelected: false,
} as const;
const meta = {
  title: 'Astryx/SearchItem',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    id: { control: 'text' },
    icon: { control: 'icon' },
    endLabel: { control: 'text' },
    group: { control: 'text' },
    isDefaultSelected: { control: 'boolean' },
  },
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxSearchItem = {
  name: 'AstryxSearchItem',
  render: (args: Args) => <Component {...(args as typeof DEFAULT_PROPS)} />,
};
