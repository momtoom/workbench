import { RiFolderOpenLine } from '@remixicon/react';
import { Button } from './button';
import {
  Empty as ShadcnEmpty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty';
import { asOption } from './story-utils';

type Args = {
  variant?: boolean | string;
};

const MEDIA_VARIANTS = ['default', 'icon'] as const;

const meta = {
  title: 'shadcn/Base UI/Empty',
  component: ShadcnEmpty,
  authoring: {
    group: 'Feedback',
  },
  sourceInsert: {
    imports: [
      {
        names: ['EmptyHeader', 'EmptyMedia', 'EmptyTitle', 'EmptyDescription', 'EmptyContent'],
        sourceFile: 'src/components/ui/empty.tsx',
      },
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
      {
        importSource: '@remixicon/react',
        names: ['RiFolderOpenLine'],
      },
    ],
    jsxChildren:
      '<EmptyHeader><EmptyMedia variant="icon"><RiFolderOpenLine /></EmptyMedia><EmptyTitle>No items yet</EmptyTitle><EmptyDescription>Add an item to get started.</EmptyDescription></EmptyHeader><EmptyContent><Button size="sm">Create item</Button></EmptyContent>',
    props: {
      className: 'w-[min(26rem,100%)] border',
    },
  },
};
export default meta;

export const Empty = {
  name: 'Empty',
  render: () => (
    <ShadcnEmpty className="w-[min(26rem,100%)] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiFolderOpenLine />
        </EmptyMedia>
        <EmptyTitle>No items yet</EmptyTitle>
        <EmptyDescription>Add an item to get started.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Create item</Button>
      </EmptyContent>
    </ShadcnEmpty>
  ),
};

export const EmptyHeaderStory = {
  name: 'EmptyHeader',
  sourceInsert: {
    imports: [
      {
        names: ['EmptyTitle', 'EmptyDescription'],
        sourceFile: 'src/components/ui/empty.tsx',
      },
    ],
    jsxChildren: '<EmptyTitle>No items yet</EmptyTitle><EmptyDescription>Add an item to get started.</EmptyDescription>',
  },
  render: () => (
    <ShadcnEmpty className="w-[min(26rem,100%)] border">
      <EmptyHeader>
        <EmptyTitle>No items yet</EmptyTitle>
        <EmptyDescription>Add an item to get started.</EmptyDescription>
      </EmptyHeader>
    </ShadcnEmpty>
  ),
};

export const EmptyMediaStory = {
  name: 'EmptyMedia',
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
        names: ['RiFolderOpenLine'],
      },
    ],
    jsxChildren: '<RiFolderOpenLine />',
    props: {
      variant: 'icon',
    },
  },
  render: (args: Args) => (
    <ShadcnEmpty className="w-[min(26rem,100%)] border">
      <EmptyMedia variant={asOption(args.variant, MEDIA_VARIANTS, 'icon')}><RiFolderOpenLine /></EmptyMedia>
    </ShadcnEmpty>
  ),
};

export const EmptyTitleStory = {
  name: 'EmptyTitle',
  sourceInsert: {
    props: {
      children: 'No items yet',
    },
  },
  render: () => (
    <ShadcnEmpty className="w-[min(26rem,100%)] border">
      <EmptyTitle>No items yet</EmptyTitle>
    </ShadcnEmpty>
  ),
};

export const EmptyDescriptionStory = {
  name: 'EmptyDescription',
  sourceInsert: {
    props: {
      children: 'Add an item to get started.',
    },
  },
  render: () => (
    <ShadcnEmpty className="w-[min(26rem,100%)] border">
      <EmptyDescription>Add an item to get started.</EmptyDescription>
    </ShadcnEmpty>
  ),
};

export const EmptyContentStory = {
  name: 'EmptyContent',
  sourceInsert: {
    imports: [
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren: '<Button>Create item</Button>',
  },
  render: () => (
    <ShadcnEmpty className="w-[min(26rem,100%)] border">
      <EmptyContent><Button>Create item</Button></EmptyContent>
    </ShadcnEmpty>
  ),
};
