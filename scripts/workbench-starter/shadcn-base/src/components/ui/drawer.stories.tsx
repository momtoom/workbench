import {
  Drawer as ShadcnDrawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  className?: boolean | string;
  defaultOpen?: boolean | string;
  direction?: boolean | string;
  trigger?: boolean | string;
};

const DEFAULT_PROPS = {
  className: '',
  defaultOpen: true,
} as const;
const DIRECTIONS = ['top', 'right', 'bottom', 'left'] as const;

const BUTTON_CLASS_NAME =
  'inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted';

const meta = {
  title: 'shadcn/Base UI/Drawer',
  component: ShadcnDrawer,
  authoring: {
    group: 'Overlays',
  },
  args: {
    direction: 'bottom',
    defaultOpen: DEFAULT_PROPS.defaultOpen,
  },
  argTypes: {
    direction: { control: 'select', options: DIRECTIONS },
    defaultOpen: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: [
          'DrawerClose',
          'DrawerContent',
          'DrawerDescription',
          'DrawerFooter',
          'DrawerHeader',
          'DrawerTitle',
          'DrawerTrigger',
        ],
        sourceFile: 'src/components/ui/drawer.tsx',
      },
    ],
    jsxChildren:
      '<DrawerTrigger className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">Open drawer</DrawerTrigger><DrawerContent className=""><DrawerHeader><DrawerTitle>Drawer title</DrawerTitle><DrawerDescription>Drawer description</DrawerDescription></DrawerHeader><p className="text-sm text-muted-foreground">Review the details before continuing.</p><DrawerFooter><DrawerClose className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">Close</DrawerClose></DrawerFooter></DrawerContent>',
    props: {
      direction: 'bottom',
      defaultOpen: true,
    },
  },
};
export default meta;

export const Drawer = {
  name: 'Drawer',
  render: (args: Args) => {
    const defaultOpen = asBoolean(args.defaultOpen, true);
    return (
      <ShadcnDrawer
        key={String(defaultOpen)}
        defaultOpen={defaultOpen}
        direction={asOption(args.direction, DIRECTIONS, 'bottom')}
      >
        <DrawerTrigger className={BUTTON_CLASS_NAME}>Open drawer</DrawerTrigger>
        <DrawerContent className={DEFAULT_PROPS.className}>
          <DrawerHeader>
            <DrawerTitle>Drawer title</DrawerTitle>
            <DrawerDescription>Drawer description</DrawerDescription>
          </DrawerHeader>
          <p className="text-sm text-muted-foreground">Review the details before continuing.</p>
          <DrawerFooter>
            <DrawerClose className={BUTTON_CLASS_NAME}>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </ShadcnDrawer>
    );
  },
};

export const DrawerTriggerStory = {
  name: 'DrawerTrigger',
  sourceInsert: {
    props: { children: 'Open drawer', className: BUTTON_CLASS_NAME },
  },
  render: () => (
    <ShadcnDrawer>
      <DrawerTrigger className={BUTTON_CLASS_NAME}>Open drawer</DrawerTrigger>
      <DrawerContent><DrawerTitle>Drawer</DrawerTitle></DrawerContent>
    </ShadcnDrawer>
  ),
};

export const DrawerContentStory = {
  name: 'DrawerContent',
  sourceInsert: {
    imports: [
      {
        names: ['DrawerHeader', 'DrawerTitle', 'DrawerDescription', 'DrawerFooter'],
        sourceFile: 'src/components/ui/drawer.tsx',
      },
    ],
    jsxChildren:
      '<DrawerHeader><DrawerTitle>Drawer title</DrawerTitle><DrawerDescription>Drawer description</DrawerDescription></DrawerHeader><p className="text-sm text-muted-foreground">Drawer body content</p><DrawerFooter>Ready</DrawerFooter>',
  },
  render: () => (
    <ShadcnDrawer open>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer title</DrawerTitle>
          <DrawerDescription>Drawer description</DrawerDescription>
        </DrawerHeader>
        <p className="text-sm text-muted-foreground">Drawer body content</p>
        <DrawerFooter>Ready</DrawerFooter>
      </DrawerContent>
    </ShadcnDrawer>
  ),
};

export const DrawerHeaderStory = {
  name: 'DrawerHeader',
  sourceInsert: {
    imports: [
      {
        names: ['DrawerTitle', 'DrawerDescription'],
        sourceFile: 'src/components/ui/drawer.tsx',
      },
    ],
    jsxChildren: '<DrawerTitle>Drawer title</DrawerTitle><DrawerDescription>Drawer description</DrawerDescription>',
  },
  render: () => (
    <ShadcnDrawer open>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer title</DrawerTitle>
          <DrawerDescription>Drawer description</DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </ShadcnDrawer>
  ),
};

export const DrawerFooterStory = {
  name: 'DrawerFooter',
  sourceInsert: { props: { children: 'Ready' } },
  render: () => <DrawerFooter>Ready</DrawerFooter>,
};

export const DrawerTitleStory = {
  name: 'DrawerTitle',
  sourceInsert: { props: { children: 'Drawer title' } },
  render: () => (
    <ShadcnDrawer open>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer title</DrawerTitle>
        </DrawerHeader>
      </DrawerContent>
    </ShadcnDrawer>
  ),
};

export const DrawerDescriptionStory = {
  name: 'DrawerDescription',
  sourceInsert: { props: { children: 'Drawer description' } },
  render: () => (
    <ShadcnDrawer open>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer title</DrawerTitle>
          <DrawerDescription>Drawer description</DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </ShadcnDrawer>
  ),
};

export const DrawerCloseStory = {
  name: 'DrawerClose',
  sourceInsert: {
    props: { children: 'Close', className: BUTTON_CLASS_NAME },
  },
  render: () => (
    <ShadcnDrawer open>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Close drawer</DrawerTitle>
          <DrawerDescription>DrawerClose must live inside a drawer root.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose className={BUTTON_CLASS_NAME}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </ShadcnDrawer>
  ),
};
