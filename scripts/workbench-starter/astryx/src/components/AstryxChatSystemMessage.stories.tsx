import { AstryxChatSystemMessage as Component } from './AstryxChatSystemMessage';

const DEFAULT_PROPS = { message: 'Today', variant: 'divider' } as const;
const meta = {
  title: 'Astryx/ChatSystemMessage',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    message: { control: 'text' },
    variant: { control: 'select', options: ['default', 'divider'] },
  },
  authoring: {
    group: 'Chat',
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxChatSystemMessage = {
  name: 'AstryxChatSystemMessage',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
