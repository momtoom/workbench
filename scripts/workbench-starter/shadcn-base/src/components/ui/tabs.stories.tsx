import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsPane,
  TabsTrigger,
} from './tabs';
import { asOption } from './story-utils';

type Args = {
  defaultValue?: boolean | string;
  orientation?: boolean | string;
};

const ORIENTATIONS = ['horizontal', 'vertical'] as const;
const TAB_VALUES = ['item-1', 'item-2'] as const;

const DEFAULT_PROPS = {
  defaultValue: 'item-1',
  orientation: 'horizontal',
} as const;

const meta = {
  title: 'shadcn/Base UI/Tabs',
  component: ShadcnTabs,
  authoring: {
    group: 'Navigation',
    roles: ['navigation.tabs'],
    priority: 100,
  },
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'select', options: TAB_VALUES },
    orientation: { control: 'select', options: ORIENTATIONS },
  },
  sourceInsert: {
    imports: [
      {
        names: ['TabsPane'],
        sourceFile: 'src/components/ui/tabs.tsx',
      },
    ],
    jsxChildren:
      '<TabsPane value="item-1" title="Item 1">Content 1</TabsPane><TabsPane value="item-2" title="Item 2">Content 2</TabsPane>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Tabs = {
  name: 'Tabs',
  render: (args: Args) => {
    const orientation = asOption(args.orientation, ORIENTATIONS, 'horizontal');
    const defaultValue = asOption(args.defaultValue, TAB_VALUES, DEFAULT_PROPS.defaultValue);
    return (
      <ShadcnTabs
        key={`${orientation}-${defaultValue}`}
        className="w-[min(28rem,100%)]"
        defaultValue={defaultValue}
        orientation={orientation}
      >
        <TabsPane value="item-1" title="Item 1">Content 1</TabsPane>
        <TabsPane value="item-2" title="Item 2">Content 2</TabsPane>
      </ShadcnTabs>
    );
  },
};

export const TabsPaneStory = {
  name: 'TabsPane',
  sourceInsert: {
    props: {
      children: 'Content',
      title: 'Item',
      value: 'item-1',
    },
  },
  render: () => (
    <ShadcnTabs className="w-[min(28rem,100%)]" defaultValue="item-1">
      <TabsPane value="item-1" title="Item">Content</TabsPane>
    </ShadcnTabs>
  ),
};

export const TabsListStory = {
  name: 'TabsList',
  sourceInsert: {
    imports: [
      {
        names: ['TabsTrigger'],
        sourceFile: 'src/components/ui/tabs.tsx',
      },
    ],
    jsxChildren: '<TabsTrigger value="item-1">Item</TabsTrigger>',
  },
  render: () => (
    <ShadcnTabs className="w-[min(28rem,100%)]" defaultValue="item-1">
      <TabsList>
        <TabsTrigger value="item-1">Item</TabsTrigger>
      </TabsList>
    </ShadcnTabs>
  ),
};

export const TabsTriggerStory = {
  name: 'TabsTrigger',
  sourceInsert: {
    props: {
      children: 'Item',
      value: 'item-1',
    },
  },
  render: () => (
    <ShadcnTabs className="w-[min(28rem,100%)]" defaultValue="item-1">
      <TabsList>
        <TabsTrigger value="item-1">Item</TabsTrigger>
      </TabsList>
    </ShadcnTabs>
  ),
};

export const TabsContentStory = {
  name: 'TabsContent',
  sourceInsert: {
    props: {
      children: 'Content',
      value: 'item-1',
      keepMounted: true,
    },
  },
  render: () => (
    <ShadcnTabs className="w-[min(28rem,100%)]" defaultValue="item-1">
      <TabsContent value="item-1">Content</TabsContent>
    </ShadcnTabs>
  ),
};
