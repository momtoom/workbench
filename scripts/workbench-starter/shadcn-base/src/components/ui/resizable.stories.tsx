import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSplit,
} from './resizable';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  className?: boolean | string;
  children?: boolean | string;
  defaultSize?: number | string;
  orientation?: boolean | string;
  withHandle?: boolean | string;
};

const ORIENTATIONS = ['horizontal', 'vertical'] as const;

const DEFAULT_PROPS = {
  orientation: 'horizontal',
  className: 'h-40 rounded-lg border',
  withHandle: true,
} as const;

const meta = {
  title: 'shadcn/Base UI/Resizable',
  component: ResizableSplit,
  authoring: {
    group: 'Layout',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    orientation: { control: 'select', options: ORIENTATIONS },
    className: { control: 'text' },
    withHandle: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ResizablePanel'],
        sourceFile: 'src/components/ui/resizable.tsx',
      },
    ],
    jsxChildren:
      '<ResizablePanel defaultSize={55}>Preview</ResizablePanel><ResizablePanel defaultSize={45}>Inspector</ResizablePanel>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Resizable = {
  name: 'ResizableSplit',
  render: (args: Args) => {
    const orientation = asOption(args.orientation, ORIENTATIONS, 'horizontal');
    return (
      <ResizableSplit
        className={asText(args.className, 'h-40 w-[min(28rem,100%)] rounded-lg border')}
        orientation={orientation}
        withHandle={asBoolean(args.withHandle, true)}
      >
        <ResizablePanel defaultSize={55}>
          <div className="flex h-full items-center justify-center text-sm font-medium">Preview</div>
        </ResizablePanel>
        <ResizablePanel defaultSize={45}>
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Inspector</div>
        </ResizablePanel>
      </ResizableSplit>
    );
  },
};

export const ResizableSplitStory = {
  name: 'ResizableSplit',
  args: {
    orientation: 'horizontal',
    withHandle: true,
  },
  argTypes: {
    orientation: { control: 'select', options: ORIENTATIONS },
    withHandle: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ResizablePanel'],
        sourceFile: 'src/components/ui/resizable.tsx',
      },
    ],
    jsxChildren: '<ResizablePanel defaultSize={55}>Preview</ResizablePanel><ResizablePanel defaultSize={45}>Inspector</ResizablePanel>',
    props: {
      orientation: 'horizontal',
      className: 'h-40 rounded-lg border',
      withHandle: true,
    },
  },
  render: (args: Args) => (
    <ResizableSplit
      className={asText(args.className, 'h-40 w-[min(28rem,100%)] rounded-lg border')}
      orientation={asOption(args.orientation, ORIENTATIONS, 'horizontal')}
      withHandle={asBoolean(args.withHandle, true)}
    >
      <ResizablePanel defaultSize={55}>Preview</ResizablePanel>
      <ResizablePanel defaultSize={45}>Inspector</ResizablePanel>
    </ResizableSplit>
  ),
};

export const ResizablePanelGroupStory = {
  name: 'ResizablePanelGroup',
  args: {
    orientation: 'horizontal',
    className: 'h-40 rounded-lg border',
  },
  argTypes: {
    orientation: { control: 'select', options: ORIENTATIONS },
    className: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ResizablePanel', 'ResizableHandle'],
        sourceFile: 'src/components/ui/resizable.tsx',
      },
    ],
    jsxChildren: '<ResizablePanel defaultSize={50}>Panel 1</ResizablePanel><ResizableHandle /><ResizablePanel defaultSize={50}>Panel 2</ResizablePanel>',
    props: {
      orientation: 'horizontal',
      className: 'h-40 rounded-lg border',
    },
  },
  render: (args: Args) => (
    <ResizablePanelGroup
      className={asText(args.className, 'h-40 w-[min(28rem,100%)] rounded-lg border')}
      orientation={asOption(args.orientation, ORIENTATIONS, 'horizontal')}
    >
      <ResizablePanel defaultSize={50}>Panel 1</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>Panel 2</ResizablePanel>
    </ResizablePanelGroup>
  ),
};

export const ResizablePanelStory = {
  name: 'ResizablePanel',
  args: {
    children: 'Panel',
    defaultSize: 50,
  },
  argTypes: {
    children: { control: 'text' },
    defaultSize: { control: { type: 'number', min: 10, max: 90, step: 1 } },
  },
  sourceInsert: {
    props: {
      children: 'Panel',
      defaultSize: 50,
    },
  },
  render: (args: Args) => (
    <ResizablePanelGroup className="h-28 w-64 rounded-lg border" orientation="horizontal">
      <ResizablePanel defaultSize={asNumber(args.defaultSize, 50, { min: 10, max: 90 })}>
        {asText(args.children, 'Panel')}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>Panel</ResizablePanel>
    </ResizablePanelGroup>
  ),
};

export const ResizableHandleStory = {
  name: 'ResizableHandle',
  args: {
    withHandle: true,
  },
  argTypes: {
    withHandle: { control: 'boolean' },
  },
  sourceInsert: {
    props: {
      withHandle: true,
    },
  },
  render: (args: Args) => (
    <ResizablePanelGroup className="h-28 w-64 rounded-lg border" orientation="horizontal">
      <ResizablePanel defaultSize={50}>Preview</ResizablePanel>
      <ResizableHandle withHandle={asBoolean(args.withHandle, true)} />
      <ResizablePanel defaultSize={50}>Inspector</ResizablePanel>
    </ResizablePanelGroup>
  ),
};
