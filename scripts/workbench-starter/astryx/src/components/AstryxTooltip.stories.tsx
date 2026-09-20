import { AstryxButton } from './AstryxButton';
import { AstryxTooltip as AstryxTooltipComponent } from './AstryxTooltip';

type Args = Record<string, boolean | number | string>;

const PLACEMENTS = ['above', 'below', 'start', 'end'] as const;
const ALIGNMENTS = ['start', 'center', 'end'] as const;
const FOCUS_TRIGGERS = ['auto', 'always', 'never'] as const;
const HOVER_INDICATIONS = ['auto', 'true', 'false'] as const;

const DEFAULT_PROPS = {
  placement: 'above',
  alignment: 'center',
  content: 'Short helper text',
  delay: 200,
  focusTrigger: 'auto',
  hasHoverIndication: 'auto',
  hideDelay: 0,
  isDefaultOpen: false,
  isEnabled: true,
} as const;

const meta = {
  title: 'Astryx/Tooltip',
  component: AstryxTooltipComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    placement: { control: 'select', options: PLACEMENTS },
    alignment: { control: 'select', options: ALIGNMENTS },
    content: { control: 'text' },
    delay: { control: 'number' },
    focusTrigger: { control: 'select', options: FOCUS_TRIGGERS },
    hasHoverIndication: { control: 'select', options: HOVER_INDICATIONS },
    hideDelay: { control: 'number' },
    isDefaultOpen: { control: 'boolean' },
    isEnabled: { control: 'boolean' },
  },
  authoring: {
    group: 'Overlays',
  },
  sourceInsert: {
    imports: [{ names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxButton label="Hover for tooltip" />',
  },
};
export default meta;

export const AstryxTooltip = {
  name: 'AstryxTooltip',
  render: (args: Args) => (
    <AstryxTooltipComponent
      alignment={asOption(args.alignment, ALIGNMENTS, DEFAULT_PROPS.alignment)}
      content={asText(args.content, DEFAULT_PROPS.content)}
      delay={asNumber(args.delay, DEFAULT_PROPS.delay)}
      focusTrigger={asOption(args.focusTrigger, FOCUS_TRIGGERS, DEFAULT_PROPS.focusTrigger)}
      hasHoverIndication={asOption(args.hasHoverIndication, HOVER_INDICATIONS, DEFAULT_PROPS.hasHoverIndication)}
      hideDelay={asNumber(args.hideDelay, DEFAULT_PROPS.hideDelay)}
      isDefaultOpen={asBoolean(args.isDefaultOpen)}
      isEnabled={asBoolean(args.isEnabled)}
      placement={asOption(args.placement, PLACEMENTS, DEFAULT_PROPS.placement)}
    >
      <AstryxButton label="Hover for tooltip" />
    </AstryxTooltipComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
