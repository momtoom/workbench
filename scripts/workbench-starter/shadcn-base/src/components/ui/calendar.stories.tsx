import { Calendar as ShadcnCalendar, CalendarDayButton } from './calendar';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  buttonVariant?: boolean | string;
  captionLayout?: boolean | string;
  cellSize?: number | string;
  defaultMonthDate?: boolean | string;
  fixedWeeks?: boolean | string;
  fluid?: boolean | string;
  mode?: boolean | string;
  numberOfMonths?: number | string;
  showOutsideDays?: boolean | string;
  showWeekNumber?: boolean | string;
  selectedDate?: boolean | string;
  timeZone?: boolean | string;
};

const BUTTON_VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;
const CAPTION_LAYOUTS = ['label', 'dropdown', 'dropdown-months', 'dropdown-years'] as const;
const MODES = ['single', 'range'] as const;

const DEFAULT_PROPS = {
  buttonVariant: 'ghost',
  captionLayout: 'label',
  cellSize: 28,
  defaultMonthDate: '2026-06-01',
  fixedWeeks: true,
  fluid: false,
  mode: 'single',
  numberOfMonths: 1,
  selectedDate: '2026-06-21',
  showOutsideDays: true,
  showWeekNumber: false,
  timeZone: '',
} as const;

const meta = {
  title: 'shadcn/Base UI/Calendar',
  component: ShadcnCalendar,
  authoring: {
    group: 'Inputs',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    buttonVariant: { control: 'select', options: BUTTON_VARIANTS },
    captionLayout: { control: 'select', options: CAPTION_LAYOUTS },
    cellSize: { control: { type: 'number', min: 24, max: 56, step: 1 } },
    defaultMonthDate: { control: 'text' },
    fixedWeeks: { control: 'boolean' },
    fluid: { control: 'boolean' },
    mode: { control: 'select', options: MODES },
    numberOfMonths: { control: { type: 'number', min: 1, max: 3, step: 1 } },
    selectedDate: { control: 'text' },
    showOutsideDays: { control: 'boolean' },
    showWeekNumber: { control: 'boolean' },
    timeZone: { control: 'text' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Calendar = {
  name: 'Calendar',
  render: (args: Args) => {
    const buttonVariant = asOption(args.buttonVariant, BUTTON_VARIANTS, 'ghost');
    const captionLayout = asOption(args.captionLayout, CAPTION_LAYOUTS, 'label');
    const cellSize = asNumber(args.cellSize, 28, { min: 24, max: 56 });
    const defaultMonthDate = asText(args.defaultMonthDate, '2026-06-01');
    const fixedWeeks = asBoolean(args.fixedWeeks, true);
    const fluid = asBoolean(args.fluid, false);
    const mode = asOption(args.mode, MODES, 'single');
    const numberOfMonths = asNumber(args.numberOfMonths, 1, { min: 1, max: 3 });
    const showOutsideDays = asBoolean(args.showOutsideDays, true);
    const showWeekNumber = asBoolean(args.showWeekNumber, false);
    const selectedDate = asText(args.selectedDate, '2026-06-21');
    const timeZone = asText(args.timeZone);
    const sharedProps = {
      buttonVariant,
      captionLayout,
      cellSize,
      defaultMonthDate,
      fixedWeeks,
      fluid,
      numberOfMonths,
      showOutsideDays,
      showWeekNumber,
      timeZone: timeZone || undefined,
    };

    if (mode === 'range') {
      return (
        <ShadcnCalendar
          {...sharedProps}
          mode="range"
          defaultMonth={new Date(2026, 5, 1)}
          selected={{ from: new Date(2026, 5, 9), to: new Date(2026, 5, 18) }}
        />
      );
    }

    return (
      <ShadcnCalendar
        {...sharedProps}
        mode="single"
        selectedDate={selectedDate}
      />
    );
  },
};

export const CalendarDayButtonStory = {
  name: 'CalendarDayButton',
  sourceInsert: {},
  render: () => (
    <ShadcnCalendar
      components={{ DayButton: CalendarDayButton }}
      mode="single"
      selected={new Date(2026, 5, 21)}
    />
  ),
};
