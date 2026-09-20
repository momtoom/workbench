import { AstryxChatDictationButton as Component } from './AstryxChatDictationButton';

const DEFAULT_PROPS = {
  label: 'Start dictation',
  size: 'md',
  isDefaultListening: false,
} as const;

const meta = {
  title: 'Astryx/ChatDictationButton',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md'] },
    isDefaultListening: { control: 'boolean' },
  },
  authoring: {
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};

export default meta;
export const AstryxChatDictationButton = {
  name: 'AstryxChatDictationButton',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
