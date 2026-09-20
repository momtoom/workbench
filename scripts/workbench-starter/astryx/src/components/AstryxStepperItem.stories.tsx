import { AstryxStepper } from './AstryxStepper';
import { AstryxStepperRail } from './AstryxStepperRail';
import {
  AstryxStepperItem as AstryxStepperItemComponent,
  type AstryxStepperItemState,
} from './AstryxStepperItem';

type Args = Record<string, number | string>;

const STATES = ['complete', 'current', 'upcoming'] as const;

const DEFAULT_PROPS = {
  label: 'Step',
  state: 'upcoming',
  step: 1,
} as const;

const meta = {
  title: 'Astryx/StepperItem',
  component: AstryxStepperItemComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    state: { control: 'select', options: STATES },
    step: { control: 'number' },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxStepperItem = {
  name: 'AstryxStepperItem',
  render: (args: Args) => (
    <AstryxStepper label="Stepper item preview">
      <AstryxStepperRail>
        <AstryxStepperItemComponent label="Basics" state="complete" step={1} />
        <AstryxStepperItemComponent
          label={asText(args.label, DEFAULT_PROPS.label)}
          state={asState(args.state)}
          step={asNumber(args.step, DEFAULT_PROPS.step)}
        />
        <AstryxStepperItemComponent label="Publish" state="upcoming" step={5} />
      </AstryxStepperRail>
    </AstryxStepper>
  ),
};

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asState(value: unknown): AstryxStepperItemState {
  return typeof value === 'string' && STATES.includes(value as AstryxStepperItemState)
    ? value as AstryxStepperItemState
    : DEFAULT_PROPS.state;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
