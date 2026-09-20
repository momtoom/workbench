import { AstryxButton } from './AstryxButton';
import { AstryxPopover as AstryxPopoverComponent } from './AstryxPopover';
import { AstryxPopoverContent } from './AstryxPopoverContent';
import { AstryxPopoverTrigger } from './AstryxPopoverTrigger';
import { AstryxText } from './AstryxText';
import { AstryxVStack } from './AstryxVStack';

type Args = Record<string, boolean | number | string>;

const PLACEMENTS = ['above', 'below', 'start', 'end'] as const;
const ALIGNMENTS = ['start', 'center', 'end'] as const;

const DEFAULT_PROPS = {
  label: 'Quick settings',
  placement: 'below',
  width: '280px',
  alignment: 'start',
  closeButtonLabel: 'Close popover',
  hasAutoFocus: false,
  hasCloseButton: true,
  isDefaultOpen: false,
  isEnabled: true,
} as const;

const meta = {
  title: 'Astryx/Popover',
  component: AstryxPopoverComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    placement: { control: 'select', options: PLACEMENTS },
    width: { control: 'text' },
    alignment: { control: 'select', options: ALIGNMENTS },
    closeButtonLabel: { control: 'text' },
    hasAutoFocus: { control: 'boolean' },
    hasCloseButton: { control: 'boolean' },
    isDefaultOpen: { control: 'boolean' },
    isEnabled: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxPopoverTrigger', 'AstryxPopoverContent'],
    group: 'Overlays',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
      { names: ['AstryxPopoverContent'], sourceFile: 'src/components/AstryxPopoverContent.tsx' },
      { names: ['AstryxPopoverTrigger'], sourceFile: 'src/components/AstryxPopoverTrigger.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
      { names: ['AstryxVStack'], sourceFile: 'src/components/AstryxVStack.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxPopoverTrigger><AstryxButton label="Open popover" /></AstryxPopoverTrigger>\n<AstryxPopoverContent><AstryxVStack gap="xs"><AstryxText as="span" type="label">Quick settings</AstryxText><AstryxText as="p" color="secondary" type="supporting">Popover content is an editable child slot.</AstryxText></AstryxVStack></AstryxPopoverContent>',
  },
};
export default meta;

export const AstryxPopover = {
  name: 'AstryxPopover',
  render: (args: Args) => (
    <AstryxPopoverComponent
      alignment={asOption(args.alignment, ALIGNMENTS, DEFAULT_PROPS.alignment)}
      closeButtonLabel={asText(args.closeButtonLabel, DEFAULT_PROPS.closeButtonLabel)}
      hasAutoFocus={asBoolean(args.hasAutoFocus)}
      hasCloseButton={asBoolean(args.hasCloseButton)}
      isDefaultOpen={asBoolean(args.isDefaultOpen)}
      isEnabled={asBoolean(args.isEnabled)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      placement={asOption(args.placement, PLACEMENTS, DEFAULT_PROPS.placement)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxPopoverTrigger>
        <AstryxButton label="Open popover" />
      </AstryxPopoverTrigger>
      <AstryxPopoverContent>
        <AstryxVStack gap="xs">
          <AstryxText as="span" type="label">
            Quick settings
          </AstryxText>
          <AstryxText as="p" color="secondary" type="supporting">
            Popover content is an editable child slot.
          </AstryxText>
        </AstryxVStack>
      </AstryxPopoverContent>
    </AstryxPopoverComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
