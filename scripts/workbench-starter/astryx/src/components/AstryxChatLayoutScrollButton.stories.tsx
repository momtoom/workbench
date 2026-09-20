import { AstryxChatLayoutScrollButton as Component } from './AstryxChatLayoutScrollButton';

const DEFAULT_PROPS = {
  label: 'New messages',
  isVisible: true,
} as const;

const meta = {
  title: 'Astryx/ChatLayoutScrollButton',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    isVisible: { control: 'boolean' },
  },
  authoring: {
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};

export default meta;
export const AstryxChatLayoutScrollButton = {
  name: 'AstryxChatLayoutScrollButton',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
