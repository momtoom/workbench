import { AstryxDateTimeInput as Component } from './AstryxDateTimeInput';
type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  label: 'Publish time',
  description: 'Choose the date and local time.',
  placeholder: 'Select date and time',
  defaultValue: '2026-07-27T14:30',
  status: 'none',
  size: 'md',
  width: '100%',
  hasClear: true,
  hasSeconds: false,
  hourFormat: '12h',
  isDisabled: false,
  isLabelHidden: false,
  isLoading: false,
  isOptional: false,
  isRequired: false,
  labelTooltip: '',
  numberOfMonths: 1,
  statusMessage: '',
  timeIncrement: 15,
} as const;
const meta = {
  title: 'Astryx/DateTimeInput', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    status: { control: 'select', options: ['none', 'success', 'warning', 'error'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    width: { control: 'text' },
    hasClear: { control: 'boolean' },
    hasSeconds: { control: 'boolean' },
    hourFormat: { control: 'select', options: ['12h', '24h'] },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
    numberOfMonths: { control: 'select', options: [1, 2] },
    statusMessage: { control: 'text' },
    timeIncrement: { control: 'select', options: [1, 5, 10, 15, 30] },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxDateTimeInput = {
  name: 'AstryxDateTimeInput',
  render: (args: Args) => <Component {...(args as typeof DEFAULT_PROPS)} />,
};
