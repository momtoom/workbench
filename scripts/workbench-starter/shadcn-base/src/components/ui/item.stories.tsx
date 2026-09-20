import { RiCheckboxCircleLine, RiPaletteLine } from '@remixicon/react';
import { Button } from './button';
import {
  Item as ShadcnItem,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from './item';
import { asOption } from './story-utils';

type Args = {
  size?: boolean | string;
  variant?: boolean | string;
};

const SIZES = ['default', 'sm', 'xs'] as const;
const MEDIA_VARIANTS = ['default', 'icon', 'image'] as const;
const VARIANTS = ['default', 'outline', 'muted'] as const;

const DEFAULT_PROPS = {
  variant: 'outline',
  size: 'default',
} as const;

const meta = {
  title: 'shadcn/Base UI/Item',
  component: ShadcnItem,
  authoring: {
    group: 'Content',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ItemMedia', 'ItemContent', 'ItemTitle', 'ItemDescription'],
        sourceFile: 'src/components/ui/item.tsx',
      },
      {
        importSource: '@remixicon/react',
        names: ['RiCheckboxCircleLine'],
      },
    ],
    jsxChildren:
      '<ItemMedia variant="icon"><RiCheckboxCircleLine /></ItemMedia><ItemContent><ItemTitle>Item title</ItemTitle><ItemDescription>Item description</ItemDescription></ItemContent>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Item = {
  name: 'Item',
  render: (args: Args) => (
    <ShadcnItem
      className="w-[min(28rem,100%)]"
      size={asOption(args.size, SIZES, 'default')}
      variant={asOption(args.variant, VARIANTS, 'outline')}
    >
      <ItemMedia variant="icon">
        <RiCheckboxCircleLine />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Item title</ItemTitle>
        <ItemDescription>Item description</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline">Open</Button>
      </ItemActions>
    </ShadcnItem>
  ),
};

export const ItemGroupStory = {
  name: 'ItemGroup',
  sourceInsert: {
    imports: [
      {
        names: ['Item', 'ItemContent', 'ItemTitle'],
        sourceFile: 'src/components/ui/item.tsx',
      },
    ],
    jsxChildren: '<Item><ItemContent><ItemTitle>Item title</ItemTitle></ItemContent></Item>',
  },
  render: () => <ItemGroup><ShadcnItem><ItemTitle>Item title</ItemTitle></ShadcnItem></ItemGroup>,
};

export const ItemMediaStory = {
  name: 'ItemMedia',
  args: {
    variant: 'icon',
  },
  argTypes: {
    variant: { control: 'select', options: MEDIA_VARIANTS },
  },
  sourceInsert: {
    imports: [
      {
        importSource: '@remixicon/react',
        names: ['RiPaletteLine'],
      },
    ],
    jsxChildren: '<RiPaletteLine />',
    props: {
      variant: 'icon',
    },
  },
  render: (args: Args) => (
    <ShadcnItem>
      <ItemMedia variant={asOption(args.variant, MEDIA_VARIANTS, 'icon')}><RiPaletteLine /></ItemMedia>
      <ItemTitle>Item title</ItemTitle>
    </ShadcnItem>
  ),
};

export const ItemContentStory = {
  name: 'ItemContent',
  sourceInsert: {
    imports: [
      {
        names: ['ItemTitle', 'ItemDescription'],
        sourceFile: 'src/components/ui/item.tsx',
      },
    ],
    jsxChildren: '<ItemTitle>Item title</ItemTitle><ItemDescription>Item description</ItemDescription>',
  },
  render: () => <ShadcnItem><ItemContent><ItemTitle>Item title</ItemTitle><ItemDescription>Item description</ItemDescription></ItemContent></ShadcnItem>,
};

export const ItemTitleStory = {
  name: 'ItemTitle',
  sourceInsert: {
    props: {
      children: 'Item title',
    },
  },
  render: () => <ShadcnItem><ItemTitle>Item title</ItemTitle></ShadcnItem>,
};

export const ItemDescriptionStory = {
  name: 'ItemDescription',
  sourceInsert: {
    props: {
      children: 'Item description',
    },
  },
  render: () => <ShadcnItem><ItemDescription>Item description</ItemDescription></ShadcnItem>,
};

export const ItemActionsStory = {
  name: 'ItemActions',
  sourceInsert: {
    imports: [
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren: '<Button size="sm">Open</Button>',
  },
  render: () => <ShadcnItem><ItemActions><Button size="sm">Open</Button></ItemActions></ShadcnItem>,
};

export const ItemHeaderStory = {
  name: 'ItemHeader',
  sourceInsert: {
    props: {
      children: 'Header',
    },
  },
  render: () => <ShadcnItem><ItemHeader>Header</ItemHeader><ItemTitle>Item title</ItemTitle></ShadcnItem>,
};

export const ItemFooterStory = {
  name: 'ItemFooter',
  sourceInsert: {
    props: {
      children: 'Updated now',
    },
  },
  render: () => <ShadcnItem><ItemTitle>Item title</ItemTitle><ItemFooter>Updated now</ItemFooter></ShadcnItem>,
};

export const ItemSeparatorStory = {
  name: 'ItemSeparator',
  sourceInsert: {},
  render: () => <ItemGroup><ShadcnItem><ItemTitle>One</ItemTitle></ShadcnItem><ItemSeparator /><ShadcnItem><ItemTitle>Two</ItemTitle></ShadcnItem></ItemGroup>,
};
