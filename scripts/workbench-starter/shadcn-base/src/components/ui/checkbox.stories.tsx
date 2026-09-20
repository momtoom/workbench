import { Checkbox as ShadcnCheckbox, CheckboxField as ShadcnCheckboxField } from './checkbox';
import { Label } from './label';
import { asBoolean, asText } from './story-utils';

type Args = {
  defaultChecked?: boolean | string;
  disabled?: boolean | string;
};

const DEFAULT_PROPS = {
  defaultChecked: true,
  disabled: false,
} as const;

const meta = {
  title: 'shadcn/Base UI/Checkbox',
  component: ShadcnCheckboxField,
  authoring: {
    group: 'Inputs',
  },
  args: {
    ...DEFAULT_PROPS,
    label: 'Checkbox label',
  },
  argTypes: {
    label: { control: 'text' },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  sourceInsert: {
    props: {
      ...DEFAULT_PROPS,
      label: 'Checkbox label',
    },
  },
};
export default meta;

export const CheckboxField = {
  name: 'CheckboxField',
  render: (args: Args) => {
    const checked = asBoolean(args.defaultChecked, true);
    return (
      <ShadcnCheckboxField
        key={String(checked)}
        defaultChecked={checked}
        disabled={asBoolean(args.disabled)}
        label={asText(args.label, 'Checkbox label')}
      />
    );
  },
};

export const CheckboxStory = {
  name: 'Checkbox',
  args: DEFAULT_PROPS,
  argTypes: {
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  sourceInsert: {
    props: {
      defaultChecked: true,
      disabled: false,
    },
  },
  render: (args: Args) => {
    const checked = asBoolean(args.defaultChecked, true);
    return (
      <Label className="w-fit">
        <ShadcnCheckbox key={String(checked)} defaultChecked={checked} disabled={asBoolean(args.disabled)} />
        Checkbox label
      </Label>
    );
  },
};
