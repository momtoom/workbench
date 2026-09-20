import { Button } from './button';
import {
  Popover as ShadcnPopover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover';
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
  title: 'shadcn/Base UI/Popover',
  component: ShadcnPopover,
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
        names: [
          'PopoverContent',
          'PopoverDescription',
          'PopoverHeader',
          'PopoverTitle',
          'PopoverTrigger',
        ],
        sourceFile: 'src/components/ui/popover.tsx',
      },
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren:
      '<PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger><PopoverContent align="center" side="bottom" sideOffset={4}><PopoverHeader><PopoverTitle>Popover title</PopoverTitle><PopoverDescription>Popover description</PopoverDescription></PopoverHeader></PopoverContent>',
    props: {
      defaultOpen: true,
    },
  },
};
export default meta;

export const Popover = {
  name: 'Popover',
  render: (args: Args) => {
    const defaultOpen = asBoolean(args.defaultOpen, true);
    return (
      <ShadcnPopover
        key={String(defaultOpen)}
        defaultOpen={defaultOpen}
      >
        <PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger>
        <PopoverContent
          align="center"
          side="bottom"
          sideOffset={4}
        >
          <PopoverHeader>
            <PopoverTitle>Popover title</PopoverTitle>
            <PopoverDescription>Popover description</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </ShadcnPopover>
    );
  },
};

export const PopoverTriggerStory = {
  name: 'PopoverTrigger',
  sourceInsert: {
    jsxProps: {
      render: '<button type="button" />',
    },
    props: {
      children: 'Open popover',
    },
  },
  render: () => (
    <ShadcnPopover>
      <PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger>
      <PopoverContent>Popover content</PopoverContent>
    </ShadcnPopover>
  ),
};

export const PopoverContentStory = {
  name: 'PopoverContent',
  args: {
    align: 'center',
    side: 'bottom',
    sideOffset: 4,
  },
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    side: { control: 'select', options: SIDES },
    sideOffset: { control: { type: 'number', min: 0, max: 32, step: 1 } },
  },
  sourceInsert: {
    imports: [
      {
        names: ['PopoverHeader', 'PopoverTitle', 'PopoverDescription'],
        sourceFile: 'src/components/ui/popover.tsx',
      },
    ],
    jsxChildren:
      '<PopoverHeader><PopoverTitle>Popover title</PopoverTitle><PopoverDescription>Popover description</PopoverDescription></PopoverHeader>',
    props: {
      align: 'center',
      side: 'bottom',
      sideOffset: 4,
    },
  },
  render: (args: Args) => (
    <ShadcnPopover defaultOpen>
      <PopoverContent
        align={asOption(args.align, ALIGNS, 'center')}
        side={asOption(args.side, SIDES, 'bottom')}
        sideOffset={asNumber(args.sideOffset, 4, { min: 0, max: 32 })}
      >
        <PopoverHeader>
          <PopoverTitle>Popover title</PopoverTitle>
          <PopoverDescription>Popover description</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </ShadcnPopover>
  ),
};

export const PopoverHeaderStory = {
  name: 'PopoverHeader',
  sourceInsert: {
    imports: [
      {
        names: ['PopoverTitle', 'PopoverDescription'],
        sourceFile: 'src/components/ui/popover.tsx',
      },
    ],
    jsxChildren:
      '<PopoverTitle>Popover title</PopoverTitle><PopoverDescription>Popover description</PopoverDescription>',
  },
  render: () => (
    <PopoverHeader>
      <PopoverTitle>Popover title</PopoverTitle>
      <PopoverDescription>Popover description</PopoverDescription>
    </PopoverHeader>
  ),
};

export const PopoverTitleStory = {
  name: 'PopoverTitle',
  sourceInsert: {
    props: {
      children: 'Popover title',
    },
  },
  render: () => <PopoverTitle>Popover title</PopoverTitle>,
};

export const PopoverDescriptionStory = {
  name: 'PopoverDescription',
  sourceInsert: {
    props: {
      children: 'Popover description',
    },
  },
  render: () => <PopoverDescription>Popover description</PopoverDescription>,
};
