import { AstryxDateRangeInput as Component } from './AstryxDateRangeInput';
import { AstryxDateRangePreset } from './AstryxDateRangePreset';

type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  label: 'Project window',
  description: 'Choose a start and end date.',
  placeholder: 'Select a date range',
  status: 'none',
  size: 'md',
  width: '360px',
  defaultEnd: '2026-08-02',
  defaultStart: '2026-07-27',
  hasClear: true,
  hasPresets: true,
  isDisabled: false,
  isLabelHidden: false,
  isLoading: false,
  isOptional: false,
  isRequired: false,
  labelTooltip: '',
  max: '',
  min: '',
  numberOfMonths: 2,
  statusMessage: '',
} as const;
const meta = {
  title: 'Astryx/DateRangeInput', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    status: { control: 'select', options: ['none', 'success', 'warning', 'error'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    width: { control: 'text' },
    defaultEnd: { control: 'text' },
    defaultStart: { control: 'text' },
    hasClear: { control: 'boolean' },
    hasPresets: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
    max: { control: 'text' },
    min: { control: 'text' },
    numberOfMonths: { control: 'select', options: [1, 2] },
    statusMessage: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxDateRangePreset'],
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [{ names: ['AstryxDateRangePreset'], sourceFile: 'src/components/AstryxDateRangePreset.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxDateRangePreset end="2026-08-02" label="Launch week" start="2026-07-27" />\n<AstryxDateRangePreset end="2026-08-31" label="August" start="2026-08-01" />',
  },
};
export default meta;
export const AstryxDateRangeInput = {
  name: 'AstryxDateRangeInput',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxDateRangePreset end="2026-08-02" label="Launch week" start="2026-07-27" />
      <AstryxDateRangePreset end="2026-08-31" label="August" start="2026-08-01" />
    </Component>
  ),
};
