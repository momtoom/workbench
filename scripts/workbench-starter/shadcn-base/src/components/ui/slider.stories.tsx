import { Slider } from './slider';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  defaultValue?: boolean | string;
  disabled?: boolean | string;
  max?: boolean | number | string;
  min?: boolean | number | string;
  orientation?: boolean | string;
  step?: boolean | number | string;
};

const ORIENTATIONS = ['horizontal', 'vertical'] as const;

const DEFAULT_PROPS = {
  defaultValue: '48',
  disabled: false,
  orientation: 'horizontal',
  max: 100,
  min: 0,
  step: 1,
} as const;

const meta = {
  title: 'shadcn/Base UI/Slider',
  component: Slider,
  authoring: {
    group: 'Inputs',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    orientation: { control: 'select', options: ORIENTATIONS },
    max: { control: { step: 1, type: 'number' } },
    min: { control: { step: 1, type: 'number' } },
    step: { control: { min: 1, step: 1, type: 'number' } },
  },
  sourceInsert: {
    props: {
      defaultValue: '48',
      disabled: false,
      orientation: 'horizontal',
      className: 'w-64',
      max: 100,
      min: 0,
      step: 1,
    },
  },
};
export default meta;

export const Default = {
  name: 'Slider',
  render: (args: Args) => {
    const min = asNumber(args.min, 0);
    const max = Math.max(min + 1, asNumber(args.max, 100));
    const step = asNumber(args.step, 1, { min: 1 });
    const orientation = asOption(args.orientation, ORIENTATIONS, 'horizontal');
    const defaultValue = asText(args.defaultValue, '48');
    return (
      <Slider
        key={[defaultValue, orientation, min, max, step].join('-')}
        className={orientation === 'vertical' ? 'h-40' : 'w-[min(22rem,100%)]'}
        defaultValue={defaultValue}
        disabled={asBoolean(args.disabled)}
        max={max}
        min={min}
        orientation={orientation}
        step={step}
      />
    );
  },
};

export const RangeSlider = {
  name: 'Slider / range',
  args: {
    defaultValue: '28,72',
  },
  sourceInsert: {
    props: {
      defaultValue: '28,72',
      orientation: 'horizontal',
      className: 'w-64',
      max: 100,
      min: 0,
      step: 1,
    },
  },
  render: (args: Args) => {
    const min = asNumber(args.min, 0);
    const max = Math.max(min + 1, asNumber(args.max, 100));
    const step = asNumber(args.step, 1, { min: 1 });
    const orientation = asOption(args.orientation, ORIENTATIONS, 'horizontal');
    const defaultValue = asText(args.defaultValue, '28,72');
    return (
      <Slider
        key={[defaultValue, orientation, min, max, step].join('-')}
        className="w-64"
        defaultValue={defaultValue}
        disabled={asBoolean(args.disabled)}
        max={max}
        min={min}
        orientation={orientation}
        step={step}
      />
    );
  },
};

export const DisabledSlider = {
  name: 'Slider / disabled',
  args: {
    defaultValue: '42',
    disabled: true,
  },
  sourceInsert: {
    props: {
      defaultValue: '42',
      disabled: true,
      className: 'w-64',
    },
  },
  render: (args: Args) => {
    const min = asNumber(args.min, 0);
    const max = Math.max(min + 1, asNumber(args.max, 100));
    const step = asNumber(args.step, 1, { min: 1 });
    const orientation = asOption(args.orientation, ORIENTATIONS, 'horizontal');
    const defaultValue = asText(args.defaultValue, '42');
    return (
      <Slider
        key={[defaultValue, orientation, min, max, step].join('-')}
        className="w-64"
        defaultValue={defaultValue}
        disabled={asBoolean(args.disabled, true)}
        max={max}
        min={min}
        orientation={orientation}
        step={step}
      />
    );
  },
};

export const VerticalSlider = {
  name: 'Slider / vertical',
  args: {
    defaultValue: '64',
    orientation: 'vertical',
  },
  sourceInsert: {
    props: {
      defaultValue: '64',
      orientation: 'vertical',
      className: 'h-40',
    },
  },
  render: (args: Args) => {
    const min = asNumber(args.min, 0);
    const max = Math.max(min + 1, asNumber(args.max, 100));
    const step = asNumber(args.step, 1, { min: 1 });
    const orientation = asOption(args.orientation, ORIENTATIONS, 'vertical');
    const defaultValue = asText(args.defaultValue, '64');
    return (
      <Slider
        key={[defaultValue, orientation, min, max, step].join('-')}
        className="h-40"
        defaultValue={defaultValue}
        disabled={asBoolean(args.disabled)}
        max={max}
        min={min}
        orientation={orientation}
        step={step}
      />
    );
  },
};
