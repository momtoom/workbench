import { AstryxPowerSearchInput as Component } from './AstryxPowerSearchInput';
const DEFAULT_PROPS = {
  label: 'Search projects',
  placeholder: 'Filter by title, status, date, or owner',
  hasClear: true,
  isLabelHidden: false,
  resultCount: '24 results',
} as const;
const meta = {
  title: 'Astryx/PowerSearchInput',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    hasClear: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    resultCount: { control: 'text' },
  },
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxPowerSearchInput = {
  name: 'AstryxPowerSearchInput',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
