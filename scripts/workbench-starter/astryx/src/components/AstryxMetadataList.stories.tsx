import { AstryxIcon } from './AstryxIcon';
import { AstryxMetadataList as AstryxMetadataListComponent } from './AstryxMetadataList';
import { AstryxMetadataListItem } from './AstryxMetadataListItem';

type Args = Record<string, boolean | number | string>;

const COLUMNS = ['single', 'multi', 'two'] as const;
const LABEL_POSITIONS = ['start', 'top'] as const;
const ORIENTATIONS = ['vertical', 'horizontal'] as const;

const DEFAULT_PROPS = {
  title: 'Component metadata',
  orientation: 'vertical',
  labelPosition: 'start',
  columns: 'single',
  maxNumOfItems: 0,
} as const;

const meta = {
  title: 'Astryx/MetadataList',
  component: AstryxMetadataListComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
    orientation: { control: 'select', options: ORIENTATIONS },
    labelPosition: { control: 'select', options: LABEL_POSITIONS },
    columns: { control: 'select', options: COLUMNS },
    maxNumOfItems: { control: 'number' },
  },
  authoring: {
    allowedChildren: ['AstryxMetadataListItem'],
    group: 'Data',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxIcon'],
        sourceFile: 'src/components/AstryxIcon.tsx',
      },
      {
        names: ['AstryxMetadataListItem'],
        sourceFile: 'src/components/AstryxMetadataListItem.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxMetadataListItem label="Library" value="Astryx" />\n<AstryxMetadataListItem label="Theme" value="Neutral" />\n<AstryxMetadataListItem label="Status"><AstryxIcon icon="success" size="sm" /> Registered</AstryxMetadataListItem>',
  },
};
export default meta;

export const AstryxMetadataList = {
  name: 'AstryxMetadataList',
  render: (args: Args) => (
    <AstryxMetadataListComponent
      columns={asOption(args.columns, COLUMNS, DEFAULT_PROPS.columns)}
      labelPosition={asOption(args.labelPosition, LABEL_POSITIONS, DEFAULT_PROPS.labelPosition)}
      maxNumOfItems={asNumber(args.maxNumOfItems, DEFAULT_PROPS.maxNumOfItems)}
      orientation={asOption(args.orientation, ORIENTATIONS, DEFAULT_PROPS.orientation)}
      title={asText(args.title, DEFAULT_PROPS.title)}
    >
      <AstryxMetadataListItem label="Library" value="Astryx" />
      <AstryxMetadataListItem label="Theme" value="Neutral" />
      <AstryxMetadataListItem label="Status">
        <AstryxIcon icon="success" size="sm" /> Registered
      </AstryxMetadataListItem>
    </AstryxMetadataListComponent>
  ),
};

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
