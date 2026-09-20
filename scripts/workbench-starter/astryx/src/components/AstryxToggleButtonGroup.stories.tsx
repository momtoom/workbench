import { AstryxToggleButton } from './AstryxToggleButton';
import { AstryxToggleButtonGroup as AstryxToggleButtonGroupComponent } from './AstryxToggleButtonGroup';

type Args = Record<string, boolean | string>;

const SELECTIONS = ['single', 'multiple'] as const;
const ORIENTATIONS = ['horizontal', 'vertical'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

const DEFAULT_PROPS = {
  label: 'View mode',
  defaultValue: 'list',
  orientation: 'horizontal',
  size: 'md',
  defaultValues: 'bold,italic',
  isDisabled: false,
  selection: 'single',
} as const;

const meta = {
  title: 'Astryx/ToggleButtonGroup',
  component: AstryxToggleButtonGroupComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    defaultValue: { control: 'text' },
    orientation: { control: 'select', options: ORIENTATIONS },
    size: { control: 'select', options: SIZES },
    defaultValues: { control: 'text' },
    isDisabled: { control: 'boolean' },
    selection: { control: 'select', options: SELECTIONS },
  },
  authoring: {
    allowedChildren: ['AstryxToggleButton'],
    group: 'Actions',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxToggleButton'],
        sourceFile: 'src/components/AstryxToggleButton.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxToggleButton label="List" value="list" icon="viewColumns" />\n<AstryxToggleButton label="Grid" value="grid" icon="arrowsUpDown" />\n<AstryxToggleButton label="Code" value="code" icon="wrench" />',
  },
};
export default meta;

export const AstryxToggleButtonGroup = {
  name: 'AstryxToggleButtonGroup',
  render: (args: Args) => (
    <AstryxToggleButtonGroupComponent
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      defaultValues={asText(args.defaultValues, DEFAULT_PROPS.defaultValues)}
      isDisabled={asBoolean(args.isDisabled)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      orientation={asOption(args.orientation, ORIENTATIONS, DEFAULT_PROPS.orientation)}
      selection={asOption(args.selection, SELECTIONS, DEFAULT_PROPS.selection)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
    >
      <AstryxToggleButton label="List" value="list" icon="viewColumns" />
      <AstryxToggleButton label="Grid" value="grid" icon="arrowsUpDown" />
      <AstryxToggleButton label="Code" value="code" icon="wrench" />
    </AstryxToggleButtonGroupComponent>
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
