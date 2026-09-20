import { Label } from './label';
import { Switch as ShadcnSwitch, SwitchField as ShadcnSwitchField } from './switch';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  defaultChecked?: boolean | string;
  disabled?: boolean | string;
  size?: boolean | string;
};

const SIZES = ['default', 'sm'] as const;

const DEFAULT_PROPS = {
  defaultChecked: true,
  disabled: false,
  size: 'default',
} as const;

const meta = {
  title: 'shadcn/Base UI/Switch',
  component: ShadcnSwitchField,
  authoring: {
    group: 'Inputs',
  },
  args: {
    ...DEFAULT_PROPS,
    label: 'Enable preview mode',
  },
  argTypes: {
    label: { control: 'text' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: { control: 'select', options: SIZES },
  },
  sourceInsert: {
    props: {
      ...DEFAULT_PROPS,
      label: 'Enable preview mode',
    },
  },
};
export default meta;

export const SwitchField = {
  name: 'SwitchField',
  render: (args: Args) => {
    const checked = asBoolean(args.defaultChecked, true);
    return (
      <ShadcnSwitchField
        key={String(checked)}
        defaultChecked={checked}
        disabled={asBoolean(args.disabled)}
        label={asText(args.label, 'Enable preview mode')}
        size={asOption(args.size, SIZES, 'default')}
      />
    );
  },
};

export const SwitchStory = {
  name: 'Switch',
  args: DEFAULT_PROPS,
  argTypes: {
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    size: { control: 'select', options: SIZES },
  },
  sourceInsert: {
    props: {
      defaultChecked: true,
      disabled: false,
      size: 'default',
    },
  },
  render: (args: Args) => {
    const checked = asBoolean(args.defaultChecked, true);
    return (
      <Label className="w-fit">
        <ShadcnSwitch
          key={String(checked)}
          defaultChecked={checked}
          disabled={asBoolean(args.disabled)}
          size={asOption(args.size, SIZES, 'default')}
        />
        Enable preview mode
      </Label>
    );
  },
};
