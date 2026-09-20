import { AstryxButton } from './AstryxButton';
import { AstryxHeading } from './AstryxHeading';
import { AstryxLayout as AstryxLayoutComponent } from './AstryxLayout';
import { AstryxLayoutContent } from './AstryxLayoutContent';
import { AstryxLayoutFooter } from './AstryxLayoutFooter';
import { AstryxLayoutHeader } from './AstryxLayoutHeader';
import { AstryxLayoutPanel } from './AstryxLayoutPanel';
import { AstryxText } from './AstryxText';
import { AstryxVStack } from './AstryxVStack';

type Args = Record<string, boolean | number | string>;

const HEIGHTS = ['auto', 'fill'] as const;
const PADDINGS = ['inherit', 'none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;

const DEFAULT_PROPS = {
  padding: 'none',
  height: 'auto',
  contentWidth: 960,
  defaultHasDividers: true,
} as const;

const meta = {
  title: 'Astryx/Layout',
  component: AstryxLayoutComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    padding: { control: 'select', options: PADDINGS },
    height: { control: 'select', options: HEIGHTS },
    contentWidth: { control: 'number' },
    defaultHasDividers: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxLayoutHeader', 'AstryxLayoutContent', 'AstryxLayoutFooter', 'AstryxLayoutPanel'],
    group: 'Layout',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
      { names: ['AstryxHeading'], sourceFile: 'src/components/AstryxHeading.tsx' },
      { names: ['AstryxLayoutContent'], sourceFile: 'src/components/AstryxLayoutContent.tsx' },
      { names: ['AstryxLayoutFooter'], sourceFile: 'src/components/AstryxLayoutFooter.tsx' },
      { names: ['AstryxLayoutHeader'], sourceFile: 'src/components/AstryxLayoutHeader.tsx' },
      { names: ['AstryxLayoutPanel'], sourceFile: 'src/components/AstryxLayoutPanel.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
      { names: ['AstryxVStack'], sourceFile: 'src/components/AstryxVStack.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxLayoutHeader label="Header"><AstryxHeading level={3}>Project shell</AstryxHeading></AstryxLayoutHeader>\n<AstryxLayoutPanel slot="start" label="Navigation" width="220px"><AstryxText as="p" color="secondary" type="supporting">Sidebar content stays editable.</AstryxText></AstryxLayoutPanel>\n<AstryxLayoutContent label="Main content"><AstryxVStack gap="sm"><AstryxHeading level={3}>Content area</AstryxHeading><AstryxText as="p" color="secondary" type="body">Layout slots are source-backed child components.</AstryxText></AstryxVStack></AstryxLayoutContent>\n<AstryxLayoutFooter label="Footer"><AstryxButton label="Cancel" /><AstryxButton label="Save" variant="primary" /></AstryxLayoutFooter>',
  },
};
export default meta;

export const AstryxLayout = {
  name: 'AstryxLayout',
  render: (args: Args) => (
    <AstryxLayoutComponent
      contentWidth={asNumber(args.contentWidth, DEFAULT_PROPS.contentWidth)}
      defaultHasDividers={asBoolean(args.defaultHasDividers)}
      height={asOption(args.height, HEIGHTS, DEFAULT_PROPS.height)}
      padding={asNumberOption(args.padding, PADDINGS, DEFAULT_PROPS.padding)}
    >
      <AstryxLayoutHeader label="Header">
        <AstryxHeading level={3}>Project shell</AstryxHeading>
      </AstryxLayoutHeader>
      <AstryxLayoutPanel slot="start" label="Navigation" width="220px">
        <AstryxText as="p" color="secondary" type="supporting">
          Sidebar content stays editable.
        </AstryxText>
      </AstryxLayoutPanel>
      <AstryxLayoutContent label="Main content">
        <AstryxVStack gap="sm">
          <AstryxHeading level={3}>Content area</AstryxHeading>
          <AstryxText as="p" color="secondary" type="body">
            Layout slots are source-backed child components.
          </AstryxText>
        </AstryxVStack>
      </AstryxLayoutContent>
      <AstryxLayoutFooter label="Footer">
        <AstryxButton label="Cancel" />
        <AstryxButton label="Save" variant="primary" />
      </AstryxLayoutFooter>
    </AstryxLayoutComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asNumberOption<T extends number | string>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'number' || typeof value === 'string') && options.includes(value as T) ? (value as T) : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
