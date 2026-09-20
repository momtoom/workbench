import {
  Card as ShadcnCard,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
import { Button } from './button';
import { Input } from './input';
import { asOption, asText } from './story-utils';

type Args = {
  className?: boolean | string;
  size?: boolean | string;
};

const SIZES = ['default', 'sm'] as const;

const DEFAULT_PROPS = {
  size: 'default',
  className: 'w-[min(24rem,100%)]',
} as const;

const meta = {
  title: 'shadcn/Base UI/Card',
  component: ShadcnCard,
  authoring: {
    group: 'Content',
    roles: ['surface.card'],
    priority: 100,
  },
  args: DEFAULT_PROPS,
  argTypes: {
    size: { control: 'select', options: SIZES },
    className: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
        sourceFile: 'src/components/ui/card.tsx',
      },
      {
        names: ['Input'],
        sourceFile: 'src/components/ui/input.tsx',
      },
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren:
      '<img src="/workbench-assets/icons/lucide-preview/image.svg" alt="Image placeholder" className="aspect-video w-full bg-muted object-contain p-12" /><CardHeader><CardTitle>Quick edit</CardTitle><CardDescription>Use the card slots for structured content and actions.</CardDescription></CardHeader><CardContent><Input defaultValue="Design system" aria-label="Project label" /></CardContent><CardFooter><Button className="w-full" variant="secondary">Save changes</Button></CardFooter>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Card = {
  name: 'Card',
  render: (args: Args) => (
    <ShadcnCard
      className={asText(args.className, DEFAULT_PROPS.className)}
      size={asOption(args.size, SIZES, 'default')}
    >
      <img
        src="/workbench-assets/icons/lucide-preview/image.svg"
        alt="Image placeholder"
        className="aspect-video w-full bg-muted object-contain p-12"
      />
      <CardHeader>
        <CardTitle>Quick edit</CardTitle>
        <CardDescription>Use the card slots for structured content and actions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input defaultValue="Design system" aria-label="Project label" />
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="secondary">Save changes</Button>
      </CardFooter>
    </ShadcnCard>
  ),
};

export const CardHeaderStory = {
  name: 'CardHeader',
  sourceInsert: {
    imports: [
      {
        names: ['CardTitle', 'CardDescription'],
        sourceFile: 'src/components/ui/card.tsx',
      },
    ],
    jsxChildren:
      '<CardTitle>Title</CardTitle><CardDescription>Description</CardDescription>',
    props: {
      className: '',
    },
  },
  render: () => (
    <ShadcnCard className="w-[min(24rem,100%)]">
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
    </ShadcnCard>
  ),
};

export const CardTitleStory = {
  name: 'CardTitle',
  sourceInsert: {
    props: {
      children: 'Title',
      className: '',
    },
  },
  render: () => (
    <ShadcnCard className="w-[min(24rem,100%)]">
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
    </ShadcnCard>
  ),
};

export const CardDescriptionStory = {
  name: 'CardDescription',
  sourceInsert: {
    props: {
      children: 'Description',
      className: '',
    },
  },
  render: () => (
    <ShadcnCard className="w-[min(24rem,100%)]">
      <CardHeader>
        <CardDescription>Description</CardDescription>
      </CardHeader>
    </ShadcnCard>
  ),
};

export const CardActionStory = {
  name: 'CardAction',
  sourceInsert: {
    props: {
      children: 'Action',
      className: '',
    },
  },
  render: () => (
    <ShadcnCard className="w-[min(24rem,100%)]">
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardAction>Action</CardAction>
      </CardHeader>
    </ShadcnCard>
  ),
};

export const CardContentStory = {
  name: 'CardContent',
  sourceInsert: {
    props: {
      children: 'Content',
      className: '',
    },
  },
  render: () => (
    <ShadcnCard className="w-[min(24rem,100%)]">
      <CardContent>Content</CardContent>
    </ShadcnCard>
  ),
};

export const CardFooterStory = {
  name: 'CardFooter',
  sourceInsert: {
    props: {
      children: 'Footer',
      className: '',
    },
  },
  render: () => (
    <ShadcnCard className="w-[min(24rem,100%)]">
      <CardFooter>Footer</CardFooter>
    </ShadcnCard>
  ),
};
