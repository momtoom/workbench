import { Button } from './button';
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
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
  title: 'shadcn/Base UI/Tooltip',
  component: ShadcnTooltip,
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
        names: ['TooltipContent', 'TooltipTrigger'],
        sourceFile: 'src/components/ui/tooltip.tsx',
      },
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren:
      '<TooltipTrigger render={<Button size="sm" variant="outline" />}>Hover me</TooltipTrigger><TooltipContent align="center" side="top" sideOffset={4}>Tooltip content</TooltipContent>',
    props: {
      defaultOpen: true,
    },
  },
};
export default meta;

export const Tooltip = {
  name: 'Tooltip',
  render: (args: Args) => {
    const defaultOpen = asBoolean(args.defaultOpen, true);
    return (
      <TooltipProvider delay={0}>
        <ShadcnTooltip
          key={String(defaultOpen)}
          defaultOpen={defaultOpen}
        >
          <TooltipTrigger render={<Button size="sm" variant="outline" />}>Hover me</TooltipTrigger>
          <TooltipContent
            align="center"
            side="top"
            sideOffset={4}
          >
            Tooltip content
          </TooltipContent>
        </ShadcnTooltip>
      </TooltipProvider>
    );
  },
};

export const TooltipProviderStory = {
  name: 'TooltipProvider',
  sourceInsert: {
    imports: [
      {
        names: ['Tooltip', 'TooltipTrigger', 'TooltipContent'],
        sourceFile: 'src/components/ui/tooltip.tsx',
      },
    ],
    jsxChildren:
      '<Tooltip defaultOpen><TooltipTrigger render={<button type="button" />}>Hover me</TooltipTrigger><TooltipContent>Tooltip content</TooltipContent></Tooltip>',
    props: {
      delay: 0,
    },
  },
  render: () => (
    <TooltipProvider delay={0}>
      <ShadcnTooltip defaultOpen>
        <TooltipTrigger render={<Button size="sm" variant="outline" />}>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip content</TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  ),
};

export const TooltipTriggerStory = {
  name: 'TooltipTrigger',
  sourceInsert: {
    jsxProps: {
      render: '<button type="button" />',
    },
    props: {
      children: 'Hover me',
    },
  },
  render: () => (
    <TooltipProvider delay={0}>
      <ShadcnTooltip defaultOpen>
        <TooltipTrigger render={<Button size="sm" variant="outline" />}>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip content</TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  ),
};

export const TooltipContentStory = {
  name: 'TooltipContent',
  args: {
    children: 'Tooltip content',
    align: 'center',
    side: 'top',
    sideOffset: 4,
  },
  argTypes: {
    children: { control: 'text' },
    align: { control: 'select', options: ALIGNS },
    side: { control: 'select', options: SIDES },
    sideOffset: { control: { type: 'number', min: 0, max: 32, step: 1 } },
  },
  sourceInsert: {
    props: {
      children: 'Tooltip content',
      align: 'center',
      side: 'top',
      sideOffset: 4,
    },
  },
  render: (args: Args) => (
    <TooltipProvider delay={0}>
      <ShadcnTooltip defaultOpen>
        <TooltipTrigger render={<Button size="sm" variant="outline" />}>Hover me</TooltipTrigger>
        <TooltipContent
          align={asOption(args.align, ALIGNS, 'center')}
          side={asOption(args.side, SIDES, 'top')}
          sideOffset={asNumber(args.sideOffset, 4, { min: 0, max: 32 })}
        >
          {asText(args.children, 'Tooltip content')}
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  ),
};
