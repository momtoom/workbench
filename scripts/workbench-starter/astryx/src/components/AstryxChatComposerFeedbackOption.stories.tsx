import { AstryxChatComposerFeedbackOption as Component } from './AstryxChatComposerFeedbackOption';

const DEFAULT_PROPS = {
  label: 'Yes',
  description: '',
  isDisabled: false,
  isSelected: false,
  optionKey: 'A',
} as const;

const meta = {
  title: 'Astryx/ChatComposerFeedbackOption',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    optionKey: { control: 'text' },
  },
  authoring: {
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};

export default meta;
export const AstryxChatComposerFeedbackOption = {
  name: 'AstryxChatComposerFeedbackOption',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
