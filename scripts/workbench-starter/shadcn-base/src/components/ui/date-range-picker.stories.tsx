import { DateRangePicker as ShadcnDateRangePicker } from './date-range-picker';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  align?: boolean | string;
  buttonVariant?: boolean | string;
  captionLayout?: boolean | string;
  defaultFrom?: boolean | string;
  defaultTo?: boolean | string;
  defaultOpen?: boolean | string;
  disabled?: boolean | string;
  formatPattern?: boolean | string;
  numberOfMonths?: number | string;
  placeholder?: boolean | string;
  showOutsideDays?: boolean | string;
  side?: boolean | string;
  variant?: boolean | string;
};

const ALIGNS = ['start', 'center', 'end'] as const;
const BUTTON_VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;
const CAPTION_LAYOUTS = ['label', 'dropdown', 'dropdown-months', 'dropdown-years'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const DEFAULT_PROPS = {
  placeholder: 'Pick a date range',
  disabled: false,
  variant: 'outline',
  align: 'start',
  buttonVariant: 'ghost',
  captionLayout: 'label',
  defaultFrom: '2026-06-09',
  defaultOpen: false,
  defaultTo: '2026-06-18',
  formatPattern: 'LLL dd, y',
  numberOfMonths: 2,
  showOutsideDays: true,
  side: 'bottom',
} as const;

const meta = {
  title: 'shadcn/Base UI/Date Range Picker',
  component: ShadcnDateRangePicker,
  authoring: {
    group: 'Inputs',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    variant: { control: 'select', options: BUTTON_VARIANTS },
    align: { control: 'select', options: ALIGNS },
    buttonVariant: { control: 'select', options: BUTTON_VARIANTS },
    captionLayout: { control: 'select', options: CAPTION_LAYOUTS },
    defaultFrom: { control: 'text' },
    defaultOpen: { control: 'boolean' },
    defaultTo: { control: 'text' },
    formatPattern: { control: 'text' },
    numberOfMonths: { control: { type: 'number', min: 1, max: 3, step: 1 } },
    showOutsideDays: { control: 'boolean' },
    side: { control: 'select', options: SIDES },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const DateRangePicker = {
  name: 'DateRangePicker',
  render: (args: Args) => (
    <ShadcnDateRangePicker
      align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
      buttonVariant={asOption(args.buttonVariant, BUTTON_VARIANTS, DEFAULT_PROPS.buttonVariant)}
      captionLayout={asOption(args.captionLayout, CAPTION_LAYOUTS, DEFAULT_PROPS.captionLayout)}
      defaultFrom={asText(args.defaultFrom, DEFAULT_PROPS.defaultFrom)}
      defaultTo={asText(args.defaultTo, DEFAULT_PROPS.defaultTo)}
      defaultOpen={asBoolean(args.defaultOpen, DEFAULT_PROPS.defaultOpen)}
      disabled={asBoolean(args.disabled, DEFAULT_PROPS.disabled)}
      formatPattern={asText(args.formatPattern, DEFAULT_PROPS.formatPattern)}
      numberOfMonths={asNumber(args.numberOfMonths, DEFAULT_PROPS.numberOfMonths, { min: 1, max: 3 })}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
      showOutsideDays={asBoolean(args.showOutsideDays, DEFAULT_PROPS.showOutsideDays)}
      side={asOption(args.side, SIDES, DEFAULT_PROPS.side)}
      variant={asOption(args.variant, BUTTON_VARIANTS, DEFAULT_PROPS.variant)}
    />
  ),
};
