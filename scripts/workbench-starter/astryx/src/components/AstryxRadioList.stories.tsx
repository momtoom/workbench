import { AstryxRadioList as AstryxRadioListComponent } from './AstryxRadioList';
import { AstryxRadioListItem } from './AstryxRadioListItem';

type Args = Record<string, boolean | string>;

const VALUES = ['compact', 'balanced', 'spacious'] as const;
const ORIENTATIONS = ['vertical', 'horizontal'] as const;
const SIZES = ['sm', 'md'] as const;

const DEFAULT_PROPS = {
  label: 'Content density',
  description: 'Choose the spacing density for this component.',
  defaultValue: 'balanced',
  orientation: 'vertical',
  size: 'md',
  width: '100%',
  isDisabled: false,
  isLabelHidden: false,
  isOptional: false,
  isRequired: false,
} as const;

const meta = {
  title: 'Astryx/RadioList',
  component: AstryxRadioListComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    defaultValue: { control: 'select', options: VALUES },
    orientation: { control: 'select', options: ORIENTATIONS },
    size: { control: 'select', options: SIZES },
    width: { control: 'select', options: ['inherit', 'full', 'sm', 'md', 'lg'] },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxRadioListItem'],
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxRadioListItem'],
        sourceFile: 'src/components/AstryxRadioListItem.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxRadioListItem label="Compact" value="compact" description="Dense controls for operational views." />\n<AstryxRadioListItem label="Balanced" value="balanced" description="Default spacing for mixed content." />\n<AstryxRadioListItem label="Spacious" value="spacious" description="Roomier layout for presentation pages." />',
  },
};
export default meta;

export const AstryxRadioList = {
  name: 'AstryxRadioList',
  render: (args: Args) => (
    <AstryxRadioListComponent
      defaultValue={asOption(args.defaultValue, VALUES, DEFAULT_PROPS.defaultValue)}
      description={asText(args.description, DEFAULT_PROPS.description)}
      isDisabled={asBoolean(args.isDisabled)}
      isLabelHidden={asBoolean(args.isLabelHidden)}
      isOptional={asBoolean(args.isOptional)}
      isRequired={asBoolean(args.isRequired)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      orientation={asOption(args.orientation, ORIENTATIONS, DEFAULT_PROPS.orientation)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      width={asText(args.width, DEFAULT_PROPS.width)}
    >
      <AstryxRadioListItem
        description="Dense controls for operational views."
        label="Compact"
        value="compact"
      />
      <AstryxRadioListItem
        description="Default spacing for mixed content."
        label="Balanced"
        value="balanced"
      />
      <AstryxRadioListItem
        description="Roomier layout for presentation pages."
        label="Spacious"
        value="spacious"
      />
    </AstryxRadioListComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
