import { AstryxHeading } from './AstryxHeading';
import { AstryxLayoutContent as AstryxLayoutContentComponent } from './AstryxLayoutContent';
import { AstryxText } from './AstryxText';
import { AstryxVStack } from './AstryxVStack';

type Args = Record<string, boolean | string>;

const PADDINGS = ['inherit', 'none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;

const DEFAULT_PROPS = {
  label: 'Layout content',
  role: 'main',
  padding: 'md',
  isScrollable: true,
} as const;

const meta = {
  title: 'Astryx/LayoutContent',
  component: AstryxLayoutContentComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    role: { control: 'text' },
    padding: { control: 'select', options: PADDINGS },
    isScrollable: { control: 'boolean' },
  },
  authoring: {
    group: 'Layout',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxHeading'], sourceFile: 'src/components/AstryxHeading.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
      { names: ['AstryxVStack'], sourceFile: 'src/components/AstryxVStack.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxVStack gap="sm"><AstryxHeading level={3}>Content slot</AstryxHeading><AstryxText as="p" color="secondary" type="body">Main content remains editable as children.</AstryxText></AstryxVStack>',
  },
};
export default meta;

export const AstryxLayoutContent = {
  name: 'AstryxLayoutContent',
  render: (args: Args) => (
    <AstryxLayoutContentComponent
      isScrollable={asBoolean(args.isScrollable)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      padding={asNumberOption(args.padding, PADDINGS, DEFAULT_PROPS.padding)}
      role={asText(args.role, DEFAULT_PROPS.role)}
    >
      <AstryxVStack gap="sm">
        <AstryxHeading level={3}>Content slot</AstryxHeading>
        <AstryxText as="p" color="secondary" type="body">
          Main content remains editable as children.
        </AstryxText>
      </AstryxVStack>
    </AstryxLayoutContentComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumberOption<T extends number | string>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'number' || typeof value === 'string') && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
