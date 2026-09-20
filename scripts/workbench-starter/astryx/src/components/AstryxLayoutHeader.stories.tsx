import { AstryxHeading } from './AstryxHeading';
import { AstryxLayoutHeader as AstryxLayoutHeaderComponent } from './AstryxLayoutHeader';
import { AstryxText } from './AstryxText';
import { AstryxVStack } from './AstryxVStack';

type Args = Record<string, boolean | string>;

const PADDINGS = ['inherit', 'none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;

const DEFAULT_PROPS = {
  label: 'Layout header',
  role: 'banner',
  padding: 'md',
  height: '',
  hasDivider: true,
} as const;

const meta = {
  title: 'Astryx/LayoutHeader',
  component: AstryxLayoutHeaderComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    role: { control: 'text' },
    padding: { control: 'select', options: PADDINGS },
    height: { control: 'text' },
    hasDivider: { control: 'boolean' },
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
      '<AstryxVStack gap="xs"><AstryxHeading level={3}>Header slot</AstryxHeading><AstryxText as="p" color="secondary" type="supporting">Use inside AstryxLayout.</AstryxText></AstryxVStack>',
  },
};
export default meta;

export const AstryxLayoutHeader = {
  name: 'AstryxLayoutHeader',
  render: (args: Args) => (
    <AstryxLayoutHeaderComponent
      hasDivider={asBoolean(args.hasDivider)}
      height={asText(args.height)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      padding={asNumberOption(args.padding, PADDINGS, DEFAULT_PROPS.padding)}
      role={asText(args.role, DEFAULT_PROPS.role)}
    >
      <AstryxVStack gap="xs">
        <AstryxHeading level={3}>Header slot</AstryxHeading>
        <AstryxText as="p" color="secondary" type="supporting">
          Use inside AstryxLayout.
        </AstryxText>
      </AstryxVStack>
    </AstryxLayoutHeaderComponent>
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
