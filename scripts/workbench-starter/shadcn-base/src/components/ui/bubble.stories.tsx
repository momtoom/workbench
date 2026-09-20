import { Button } from './button';
import {
  Bubble as ShadcnBubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from './bubble';
import { asOption } from './story-utils';

type Args = {
  align?: boolean | string;
  side?: boolean | string;
  variant?: boolean | string;
};

const ALIGNS = ['start', 'end'] as const;
const REACTION_SIDES = ['top', 'bottom'] as const;
const VARIANTS = ['default', 'secondary', 'muted', 'tinted', 'outline', 'ghost', 'destructive'] as const;

const DEFAULT_PROPS = {
  variant: 'secondary',
  align: 'start',
} as const;

const DEFAULT_BUBBLE_TEXT = 'Can you review this update?';

const meta = {
  title: 'shadcn/Base UI/Bubble',
  component: ShadcnBubble,
  authoring: {
    group: 'Chat',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    align: { control: 'select', options: ALIGNS },
  },
  sourceInsert: {
    imports: [
      {
        names: ['BubbleContent'],
        sourceFile: 'src/components/ui/bubble.tsx',
      },
    ],
    jsxChildren: '<BubbleContent>Can you review this update?</BubbleContent>',
    props: {
      variant: 'secondary',
      align: 'start',
    },
  },
};
export default meta;

export const Bubble = {
  name: 'Bubble',
  render: (args: Args) => (
    <ShadcnBubble
      align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    >
      <BubbleContent>{DEFAULT_BUBBLE_TEXT}</BubbleContent>
    </ShadcnBubble>
  ),
};

export const BubbleGroupStory = {
  name: 'BubbleGroup',
  sourceInsert: {
    imports: [
      {
        names: ['Bubble', 'BubbleContent'],
        sourceFile: 'src/components/ui/bubble.tsx',
      },
    ],
    jsxChildren:
      '<Bubble variant="secondary"><BubbleContent>Can you review this update?</BubbleContent></Bubble><Bubble align="end"><BubbleContent>Looks good to me.</BubbleContent></Bubble>',
  },
  render: () => (
    <BubbleGroup>
      <ShadcnBubble variant="secondary"><BubbleContent>Can you review this update?</BubbleContent></ShadcnBubble>
      <ShadcnBubble align="end"><BubbleContent>Looks good to me.</BubbleContent></ShadcnBubble>
    </BubbleGroup>
  ),
};

export const BubbleContentStory = {
  name: 'BubbleContent',
  sourceInsert: {
    props: {
      children: 'Can you review this update?',
    },
  },
  render: () => <ShadcnBubble variant="secondary"><BubbleContent>Can you review this update?</BubbleContent></ShadcnBubble>,
};

export const BubbleReactionsStory = {
  name: 'BubbleReactions',
  args: {
    align: 'end',
    side: 'bottom',
  },
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    side: { control: 'select', options: REACTION_SIDES },
  },
  sourceInsert: {
    props: {
      children: '👍',
      align: 'end',
      side: 'bottom',
    },
  },
  render: (args: Args) => (
    <ShadcnBubble variant="secondary">
      <BubbleContent>Can you review this update?</BubbleContent>
      <BubbleReactions
        align={asOption(args.align, ALIGNS, 'end')}
        side={asOption(args.side, REACTION_SIDES, 'bottom')}
      >
        👍
      </BubbleReactions>
    </ShadcnBubble>
  ),
};

export const BubbleAction = {
  name: 'Bubble action',
  sourceInsert: {
    imports: [
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxProps: {
      asChild: 'true',
    },
    jsxChildren: '<Button variant="ghost">Open details</Button>',
    props: {
      variant: 'ghost',
    },
  },
  render: (args: Args) => (
    <ShadcnBubble
      align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
      variant={asOption(args.variant, VARIANTS, 'ghost')}
    >
      <BubbleContent asChild>
        <Button variant="ghost">Open details</Button>
      </BubbleContent>
    </ShadcnBubble>
  ),
};
