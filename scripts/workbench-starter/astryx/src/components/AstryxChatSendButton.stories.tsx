import { AstryxChatSendButton as Component } from './AstryxChatSendButton';

const DEFAULT_PROPS = {
  size: 'md',
  isDisabled: false,
  isStopShown: false,
} as const;

const meta = {
  title: 'Astryx/ChatSendButton',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    isDisabled: { control: 'boolean' },
    isStopShown: { control: 'boolean' },
  },
  authoring: {
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};

export default meta;
export const AstryxChatSendButton = {
  name: 'AstryxChatSendButton',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
