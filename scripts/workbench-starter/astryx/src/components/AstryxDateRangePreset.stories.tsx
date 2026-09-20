import { AstryxDateRangePreset as Component } from './AstryxDateRangePreset';

type Args = Record<string, string>;
const DEFAULT_PROPS = {
  label: 'Date range preset',
  end: '2026-08-02',
  start: '2026-07-27',
} as const;
const meta = {
  title: 'Astryx/DateRangePreset',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    end: { control: 'text' },
    start: { control: 'text' },
  },
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxDateRangePreset = {
  name: 'AstryxDateRangePreset',
  render: (args: Args) => <Component {...(args as typeof DEFAULT_PROPS)} />,
};
