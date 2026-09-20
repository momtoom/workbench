import { AstryxChatTokenizedText as Component } from './AstryxChatTokenizedText';

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
  text: 'Ask @design about the latest changes.',
  tokenLabel: '@design',
  tokenValue: '@design',
  tokenVariant: 'blue',
} as const;

const meta = {
  title: 'Astryx/ChatTokenizedText',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    text: { control: 'text' },
    tokenLabel: { control: 'text' },
    tokenValue: { control: 'text' },
    tokenVariant: { control: 'select', options: VARIANTS },
  },
  authoring: {
    group: 'Chat',
  },
  sourceInsert: { props: DEFAULT_PROPS },
};

export default meta;
export const AstryxChatTokenizedText = {
  name: 'AstryxChatTokenizedText',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
