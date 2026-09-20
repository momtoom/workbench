import { DatePicker as ShadcnDatePicker } from './date-picker';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  align?: boolean | string;
  buttonVariant?: boolean | string;
  captionLayout?: boolean | string;
  defaultValue?: boolean | string;
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
  placeholder: 'Pick a date',
  defaultValue: '2026-06-21',
  disabled: false,
  variant: 'outline',
  align: 'start',
  buttonVariant: 'ghost',
  captionLayout: 'label',
  defaultOpen: false,
  formatPattern: 'PPP',
  numberOfMonths: 1,
  showOutsideDays: true,
  side: 'bottom',
} as const;

const meta = {
  title: 'shadcn/Base UI/Date Picker',
  component: ShadcnDatePicker,
  authoring: {
    group: 'Inputs',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    variant: { control: 'select', options: BUTTON_VARIANTS },
    align: { control: 'select', options: ALIGNS },
    buttonVariant: { control: 'select', options: BUTTON_VARIANTS },
    captionLayout: { control: 'select', options: CAPTION_LAYOUTS },
    defaultOpen: { control: 'boolean' },
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

export const DatePicker = {
  name: 'DatePicker',
  render: (args: Args) => (
    <ShadcnDatePicker
      align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
      buttonVariant={asOption(args.buttonVariant, BUTTON_VARIANTS, DEFAULT_PROPS.buttonVariant)}
      captionLayout={asOption(args.captionLayout, CAPTION_LAYOUTS, DEFAULT_PROPS.captionLayout)}
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
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
