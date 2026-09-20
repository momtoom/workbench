import { AstryxButton } from './AstryxButton';
import { AstryxHoverCard as AstryxHoverCardComponent } from './AstryxHoverCard';
import { AstryxHoverCardContent } from './AstryxHoverCardContent';
import { AstryxHoverCardTrigger } from './AstryxHoverCardTrigger';
import { AstryxText } from './AstryxText';
import { AstryxVStack } from './AstryxVStack';

type Args = Record<string, boolean | number | string>;

const PLACEMENTS = ['above', 'below', 'start', 'end'] as const;
const ALIGNMENTS = ['start', 'center', 'end'] as const;
const FOCUS_TRIGGERS = ['auto', 'always', 'never'] as const;
const HOVER_INDICATIONS = ['auto', 'true', 'false'] as const;

const DEFAULT_PROPS = {
  placement: 'above',
  alignment: 'center',
  delay: 300,
  focusTrigger: 'auto',
  hasHoverIndication: 'auto',
  hideDelay: 200,
  isDefaultOpen: false,
  isEnabled: true,
} as const;

const meta = {
  title: 'Astryx/HoverCard',
  component: AstryxHoverCardComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    placement: { control: 'select', options: PLACEMENTS },
    alignment: { control: 'select', options: ALIGNMENTS },
    delay: { control: 'number' },
    focusTrigger: { control: 'select', options: FOCUS_TRIGGERS },
    hasHoverIndication: { control: 'select', options: HOVER_INDICATIONS },
    hideDelay: { control: 'number' },
    isDefaultOpen: { control: 'boolean' },
    isEnabled: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxHoverCardTrigger', 'AstryxHoverCardContent'],
    group: 'Overlays',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
      { names: ['AstryxHoverCardContent'], sourceFile: 'src/components/AstryxHoverCardContent.tsx' },
      { names: ['AstryxHoverCardTrigger'], sourceFile: 'src/components/AstryxHoverCardTrigger.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
      { names: ['AstryxVStack'], sourceFile: 'src/components/AstryxVStack.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxHoverCardTrigger><AstryxButton label="Hover preview" /></AstryxHoverCardTrigger>\n<AstryxHoverCardContent><AstryxVStack gap="xs"><AstryxText as="span" type="label">Component preview</AstryxText><AstryxText as="p" color="secondary" type="supporting">Hover content is an editable child slot.</AstryxText></AstryxVStack></AstryxHoverCardContent>',
  },
};
export default meta;

export const AstryxHoverCard = {
  name: 'AstryxHoverCard',
  render: (args: Args) => (
    <AstryxHoverCardComponent
      alignment={asOption(args.alignment, ALIGNMENTS, DEFAULT_PROPS.alignment)}
      delay={asNumber(args.delay, DEFAULT_PROPS.delay)}
      focusTrigger={asOption(args.focusTrigger, FOCUS_TRIGGERS, DEFAULT_PROPS.focusTrigger)}
      hasHoverIndication={asOption(args.hasHoverIndication, HOVER_INDICATIONS, DEFAULT_PROPS.hasHoverIndication)}
      hideDelay={asNumber(args.hideDelay, DEFAULT_PROPS.hideDelay)}
      isDefaultOpen={asBoolean(args.isDefaultOpen)}
      isEnabled={asBoolean(args.isEnabled)}
      placement={asOption(args.placement, PLACEMENTS, DEFAULT_PROPS.placement)}
    >
      <AstryxHoverCardTrigger>
        <AstryxButton label="Hover preview" />
      </AstryxHoverCardTrigger>
      <AstryxHoverCardContent>
        <AstryxVStack gap="xs">
          <AstryxText as="span" type="label">
            Component preview
          </AstryxText>
          <AstryxText as="p" color="secondary" type="supporting">
            Hover content is an editable child slot.
          </AstryxText>
        </AstryxVStack>
      </AstryxHoverCardContent>
    </AstryxHoverCardComponent>
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
