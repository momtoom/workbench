import { AstryxCalendar as AstryxCalendarComponent } from './AstryxCalendar';

type Args = Record<string, boolean | number | string>;

const DEFAULT_PROPS = {
  defaultValue: '2026-07-27',
  defaultRangeEnd: '2026-08-02',
  defaultRangeStart: '2026-07-27',
  focusDate: '',
  hasOutsideDays: true,
  hasVariableRowCount: false,
  hasWeekNumbers: false,
  max: '',
  min: '',
  mode: 'single',
  numberOfMonths: 1,
  weekStartsOn: 'sun',
} as const;

const meta = {
  title: 'Astryx/Calendar',
  component: AstryxCalendarComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'text' },
    defaultRangeEnd: { control: 'text' },
    defaultRangeStart: { control: 'text' },
    focusDate: { control: 'text' },
    hasOutsideDays: { control: 'boolean' },
    hasVariableRowCount: { control: 'boolean' },
    hasWeekNumbers: { control: 'boolean' },
    max: { control: 'text' },
    min: { control: 'text' },
    mode: { control: 'select', options: ['single', 'range'] },
    numberOfMonths: { control: 'select', options: [1, 2] },
    weekStartsOn: { control: 'select', options: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
  },
  authoring: {
    group: 'Inputs',
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;

export const AstryxCalendar = {
  name: 'AstryxCalendar',
  render: (args: Args) => (
    <AstryxCalendarComponent
      defaultRangeEnd={text(args.defaultRangeEnd, DEFAULT_PROPS.defaultRangeEnd)}
      defaultRangeStart={text(args.defaultRangeStart, DEFAULT_PROPS.defaultRangeStart)}
      defaultValue={text(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      focusDate={text(args.focusDate)}
      hasOutsideDays={bool(args.hasOutsideDays)}
      hasVariableRowCount={bool(args.hasVariableRowCount)}
      hasWeekNumbers={bool(args.hasWeekNumbers)}
      max={text(args.max)}
      min={text(args.min)}
      mode={args.mode === 'range' ? 'range' : 'single'}
      numberOfMonths={Number(args.numberOfMonths) === 2 ? 2 : 1}
      weekStartsOn={weekStart(args.weekStartsOn)}
    />
  ),
};

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}
function bool(value: unknown) {
  return typeof value === 'boolean' ? value : value === 'true';
}
function weekStart(value: unknown): 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' {
  return typeof value === 'string' && ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].includes(value)
    ? (value as 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat')
    : 'sun';
}
