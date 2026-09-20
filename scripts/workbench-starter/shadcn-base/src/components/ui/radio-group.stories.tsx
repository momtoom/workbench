import { Label } from './label';
import {
  RadioGroup as ShadcnRadioGroup,
  RadioGroupItem,
  RadioGroupOption,
} from './radio-group';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  className?: boolean | string;
  defaultValue?: boolean | string;
  disabled?: boolean | string;
};

const DEFAULT_VALUES = ['item-1', 'item-2'] as const;

const DEFAULT_PROPS = {
  defaultValue: 'item-1',
  disabled: false,
  className: 'w-fit',
} as const;

const meta = {
  title: 'shadcn/Base UI/Radio Group',
  component: ShadcnRadioGroup,
  authoring: {
    group: 'Inputs',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'select', options: DEFAULT_VALUES },
    disabled: { control: 'boolean' },
    className: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['RadioGroupOption'],
        sourceFile: 'src/components/ui/radio-group.tsx',
      },
    ],
    jsxChildren:
      '<RadioGroupOption value="item-1">Item 1</RadioGroupOption><RadioGroupOption value="item-2">Item 2</RadioGroupOption>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const RadioGroup = {
  name: 'RadioGroup',
  render: (args: Args) => (
    <ShadcnRadioGroup
      className={asText(args.className, DEFAULT_PROPS.className)}
      defaultValue={asOption(args.defaultValue, DEFAULT_VALUES, DEFAULT_PROPS.defaultValue)}
      disabled={asBoolean(args.disabled)}
    >
      <RadioGroupOption value="item-1">Item 1</RadioGroupOption>
      <RadioGroupOption value="item-2">Item 2</RadioGroupOption>
    </ShadcnRadioGroup>
  ),
};

export const RadioGroupOptionStory = {
  name: 'RadioGroupOption',
  sourceInsert: {
    props: {
      children: 'Item',
      value: 'item-1',
    },
  },
  render: () => (
    <ShadcnRadioGroup className="w-fit" defaultValue="item-1">
      <RadioGroupOption value="item-1">Item</RadioGroupOption>
    </ShadcnRadioGroup>
  ),
};

export const RadioGroupItemStory = {
  name: 'RadioGroupItem',
  sourceInsert: {
    props: {
      value: 'item-1',
    },
  },
  render: () => (
    <ShadcnRadioGroup className="w-fit" defaultValue="item-1">
      <Label className="w-fit">
        <RadioGroupItem value="item-1" />
        Item
      </Label>
    </ShadcnRadioGroup>
  ),
};
