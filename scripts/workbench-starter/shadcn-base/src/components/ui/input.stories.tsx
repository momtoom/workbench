import { Input as ShadcnInput } from './input';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  'aria-invalid'?: boolean | string;
  defaultValue?: boolean | string;
  disabled?: boolean | string;
  placeholder?: boolean | string;
  readOnly?: boolean | string;
  type?: boolean | string;
};

const TYPES = ['text', 'email', 'password', 'search', 'url'] as const;

const DEFAULT_PROPS = {
  placeholder: 'Email address',
  defaultValue: 'name@example.com',
  disabled: false,
  readOnly: false,
  type: 'email',
  'aria-invalid': false,
} as const;

const meta = {
  title: 'shadcn/Base UI/Input',
  component: ShadcnInput,
  authoring: {
    group: 'Inputs',
    roles: ['control.input'],
    nativeReplacements: ['input'],
    priority: 100,
  },
  args: DEFAULT_PROPS,
  argTypes: {
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    type: { control: 'select', options: TYPES },
    'aria-invalid': { control: 'boolean' },
  },
  sourceInsert: {
    props: {
      placeholder: 'Email address',
      defaultValue: 'name@example.com',
      disabled: false,
      readOnly: false,
      type: 'email',
      'aria-invalid': false,
    },
  },
};
export default meta;

export const Input = {
  name: 'Input',
  render: (args: Args) => (
    <ShadcnInput
      aria-invalid={asBoolean(args['aria-invalid'])}
      className="w-[min(22rem,100%)]"
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      disabled={asBoolean(args.disabled)}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
      readOnly={asBoolean(args.readOnly)}
      type={asOption(args.type, TYPES, 'email')}
    />
  ),
};
