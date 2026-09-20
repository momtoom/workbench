import { Textarea as ShadcnTextarea } from './textarea';
import { asBoolean, asText } from './story-utils';

type Args = {
  'aria-invalid'?: boolean | string;
  defaultValue?: boolean | string;
  disabled?: boolean | string;
  placeholder?: boolean | string;
};

const DEFAULT_PROPS = {
  placeholder: 'Write a note',
  defaultValue: 'Text content',
  disabled: false,
  'aria-invalid': false,
} as const;

const meta = {
  title: 'shadcn/Base UI/Textarea',
  component: ShadcnTextarea,
  authoring: {
    group: 'Inputs',
    roles: ['control.input'],
    nativeReplacements: ['textarea'],
    priority: 90,
  },
  args: DEFAULT_PROPS,
  argTypes: {
    placeholder: { control: 'text' },
    defaultValue: { control: 'textarea' },
    disabled: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
  sourceInsert: {
    props: {
      placeholder: 'Leave a note',
      defaultValue: 'Text content',
      disabled: false,
      'aria-invalid': false,
    },
  },
};
export default meta;

export const Textarea = {
  name: 'Textarea',
  render: (args: Args) => (
    <ShadcnTextarea
      aria-invalid={asBoolean(args['aria-invalid'])}
      className="w-[min(24rem,100%)]"
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      disabled={asBoolean(args.disabled)}
      placeholder={asText(args.placeholder, DEFAULT_PROPS.placeholder)}
    />
  ),
};
