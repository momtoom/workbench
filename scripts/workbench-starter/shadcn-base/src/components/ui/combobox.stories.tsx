import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxOption,
  ComboboxSeparator,
  ComboboxSection,
  ComboboxTrigger,
  ComboboxValue,
} from './combobox';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  align?: boolean | string;
  children?: boolean | string;
  defaultOpen?: boolean | string;
  defaultValue?: boolean | string;
  disabled?: boolean | string;
  label?: boolean | string;
  placeholder?: boolean | string;
  showClear?: boolean | string;
  showRemove?: boolean | string;
  showTrigger?: boolean | string;
  side?: boolean | string;
  sideOffset?: number | string;
  value?: boolean | string;
};

const ALIGNS = ['start', 'center', 'end'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const DEFAULT_PROPS = {
  placeholder: 'Select an item',
  defaultValue: 'item-1',
  disabled: false,
  defaultOpen: false,
} as const;

const meta = {
  title: 'shadcn/Base UI/Combobox',
  component: Combobox,
  authoring: {
    group: 'Inputs',
  },
  args: {
    defaultValue: DEFAULT_PROPS.defaultValue,
    disabled: DEFAULT_PROPS.disabled,
    defaultOpen: DEFAULT_PROPS.defaultOpen,
  },
  argTypes: {
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [
      {
        names: [
          'ComboboxContent',
          'ComboboxInput',
          'ComboboxList',
          'ComboboxOption',
          'ComboboxSection',
          'ComboboxSeparator',
        ],
        sourceFile: 'src/components/ui/combobox.tsx',
      },
    ],
    jsxChildren:
      '<ComboboxInput placeholder="Select an item" /><ComboboxContent><ComboboxList><ComboboxSection label="Options"><ComboboxOption value="item-1">Item 1</ComboboxOption><ComboboxSeparator /><ComboboxOption value="item-2">Item 2</ComboboxOption></ComboboxSection></ComboboxList></ComboboxContent>',
    props: {
      defaultValue: DEFAULT_PROPS.defaultValue,
      disabled: DEFAULT_PROPS.disabled,
      defaultOpen: DEFAULT_PROPS.defaultOpen,
    },
  },
};
export default meta;

export const Default = {
  name: 'Combobox',
  render: (args: Args) => {
    const defaultOpen = asBoolean(args.defaultOpen, DEFAULT_PROPS.defaultOpen);
    const defaultValue = asText(args.defaultValue, DEFAULT_PROPS.defaultValue);
    const disabled = asBoolean(args.disabled, DEFAULT_PROPS.disabled);

    return (
      <Combobox
        key={`${defaultOpen}-${defaultValue}-${disabled}`}
        defaultOpen={defaultOpen}
        defaultValue={defaultValue}
        disabled={disabled}
      >
        <ComboboxInput placeholder={DEFAULT_PROPS.placeholder} />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxSection label="Options">
              <ComboboxOption value="item-1">Item 1</ComboboxOption>
              <ComboboxSeparator />
              <ComboboxOption value="item-2">Item 2</ComboboxOption>
            </ComboboxSection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    );
  },
};

export const ComboboxSectionStory = {
  name: 'ComboboxSection',
  args: {
    label: 'Options',
  },
  argTypes: {
    label: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ComboboxOption'],
        sourceFile: 'src/components/ui/combobox.tsx',
      },
    ],
    jsxChildren: '<ComboboxOption value="item-1">Item</ComboboxOption>',
    props: {
      label: 'Options',
    },
  },
  render: (args: Args) => (
    <Combobox defaultOpen>
      <ComboboxInput placeholder="Select an item" />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxSection label={asText(args.label, 'Options')}>
            <ComboboxOption value="item-1">Item</ComboboxOption>
          </ComboboxSection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const ComboboxOptionStory = {
  name: 'ComboboxOption',
  args: {
    children: 'Item',
    value: 'item-1',
  },
  argTypes: {
    children: { control: 'text' },
    value: { control: 'text' },
  },
  sourceInsert: {
    props: {
      children: 'Item',
      value: 'item-1',
    },
  },
  render: (args: Args) => (
    <Combobox defaultOpen>
      <ComboboxInput placeholder="Select an item" />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxOption value={asText(args.value, 'item-1')}>
            {asText(args.children, 'Item')}
          </ComboboxOption>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const ComboboxInputStory = {
  name: 'ComboboxInput',
  args: {
    placeholder: 'Select an item',
    disabled: false,
    showClear: false,
    showTrigger: true,
  },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    showClear: { control: 'boolean' },
    showTrigger: { control: 'boolean' },
  },
  sourceInsert: {
    props: {
      placeholder: 'Select an item',
      disabled: false,
      showClear: false,
      showTrigger: true,
    },
  },
  render: (args: Args) => (
    <Combobox>
      <ComboboxInput
        disabled={asBoolean(args.disabled)}
        placeholder={asText(args.placeholder, 'Select an item')}
        showClear={asBoolean(args.showClear)}
        showTrigger={asBoolean(args.showTrigger, true)}
      />
    </Combobox>
  ),
};

export const ComboboxContentStory = {
  name: 'ComboboxContent',
  args: {
    align: 'start',
    side: 'bottom',
    sideOffset: 6,
  },
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    side: { control: 'select', options: SIDES },
    sideOffset: { control: { type: 'number', min: 0, max: 32, step: 1 } },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ComboboxList', 'ComboboxItem'],
        sourceFile: 'src/components/ui/combobox.tsx',
      },
    ],
    jsxChildren: '<ComboboxList><ComboboxItem value="item-1">Item</ComboboxItem></ComboboxList>',
    props: {
      align: 'start',
      side: 'bottom',
      sideOffset: 6,
    },
  },
  render: (args: Args) => (
    <Combobox defaultOpen>
      <ComboboxInput placeholder="Select an item" />
      <ComboboxContent
        align={asOption(args.align, ALIGNS, 'start')}
        side={asOption(args.side, SIDES, 'bottom')}
        sideOffset={asNumber(args.sideOffset, 6, { min: 0, max: 32 })}
      >
        <ComboboxList><ComboboxItem value="item-1">Item</ComboboxItem></ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const ComboboxListStory = {
  name: 'ComboboxList',
  sourceInsert: {
    imports: [
      {
        names: ['ComboboxItem'],
        sourceFile: 'src/components/ui/combobox.tsx',
      },
    ],
    jsxChildren: '<ComboboxItem value="item-1">Item</ComboboxItem>',
  },
  render: () => (
    <Combobox defaultOpen>
      <ComboboxInput placeholder="Select an item" />
      <ComboboxContent><ComboboxList><ComboboxItem value="item-1">Item</ComboboxItem></ComboboxList></ComboboxContent>
    </Combobox>
  ),
};

export const ComboboxEmptyStory = {
  name: 'ComboboxEmpty',
  args: {
    children: 'No item found.',
  },
  argTypes: {
    children: { control: 'text' },
  },
  sourceInsert: {
    props: {
      children: 'No item found.',
    },
  },
  render: (args: Args) => (
    <Combobox defaultOpen>
      <ComboboxInput placeholder="Select an item" />
      <ComboboxContent><ComboboxList><ComboboxEmpty>{asText(args.children, 'No item found.')}</ComboboxEmpty></ComboboxList></ComboboxContent>
    </Combobox>
  ),
};

export const ComboboxGroupStory = {
  name: 'ComboboxGroup',
  sourceInsert: {
    imports: [
      {
        names: ['ComboboxLabel', 'ComboboxItem'],
        sourceFile: 'src/components/ui/combobox.tsx',
      },
    ],
    jsxChildren: '<ComboboxLabel>Options</ComboboxLabel><ComboboxItem value="item-1">Item</ComboboxItem>',
  },
  render: () => (
    <Combobox defaultOpen>
      <ComboboxInput placeholder="Select an item" />
      <ComboboxContent>
        <ComboboxList><ComboboxGroup><ComboboxLabel>Options</ComboboxLabel><ComboboxItem value="item-1">Item</ComboboxItem></ComboboxGroup></ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const ComboboxLabelStory = {
  name: 'ComboboxLabel',
  args: {
    children: 'Options',
  },
  argTypes: {
    children: { control: 'text' },
  },
  sourceInsert: {
    props: {
      children: 'Options',
    },
  },
  render: (args: Args) => (
    <Combobox defaultOpen>
      <ComboboxInput placeholder="Select an item" />
      <ComboboxContent><ComboboxList><ComboboxLabel>{asText(args.children, 'Options')}</ComboboxLabel></ComboboxList></ComboboxContent>
    </Combobox>
  ),
};

export const ComboboxItemStory = {
  name: 'ComboboxItem',
  args: {
    children: 'Item',
    value: 'item-1',
  },
  argTypes: {
    children: { control: 'text' },
    value: { control: 'text' },
  },
  sourceInsert: {
    props: {
      children: 'Item',
      value: 'item-1',
    },
  },
  render: (args: Args) => (
    <Combobox defaultOpen>
      <ComboboxInput placeholder="Select an item" />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxItem value={asText(args.value, 'item-1')}>
            {asText(args.children, 'Item')}
          </ComboboxItem>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const ComboboxSeparatorStory = {
  name: 'ComboboxSeparator',
  sourceInsert: {},
  render: () => (
    <Combobox defaultOpen>
      <ComboboxInput placeholder="Select an item" />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxItem value="item-1">Item 1</ComboboxItem>
          <ComboboxSeparator />
          <ComboboxItem value="item-2">Item 2</ComboboxItem>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const ComboboxTriggerStory = {
  name: 'ComboboxTrigger',
  args: {
    children: '',
  },
  argTypes: {
    children: { control: 'text' },
  },
  sourceInsert: {
    props: {
      children: '',
    },
  },
  render: (args: Args) => (
    <Combobox>
      <ComboboxTrigger>{asText(args.children, '')}</ComboboxTrigger>
    </Combobox>
  ),
};

export const ComboboxValueStory = {
  name: 'ComboboxValue',
  args: {
    placeholder: 'Select an item',
  },
  argTypes: {
    placeholder: { control: 'text' },
  },
  sourceInsert: {
    props: {
      placeholder: 'Select an item',
    },
  },
  render: (args: Args) => (
    <Combobox>
      <ComboboxTrigger>
        <ComboboxValue placeholder={asText(args.placeholder, 'Select an item')} />
      </ComboboxTrigger>
    </Combobox>
  ),
};

export const ComboboxCollectionStory = {
  name: 'ComboboxCollection',
  render: () => (
    <Combobox defaultOpen items={[{ label: 'Item', value: 'item-1' }]}>
      <ComboboxInput placeholder="Select an item" />
      <ComboboxContent>
        <ComboboxCollection>
          {(item) => <ComboboxItem key={item.value} value={item.value}>{item.label}</ComboboxItem>}
        </ComboboxCollection>
      </ComboboxContent>
    </Combobox>
  ),
};

export const ComboboxChipsStory = {
  name: 'ComboboxChips',
  sourceInsert: {
    imports: [
      {
        names: ['ComboboxChip', 'ComboboxChipsInput'],
        sourceFile: 'src/components/ui/combobox.tsx',
      },
    ],
    jsxChildren: '<ComboboxChip>Item</ComboboxChip><ComboboxChipsInput placeholder="Add item" />',
  },
  render: () => (
    <Combobox>
      <ComboboxChips>
        <ComboboxChip>Item</ComboboxChip>
        <ComboboxChipsInput placeholder="Add item" />
      </ComboboxChips>
    </Combobox>
  ),
};

export const ComboboxChipStory = {
  name: 'ComboboxChip',
  args: {
    children: 'Item',
    showRemove: true,
  },
  argTypes: {
    children: { control: 'text' },
    showRemove: { control: 'boolean' },
  },
  sourceInsert: {
    props: {
      children: 'Item',
      showRemove: true,
    },
  },
  render: (args: Args) => (
    <Combobox>
      <ComboboxChips>
        <ComboboxChip showRemove={asBoolean(args.showRemove, true)}>
          {asText(args.children, 'Item')}
        </ComboboxChip>
      </ComboboxChips>
    </Combobox>
  ),
};

export const ComboboxChipsInputStory = {
  name: 'ComboboxChipsInput',
  args: {
    placeholder: 'Add item',
  },
  argTypes: {
    placeholder: { control: 'text' },
  },
  sourceInsert: {
    props: {
      placeholder: 'Add item',
    },
  },
  render: (args: Args) => (
    <Combobox>
      <ComboboxChips><ComboboxChipsInput placeholder={asText(args.placeholder, 'Add item')} /></ComboboxChips>
    </Combobox>
  ),
};
