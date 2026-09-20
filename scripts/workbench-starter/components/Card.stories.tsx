import { Button } from './Button';
import {
  Card as WorkbenchCard,
  CardContent as WorkbenchCardContent,
  CardDescription as WorkbenchCardDescription,
  CardFooter as WorkbenchCardFooter,
  CardHeader as WorkbenchCardHeader,
  CardTitle as WorkbenchCardTitle,
} from './Card';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  title: 'Starter card',
  description: 'A source-backed card with component tokens and editable children.',
  body: 'Use this as a small, registered Workbench component test case.',
} as const;

const meta = {
  title: 'Local/Card',
  component: WorkbenchCard,
  authoring: {
    roles: ['surface.card'],
    priority: 100,
  },
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    body: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
        sourceFile: 'src/components/Card.tsx',
      },
      {
        names: ['Button'],
        sourceFile: 'src/components/Button.tsx',
      },
    ],
    jsxChildren: '<CardHeader>\n  <CardTitle>Starter card</CardTitle>\n  <CardDescription>A source-backed card with component tokens and editable children.</CardDescription>\n</CardHeader>\n<CardContent>\n  <p>Use this as a small, registered Workbench component test case.</p>\n</CardContent>\n<CardFooter>\n  <Button size="sm">Action</Button>\n  <Button size="sm" variant="ghost">Dismiss</Button>\n</CardFooter>',
    props: {},
  },
};
export default meta;

export const Card = {
  name: 'Card',
  render: (args: Args) => (
    <WorkbenchCard>
      <WorkbenchCardHeader>
        <WorkbenchCardTitle>{asText(args.title, 'Starter card')}</WorkbenchCardTitle>
        <WorkbenchCardDescription>{asText(args.description, DEFAULT_PROPS.description)}</WorkbenchCardDescription>
      </WorkbenchCardHeader>
      <WorkbenchCardContent>
        <p>{asText(args.body, DEFAULT_PROPS.body)}</p>
      </WorkbenchCardContent>
      <WorkbenchCardFooter>
        <Button size="sm">Action</Button>
        <Button size="sm" variant="ghost">Dismiss</Button>
      </WorkbenchCardFooter>
    </WorkbenchCard>
  ),
};

export const CardHeader = {
  name: 'CardHeader',
  render: () => (
    <WorkbenchCard>
      <WorkbenchCardHeader>
        <WorkbenchCardTitle>Starter card</WorkbenchCardTitle>
        <WorkbenchCardDescription>A source-backed card with component tokens and editable children.</WorkbenchCardDescription>
      </WorkbenchCardHeader>
    </WorkbenchCard>
  ),
  sourceInsert: {
    imports: [
      {
        names: ['CardTitle', 'CardDescription'],
        sourceFile: 'src/components/Card.tsx',
      },
    ],
    jsxChildren: '<CardTitle>Starter card</CardTitle>\n<CardDescription>A source-backed card with component tokens and editable children.</CardDescription>',
  },
};

export const CardTitle = {
  name: 'CardTitle',
  render: () => (
    <WorkbenchCard>
      <WorkbenchCardHeader>
        <WorkbenchCardTitle>Starter card</WorkbenchCardTitle>
      </WorkbenchCardHeader>
    </WorkbenchCard>
  ),
  sourceInsert: {
    jsxChildren: 'Starter card',
  },
};

export const CardDescription = {
  name: 'CardDescription',
  render: () => (
    <WorkbenchCard>
      <WorkbenchCardHeader>
        <WorkbenchCardDescription>A source-backed card with component tokens and editable children.</WorkbenchCardDescription>
      </WorkbenchCardHeader>
    </WorkbenchCard>
  ),
  sourceInsert: {
    jsxChildren: 'A source-backed card with component tokens and editable children.',
  },
};

export const CardContent = {
  name: 'CardContent',
  render: () => (
    <WorkbenchCard>
      <WorkbenchCardContent>
        <p>Use this as a small, registered Workbench component test case.</p>
      </WorkbenchCardContent>
    </WorkbenchCard>
  ),
  sourceInsert: {
    jsxChildren: '<p>Use this as a small, registered Workbench component test case.</p>',
  },
};

export const CardFooter = {
  name: 'CardFooter',
  render: () => (
    <WorkbenchCard>
      <WorkbenchCardFooter>
        <Button size="sm">Action</Button>
        <Button size="sm" variant="ghost">Dismiss</Button>
      </WorkbenchCardFooter>
    </WorkbenchCard>
  ),
  sourceInsert: {
    imports: [
      {
        names: ['Button'],
        sourceFile: 'src/components/Button.tsx',
      },
    ],
    jsxChildren: '<Button size="sm">Action</Button>\n<Button size="sm" variant="ghost">Dismiss</Button>',
  },
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
