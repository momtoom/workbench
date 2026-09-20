import { Button } from './button';
import {
  HoverCard as ShadcnHoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './hover-card';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  align?: boolean | string;
  children?: boolean | string;
  defaultOpen?: boolean | string;
  side?: boolean | string;
  sideOffset?: number | string;
  trigger?: boolean | string;
};

const ALIGNS = ['start', 'center', 'end'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const DEFAULT_PROPS = {
  defaultOpen: true,
} as const;

const meta = {
  title: 'shadcn/Base UI/Hover Card',
  component: ShadcnHoverCard,
  authoring: {
    group: 'Overlays',
  },
  args: {
    defaultOpen: DEFAULT_PROPS.defaultOpen,
  },
  argTypes: {
    defaultOpen: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['HoverCardContent', 'HoverCardTrigger'],
        sourceFile: 'src/components/ui/hover-card.tsx',
      },
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren:
      '<HoverCardTrigger render={<Button variant="outline" />}>Preview</HoverCardTrigger><HoverCardContent align="center" side="bottom" sideOffset={4}>Hover card content</HoverCardContent>',
    props: {
      defaultOpen: true,
    },
  },
};
export default meta;

export const HoverCard = {
  name: 'HoverCard',
  render: (args: Args) => {
    const defaultOpen = asBoolean(args.defaultOpen, true);
    return (
      <ShadcnHoverCard
        key={String(defaultOpen)}
        defaultOpen={defaultOpen}
      >
        <HoverCardTrigger render={<Button variant="outline" />}>Preview</HoverCardTrigger>
        <HoverCardContent
          align="center"
          side="bottom"
          sideOffset={4}
        >
          Hover card content
        </HoverCardContent>
      </ShadcnHoverCard>
    );
  },
};

export const HoverCardTriggerStory = {
  name: 'HoverCardTrigger',
  sourceInsert: {
    jsxProps: {
      render: '<button type="button" />',
    },
    props: {
      children: 'Preview',
    },
  },
  render: () => (
    <ShadcnHoverCard>
      <HoverCardTrigger render={<Button variant="outline" />}>Preview</HoverCardTrigger>
      <HoverCardContent>Hover card content</HoverCardContent>
    </ShadcnHoverCard>
  ),
};

export const HoverCardContentStory = {
  name: 'HoverCardContent',
  args: {
    children: 'Hover card content',
    align: 'center',
    side: 'bottom',
    sideOffset: 4,
  },
  argTypes: {
    children: { control: 'textarea' },
    align: { control: 'select', options: ALIGNS },
    side: { control: 'select', options: SIDES },
    sideOffset: { control: { type: 'number', min: 0, max: 32, step: 1 } },
  },
  sourceInsert: {
    props: {
      children: 'Hover card content',
      align: 'center',
      side: 'bottom',
      sideOffset: 4,
    },
  },
  render: (args: Args) => (
    <ShadcnHoverCard defaultOpen>
      <HoverCardContent
        align={asOption(args.align, ALIGNS, 'center')}
        side={asOption(args.side, SIDES, 'bottom')}
        sideOffset={asNumber(args.sideOffset, 4, { min: 0, max: 32 })}
      >
        {asText(args.children, 'Hover card content')}
      </HoverCardContent>
    </ShadcnHoverCard>
  ),
};
