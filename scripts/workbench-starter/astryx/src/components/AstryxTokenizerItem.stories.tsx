import { AstryxTokenizerItem as Component } from './AstryxTokenizerItem';

type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  label: 'Tokenizer item',
  description: 'Engineering',
  id: 'ada-lovelace',
  icon: 'none',
  endLabel: '',
  isDisabled: false,
  isSelected: false,
  tokenColor: 'default',
} as const;
const meta = {
  title: 'Astryx/TokenizerItem',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    id: { control: 'text' },
    icon: { control: 'icon' },
    endLabel: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    tokenColor: {
      control: 'select',
      options: ['default', 'red', 'orange', 'yellow', 'green', 'teal', 'cyan', 'blue', 'purple', 'pink', 'gray'],
    },
  },
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxTokenizerItem = {
  name: 'AstryxTokenizerItem',
  render: (args: Args) => <Component {...(args as typeof DEFAULT_PROPS)} />,
};
