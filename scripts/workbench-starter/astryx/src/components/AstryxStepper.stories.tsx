import { AstryxStepper as AstryxStepperComponent } from './AstryxStepper';
import { AstryxStepperItem } from './AstryxStepperItem';
import { AstryxStepperRail } from './AstryxStepperRail';

type Args = Record<string, boolean | string>;

const SIZES = ['sm', 'md'] as const;
const ORIENTATIONS = ['horizontal', 'vertical'] as const;

const DEFAULT_PROPS = {
  label: 'Progress steps',
  orientation: 'horizontal',
  size: 'sm',
  showConnector: true,
} as const;

const meta = {
  title: 'Astryx/Stepper',
  component: AstryxStepperComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    orientation: { control: 'select', options: ORIENTATIONS },
    size: { control: 'select', options: SIZES },
    showConnector: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxStepperRail'],
    group: 'Navigation',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxStepperRail'],
        sourceFile: 'src/components/AstryxStepperRail.tsx',
      },
      {
        names: ['AstryxStepperItem'],
        sourceFile: 'src/components/AstryxStepperItem.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxStepperRail>\n  <AstryxStepperItem label="Basics" state="complete" step={1} />\n  <AstryxStepperItem label="Appearance" state="complete" step={2} />\n  <AstryxStepperItem label="Greeting" state="current" step={3} />\n  <AstryxStepperItem label="Behavior" state="upcoming" step={4} />\n  <AstryxStepperItem label="Publish" state="upcoming" step={5} />\n</AstryxStepperRail>',
  },
};
export default meta;

export const AstryxStepper = {
  name: 'AstryxStepper',
  render: (args: Args) => (
    <AstryxStepperComponent
      label={asText(args.label, DEFAULT_PROPS.label)}
      orientation={asOption(args.orientation, ORIENTATIONS, DEFAULT_PROPS.orientation)}
      showConnector={asBoolean(args.showConnector, DEFAULT_PROPS.showConnector)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
    >
      <AstryxStepperRail>
        <AstryxStepperItem label="Basics" state="complete" step={1} />
        <AstryxStepperItem label="Appearance" state="complete" step={2} />
        <AstryxStepperItem label="Greeting" state="current" step={3} />
        <AstryxStepperItem label="Behavior" state="upcoming" step={4} />
        <AstryxStepperItem label="Publish" state="upcoming" step={5} />
      </AstryxStepperRail>
    </AstryxStepperComponent>
  ),
};

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? value as T : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
