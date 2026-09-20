import type { ReactNode } from 'react';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  align?: boolean | string;
  alignItemWithTrigger?: boolean | string;
  defaultValue?: boolean | string;
  placeholder?: boolean | string;
  side?: boolean | string;
  sideOffset?: number | string;
  size?: boolean | string;
};

const ALIGNS = ['start', 'center', 'end'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;
const SIZES = ['default', 'sm'] as const;
const DEFAULT_PROPS = {
  placeholder: 'Select an option',
  defaultValue: 'item-1',
} as const;

function SelectContentPreview({ children }: { children: ReactNode }) {
  return (
    <ShadcnSelect defaultOpen>
      <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </ShadcnSelect>
  );
}

const meta = {
  title: 'shadcn/Base UI/Select',
  component: ShadcnSelect,
  authoring: {
    group: 'Inputs',
    roles: ['control.selection'],
    nativeReplacements: ['select'],
    priority: 100,
  },
  args: {
    defaultValue: DEFAULT_PROPS.defaultValue,
  },
  argTypes: {
    defaultValue: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: [
          'SelectContent',
          'SelectGroup',
          'SelectItem',
          'SelectLabel',
          'SelectSeparator',
          'SelectTrigger',
          'SelectValue',
        ],
        sourceFile: 'src/components/ui/select.tsx',
      },
    ],
    jsxChildren:
      '<SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger><SelectContent><SelectGroup><SelectLabel>Options</SelectLabel><SelectItem value="item-1">Item 1</SelectItem><SelectSeparator /><SelectItem value="item-2">Item 2</SelectItem></SelectGroup></SelectContent>',
    props: {
      defaultValue: DEFAULT_PROPS.defaultValue,
    },
  },
};
export default meta;

export const Select = {
  name: 'Select',
  render: (args: Args) => {
    const defaultValue = asText(args.defaultValue, DEFAULT_PROPS.defaultValue);
    return (
      <ShadcnSelect
        key={defaultValue}
        defaultValue={defaultValue}
      >
        <SelectTrigger>
          <SelectValue placeholder={DEFAULT_PROPS.placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Options</SelectLabel>
            <SelectItem value="item-1">Item 1</SelectItem>
            <SelectSeparator />
            <SelectItem value="item-2">Item 2</SelectItem>
          </SelectGroup>
        </SelectContent>
      </ShadcnSelect>
    );
  },
};

export const SelectTriggerStory = {
  name: 'SelectTrigger',
  args: {
    size: 'default',
  },
  argTypes: {
    size: { control: 'select', options: SIZES },
  },
  sourceInsert: {
    imports: [
      {
        names: ['SelectValue'],
        sourceFile: 'src/components/ui/select.tsx',
      },
    ],
    jsxChildren: '<SelectValue placeholder="Select an option" />',
    props: {
      size: 'default',
    },
  },
  render: (args: Args) => (
    <ShadcnSelect>
      <SelectTrigger size={asOption(args.size, SIZES, 'default')}>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
    </ShadcnSelect>
  ),
};

export const SelectValueStory = {
  name: 'SelectValue',
  sourceInsert: {
    props: {
      placeholder: 'Select an option',
    },
  },
  render: () => (
    <ShadcnSelect>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
    </ShadcnSelect>
  ),
};

export const SelectContentStory = {
  name: 'SelectContent',
  args: {
    align: 'center',
    alignItemWithTrigger: true,
    side: 'bottom',
    sideOffset: 4,
  },
  argTypes: {
    align: { control: 'select', options: ALIGNS },
    alignItemWithTrigger: { control: 'boolean' },
    side: { control: 'select', options: SIDES },
    sideOffset: { control: { type: 'number', min: 0, max: 32, step: 1 } },
  },
  sourceInsert: {
    imports: [
      {
        names: ['SelectGroup', 'SelectItem'],
        sourceFile: 'src/components/ui/select.tsx',
      },
    ],
    jsxChildren: '<SelectGroup><SelectItem value="item-1">Item</SelectItem></SelectGroup>',
    props: {
      align: 'center',
      alignItemWithTrigger: true,
      side: 'bottom',
      sideOffset: 4,
    },
  },
  render: (args: Args) => (
    <ShadcnSelect defaultOpen>
      <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
      <SelectContent
        align={asOption(args.align, ALIGNS, 'center')}
        alignItemWithTrigger={asBoolean(args.alignItemWithTrigger, true)}
        side={asOption(args.side, SIDES, 'bottom')}
        sideOffset={asNumber(args.sideOffset, 4, { min: 0, max: 32 })}
      >
        <SelectGroup><SelectItem value="item-1">Item</SelectItem></SelectGroup>
      </SelectContent>
    </ShadcnSelect>
  ),
};

export const SelectGroupStory = {
  name: 'SelectGroup',
  sourceInsert: {
    imports: [
      {
        names: ['SelectLabel', 'SelectItem'],
        sourceFile: 'src/components/ui/select.tsx',
      },
    ],
    jsxChildren: '<SelectLabel>Options</SelectLabel><SelectItem value="item-1">Item</SelectItem>',
  },
  render: () => (
    <SelectContentPreview>
      <SelectGroup>
        <SelectLabel>Options</SelectLabel>
        <SelectItem value="item-1">Item</SelectItem>
      </SelectGroup>
    </SelectContentPreview>
  ),
};

export const SelectItemStory = {
  name: 'SelectItem',
  sourceInsert: {
    props: {
      children: 'Item',
      value: 'item-1',
    },
  },
  render: () => (
    <SelectContentPreview>
      <SelectItem value="item-1">Item</SelectItem>
    </SelectContentPreview>
  ),
};

export const SelectLabelStory = {
  name: 'SelectLabel',
  sourceInsert: {
    props: {
      children: 'Options',
    },
  },
  render: () => (
    <SelectContentPreview>
      <SelectGroup>
        <SelectLabel>Options</SelectLabel>
        <SelectItem value="item-1">Item</SelectItem>
      </SelectGroup>
    </SelectContentPreview>
  ),
};

export const SelectSeparatorStory = {
  name: 'SelectSeparator',
  sourceInsert: {},
  render: () => (
    <SelectContentPreview>
      <SelectItem value="item-1">Item 1</SelectItem>
      <SelectSeparator />
      <SelectItem value="item-2">Item 2</SelectItem>
    </SelectContentPreview>
  ),
};
