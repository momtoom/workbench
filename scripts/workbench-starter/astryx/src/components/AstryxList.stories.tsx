import { AstryxBadge } from './AstryxBadge';
import { AstryxIcon } from './AstryxIcon';
import { AstryxList as AstryxListComponent } from './AstryxList';
import { AstryxListItem } from './AstryxListItem';
import { AstryxItemSlot } from './AstryxItemSlot';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | number | string>;

const DENSITIES = ['compact', 'balanced', 'spacious'] as const;
const LIST_STYLES = ['none', 'disc', 'decimal', 'circle'] as const;

const DEFAULT_PROPS = {
  density: 'balanced',
  hasDividers: true,
  header: 'Project checklist',
  listStyle: 'none',
  start: 1,
} as const;

const meta = {
  title: 'Astryx/List',
  component: AstryxListComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    density: { control: 'select', options: DENSITIES },
    hasDividers: { control: 'boolean' },
    header: { control: 'text' },
    listStyle: { control: 'select', options: LIST_STYLES },
    start: { control: 'number' },
  },
  authoring: {
    allowedChildren: ['AstryxListItem'],
    group: 'Data',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxBadge'],
        sourceFile: 'src/components/AstryxBadge.tsx',
      },
      {
        names: ['AstryxIcon'],
        sourceFile: 'src/components/AstryxIcon.tsx',
      },
      {
        names: ['AstryxItemSlot'],
        sourceFile: 'src/components/AstryxItemSlot.tsx',
      },
      {
        names: ['AstryxListItem'],
        sourceFile: 'src/components/AstryxListItem.tsx',
      },
      {
        names: ['AstryxText'],
        sourceFile: 'src/components/AstryxText.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxListItem><AstryxItemSlot slot="start"><AstryxIcon icon="success" size="sm" /></AstryxItemSlot><AstryxItemSlot slot="body"><AstryxText as="span" display="block" type="label">Install packages</AstryxText><AstryxText as="span" color="secondary" display="block" type="supporting">Core, CLI, and neutral theme are available.</AstryxText></AstryxItemSlot><AstryxItemSlot slot="end"><AstryxBadge label="Done" variant="success" /></AstryxItemSlot></AstryxListItem>\n<AstryxListItem><AstryxItemSlot slot="start"><AstryxIcon icon="wrench" size="sm" /></AstryxItemSlot><AstryxItemSlot slot="body"><AstryxText as="span" display="block" type="label">Register components</AstryxText><AstryxText as="span" color="secondary" display="block" type="supporting">Wrapper stories drive Workbench insertion.</AstryxText></AstryxItemSlot></AstryxListItem>\n<AstryxListItem><AstryxItemSlot slot="start"><AstryxIcon icon="check" size="sm" /></AstryxItemSlot><AstryxItemSlot slot="body"><AstryxText as="span" display="block" type="label">Verify preview</AstryxText><AstryxText as="span" color="secondary" display="block" type="supporting">Canvas, layers, and Inspector stay aligned.</AstryxText></AstryxItemSlot></AstryxListItem>',
  },
};
export default meta;

export const AstryxList = {
  name: 'AstryxList',
  render: (args: Args) => (
    <AstryxListComponent
      density={asOption(args.density, DENSITIES, DEFAULT_PROPS.density)}
      hasDividers={asBoolean(args.hasDividers)}
      header={asText(args.header, DEFAULT_PROPS.header)}
      listStyle={asOption(args.listStyle, LIST_STYLES, DEFAULT_PROPS.listStyle)}
      start={asNumber(args.start, DEFAULT_PROPS.start)}
    >
      <AstryxListItem>
        <AstryxItemSlot slot="start">
          <AstryxIcon icon="success" size="sm" />
        </AstryxItemSlot>
        <AstryxItemSlot slot="body">
          <AstryxText as="span" display="block" type="label">
            Install packages
          </AstryxText>
          <AstryxText as="span" color="secondary" display="block" type="supporting">
            Core, CLI, and neutral theme are available.
          </AstryxText>
        </AstryxItemSlot>
        <AstryxItemSlot slot="end">
          <AstryxBadge label="Done" variant="success" />
        </AstryxItemSlot>
      </AstryxListItem>
      <AstryxListItem>
        <AstryxItemSlot slot="start">
          <AstryxIcon icon="wrench" size="sm" />
        </AstryxItemSlot>
        <AstryxItemSlot slot="body">
          <AstryxText as="span" display="block" type="label">
            Register components
          </AstryxText>
          <AstryxText as="span" color="secondary" display="block" type="supporting">
            Wrapper stories drive Workbench insertion.
          </AstryxText>
        </AstryxItemSlot>
      </AstryxListItem>
      <AstryxListItem>
        <AstryxItemSlot slot="start">
          <AstryxIcon icon="check" size="sm" />
        </AstryxItemSlot>
        <AstryxItemSlot slot="body">
          <AstryxText as="span" display="block" type="label">
            Verify preview
          </AstryxText>
          <AstryxText as="span" color="secondary" display="block" type="supporting">
            Canvas, layers, and Inspector stay aligned.
          </AstryxText>
        </AstryxItemSlot>
      </AstryxListItem>
    </AstryxListComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
