import { Button } from './button';
import {
  Sheet as ShadcnSheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  className?: boolean | string;
  defaultOpen?: boolean | string;
  side?: boolean | string;
  showCloseButton?: boolean | string;
  trigger?: boolean | string;
};

const SIDES = ['top', 'right', 'bottom', 'left'] as const;
const DEFAULT_PROPS = {
  className: '',
  defaultOpen: true,
} as const;

const meta = {
  title: 'shadcn/Base UI/Sheet',
  component: ShadcnSheet,
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
          'SheetContent',
          'SheetDescription',
          'SheetFooter',
          'SheetHeader',
          'SheetTitle',
          'SheetTrigger',
        ],
        sourceFile: 'src/components/ui/sheet.tsx',
      },
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren:
      '<SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger><SheetContent className="" showCloseButton side="right"><SheetHeader><SheetTitle>Sheet title</SheetTitle><SheetDescription>Sheet description</SheetDescription></SheetHeader><SheetFooter><Button size="sm">Save</Button></SheetFooter></SheetContent>',
    props: {
      defaultOpen: true,
    },
  },
};
export default meta;

export const Sheet = {
  name: 'Sheet',
  render: (args: Args) => {
    const defaultOpen = asBoolean(args.defaultOpen, true);
    return (
      <ShadcnSheet
        key={String(defaultOpen)}
        defaultOpen={defaultOpen}
      >
        <SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger>
        <SheetContent
          className={DEFAULT_PROPS.className}
          showCloseButton
          side="right"
        >
          <SheetHeader>
            <SheetTitle>Sheet title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button size="sm">Save</Button>
          </SheetFooter>
        </SheetContent>
      </ShadcnSheet>
    );
  },
};

export const SheetTriggerStory = {
  name: 'SheetTrigger',
  sourceInsert: {
    jsxProps: { render: '<button type="button" />' },
    props: { children: 'Open sheet' },
  },
  render: () => (
    <ShadcnSheet>
      <SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger>
      <SheetContent><SheetTitle>Sheet</SheetTitle></SheetContent>
    </ShadcnSheet>
  ),
};

export const SheetContentStory = {
  name: 'SheetContent',
  args: {
    showCloseButton: true,
    side: 'right',
  },
  argTypes: {
    showCloseButton: { control: 'boolean' },
    side: { control: 'select', options: SIDES },
  },
  sourceInsert: {
    imports: [
      {
        names: ['SheetHeader', 'SheetTitle', 'SheetDescription', 'SheetFooter'],
        sourceFile: 'src/components/ui/sheet.tsx',
      },
    ],
    jsxChildren:
      '<SheetHeader><SheetTitle>Sheet title</SheetTitle><SheetDescription>Sheet description</SheetDescription></SheetHeader><SheetFooter>Ready</SheetFooter>',
    props: {
      showCloseButton: true,
      side: 'right',
    },
  },
  render: (args: Args) => (
    <ShadcnSheet defaultOpen>
      <SheetContent
        showCloseButton={asBoolean(args.showCloseButton, true)}
        side={asOption(args.side, SIDES, 'right')}
      >
        <SheetHeader>
          <SheetTitle>Sheet title</SheetTitle>
          <SheetDescription>Sheet description</SheetDescription>
        </SheetHeader>
        <SheetFooter>Ready</SheetFooter>
      </SheetContent>
    </ShadcnSheet>
  ),
};

export const SheetHeaderStory = {
  name: 'SheetHeader',
  sourceInsert: {
    imports: [
      {
        names: ['SheetTitle', 'SheetDescription'],
        sourceFile: 'src/components/ui/sheet.tsx',
      },
    ],
    jsxChildren: '<SheetTitle>Sheet title</SheetTitle><SheetDescription>Sheet description</SheetDescription>',
  },
  render: () => (
    <ShadcnSheet defaultOpen>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet title</SheetTitle>
          <SheetDescription>Sheet description</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </ShadcnSheet>
  ),
};

export const SheetFooterStory = {
  name: 'SheetFooter',
  sourceInsert: { props: { children: 'Ready' } },
  render: () => <SheetFooter>Ready</SheetFooter>,
};

export const SheetTitleStory = {
  name: 'SheetTitle',
  sourceInsert: { props: { children: 'Sheet title' } },
  render: () => (
    <ShadcnSheet defaultOpen>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet title</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </ShadcnSheet>
  ),
};

export const SheetDescriptionStory = {
  name: 'SheetDescription',
  sourceInsert: { props: { children: 'Sheet description' } },
  render: () => (
    <ShadcnSheet defaultOpen>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet title</SheetTitle>
          <SheetDescription>Sheet description</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </ShadcnSheet>
  ),
};

export const SheetCloseStory = {
  name: 'SheetClose',
  sourceInsert: {
    jsxProps: { render: '<button type="button" />' },
    props: { children: 'Close' },
  },
  render: () => (
    <ShadcnSheet defaultOpen>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Close sheet</SheetTitle>
          <SheetDescription>SheetClose must live inside a sheet root.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Close</SheetClose>
        </SheetFooter>
      </SheetContent>
    </ShadcnSheet>
  ),
};
