import {
  InputGroup as ShadcnInputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './input-group';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  clearLabel?: boolean | string;
  control?: boolean | string;
  defaultValue?: boolean | string;
  disabled?: boolean | string;
  invalid?: boolean | string;
  leadingLabel?: boolean | string;
  placeholder?: boolean | string;
  readOnly?: boolean | string;
  showClearButton?: boolean | string;
  shortcut?: boolean | string;
};

const CONTROLS = ['input', 'textarea'] as const;

const DEFAULT_PROPS = {
  placeholder: 'Search items',
  defaultValue: '',
  disabled: false,
  readOnly: false,
  clearLabel: 'Clear input',
  control: 'input',
  invalid: false,
  leadingLabel: 'Search',
  shortcut: '⌘K',
  showClearButton: false,
} as const;

const meta = {
  title: 'shadcn/Base UI/Input Group',
  component: ShadcnInputGroup,
  authoring: {
    group: 'Inputs',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    clearLabel: { control: 'text' },
    control: { control: 'select', options: CONTROLS },
    invalid: { control: 'boolean' },
    leadingLabel: { control: 'text' },
    shortcut: { control: 'text' },
    showClearButton: { control: 'boolean' },
  },
  sourceInsert: {
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const InputGroup = {
  name: 'InputGroup',
  render: (args: Args) => (
    <div className="w-[min(24rem,100%)]">
      <ShadcnInputGroup
        clearLabel={asText(args.clearLabel, DEFAULT_PROPS.clearLabel)}
        control={asOption(args.control, CONTROLS, DEFAULT_PROPS.control)}
        defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
        disabled={asBoolean(args.disabled, DEFAULT_PROPS.disabled)}
        invalid={asBoolean(args.invalid, DEFAULT_PROPS.invalid)}
        leadingLabel={asText(args.leadingLabel, DEFAULT_PROPS.leadingLabel)}
        placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
        readOnly={asBoolean(args.readOnly, DEFAULT_PROPS.readOnly)}
        showClearButton={asBoolean(args.showClearButton, DEFAULT_PROPS.showClearButton)}
        shortcut={asText(args.shortcut, DEFAULT_PROPS.shortcut)}
      />
    </div>
  ),
};

export const InputGroupAddonStory = {
  name: 'InputGroupAddon',
  sourceInsert: {
    props: {
      children: 'Search',
    },
  },
  render: () => <ShadcnInputGroup><InputGroupAddon>Search</InputGroupAddon><InputGroupInput /></ShadcnInputGroup>,
};

export const InputGroupInputStory = {
  name: 'InputGroupInput',
  sourceInsert: {
    props: {
      placeholder: 'Search items',
    },
  },
  render: () => <ShadcnInputGroup><InputGroupInput placeholder="Search items" /></ShadcnInputGroup>,
};

export const InputGroupTextareaStory = {
  name: 'InputGroupTextarea',
  sourceInsert: {
    props: {
      placeholder: 'Write note',
    },
  },
  render: () => <ShadcnInputGroup><InputGroupTextarea placeholder="Write note" /></ShadcnInputGroup>,
};

export const InputGroupButtonStory = {
  name: 'InputGroupButton',
  sourceInsert: {
    props: {
      children: 'Settings',
    },
  },
  render: () => (
    <ShadcnInputGroup className="w-[min(24rem,100%)]">
      <InputGroupInput placeholder="Search items" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton>Settings</InputGroupButton>
      </InputGroupAddon>
    </ShadcnInputGroup>
  ),
};

export const InputGroupTextStory = {
  name: 'InputGroupText',
  sourceInsert: {
    props: {
      children: 'https://',
    },
  },
  render: () => <ShadcnInputGroup><InputGroupText>https://</InputGroupText><InputGroupInput /></ShadcnInputGroup>,
};
