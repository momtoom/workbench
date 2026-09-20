import {
  NativeSelect as ShadcnNativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from './native-select';
import { asOption } from './story-utils';

type Args = {
  defaultValue?: boolean | string;
  size?: boolean | string;
};

const DEFAULT_VALUES = ['item-1', 'item-2'] as const;
const SIZES = ['default', 'sm'] as const;

const DEFAULT_PROPS = {
  defaultValue: 'item-1',
  size: 'default',
} as const;

const meta = {
  title: 'shadcn/Base UI/Native Select',
  component: ShadcnNativeSelect,
  authoring: {
    group: 'Inputs',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'select', options: DEFAULT_VALUES },
    size: { control: 'select', options: SIZES },
  },
  sourceInsert: {
    imports: [
      {
        names: ['NativeSelectOptGroup', 'NativeSelectOption'],
        sourceFile: 'src/components/ui/native-select.tsx',
      },
    ],
    jsxChildren:
      '<NativeSelectOptGroup label="Options"><NativeSelectOption value="item-1">Item 1</NativeSelectOption><NativeSelectOption value="item-2">Item 2</NativeSelectOption></NativeSelectOptGroup>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const NativeSelect = {
  name: 'NativeSelect',
  render: (args: Args) => (
    <ShadcnNativeSelect
      defaultValue={asOption(args.defaultValue, DEFAULT_VALUES, DEFAULT_PROPS.defaultValue)}
      size={asOption(args.size, SIZES, 'default')}
    >
      <NativeSelectOptGroup label="Options">
        <NativeSelectOption value="item-1">Item 1</NativeSelectOption>
        <NativeSelectOption value="item-2">Item 2</NativeSelectOption>
      </NativeSelectOptGroup>
    </ShadcnNativeSelect>
  ),
};

export const NativeSelectOptionStory = {
  name: 'NativeSelectOption',
  sourceInsert: {
    props: {
      children: 'Item',
      value: 'item-1',
    },
  },
  render: () => <ShadcnNativeSelect><NativeSelectOption value="item-1">Item</NativeSelectOption></ShadcnNativeSelect>,
};

export const NativeSelectOptGroupStory = {
  name: 'NativeSelectOptGroup',
  sourceInsert: {
    imports: [
      {
        names: ['NativeSelectOption'],
        sourceFile: 'src/components/ui/native-select.tsx',
      },
    ],
    jsxChildren: '<NativeSelectOption value="item-1">Item</NativeSelectOption>',
    props: {
      label: 'Options',
    },
  },
  render: () => <ShadcnNativeSelect><NativeSelectOptGroup label="Options"><NativeSelectOption value="item-1">Item</NativeSelectOption></NativeSelectOptGroup></ShadcnNativeSelect>,
};
