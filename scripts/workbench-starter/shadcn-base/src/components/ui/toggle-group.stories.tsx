import {
  ToggleGroup as ShadcnToggleGroup,
  ToggleGroupItem,
} from './toggle-group';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  defaultValue?: boolean | string;
  disabled?: boolean | string;
  multiple?: boolean | string;
  orientation?: boolean | string;
  size?: boolean | string;
  spacing?: number | string;
  variant?: boolean | string;
};

const ORIENTATIONS = ['horizontal', 'vertical'] as const;
const SIZES = ['default', 'sm', 'lg'] as const;
const VARIANTS = ['default', 'outline'] as const;

const DEFAULT_PROPS = {
  defaultValue: 'item-1',
  disabled: false,
  variant: 'outline',
  orientation: 'horizontal',
  size: 'default',
  multiple: false,
  spacing: 2,
} as const;

const meta = {
  title: 'shadcn/Base UI/Toggle Group',
  component: ShadcnToggleGroup,
  authoring: {
    group: 'Actions',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    variant: { control: 'select', options: VARIANTS },
    orientation: { control: 'select', options: ORIENTATIONS },
    size: { control: 'select', options: SIZES },
    multiple: { control: 'boolean' },
    spacing: { control: { type: 'number', min: 0, max: 8, step: 1 } },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ToggleGroupItem'],
        sourceFile: 'src/components/ui/toggle-group.tsx',
      },
    ],
    jsxChildren:
      '<ToggleGroupItem value="item-1">Item 1</ToggleGroupItem><ToggleGroupItem value="item-2">Item 2</ToggleGroupItem>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const ToggleGroup = {
  name: 'ToggleGroup',
  render: (args: Args) => (
    <ShadcnToggleGroup
      key={`${args.disabled}-${args.multiple}-${args.orientation}-${args.size}-${args.spacing}-${args.variant}`}
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      disabled={asBoolean(args.disabled, DEFAULT_PROPS.disabled)}
      multiple={asBoolean(args.multiple, DEFAULT_PROPS.multiple)}
      orientation={asOption(args.orientation, ORIENTATIONS, 'horizontal')}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      spacing={asNumber(args.spacing, DEFAULT_PROPS.spacing, { min: 0, max: 8 })}
      variant={asOption(args.variant, VARIANTS, 'outline')}
    >
      <ToggleGroupItem value="item-1">Item 1</ToggleGroupItem>
      <ToggleGroupItem value="item-2">Item 2</ToggleGroupItem>
    </ShadcnToggleGroup>
  ),
};

export const ToggleGroupItemStory = {
  name: 'ToggleGroupItem',
  sourceInsert: {
    props: {
      children: 'Item',
      value: 'item-1',
    },
  },
  render: () => (
    <ShadcnToggleGroup defaultValue="item-1">
      <ToggleGroupItem value="item-1">Item</ToggleGroupItem>
    </ShadcnToggleGroup>
  ),
};
