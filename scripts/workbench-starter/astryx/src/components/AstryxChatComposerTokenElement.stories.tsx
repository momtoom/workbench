import { AstryxChatComposerTokenElement as Component } from './AstryxChatComposerTokenElement';

const VARIANTS = [
  'neutral',
  'info',
  'success',
  'warning',
  'error',
  'blue',
  'cyan',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
] as const;

const DEFAULT_PROPS = {
  label: '@design',
  value: '@design',
  variant: 'blue',
} as const;

const meta = {
  title: 'Astryx/ChatComposerTokenElement',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
  },
  authoring: {
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};

export default meta;
export const AstryxChatComposerTokenElement = {
  name: 'AstryxChatComposerTokenElement',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
