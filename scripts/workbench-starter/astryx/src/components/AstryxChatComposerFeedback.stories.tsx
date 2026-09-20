import { AstryxChatComposerFeedback as Component } from './AstryxChatComposerFeedback';
import { AstryxChatComposerFeedbackOption } from './AstryxChatComposerFeedbackOption';

const DEFAULT_PROPS = {
  defaultSelectedKey: '',
  question: 'Do you want to proceed?',
} as const;

const meta = {
  title: 'Astryx/ChatComposerFeedback',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    defaultSelectedKey: { control: 'text' },
    question: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxChatComposerFeedbackOption'],
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxChatComposerFeedbackOption optionKey="A" label="Yes" />\n<AstryxChatComposerFeedbackOption optionKey="B" label="Yes, and don’t ask again for `git add` commands" />\n<AstryxChatComposerFeedbackOption optionKey="C" label="No, and tell me what to do differently" />',
    imports: [
      {
        names: ['AstryxChatComposerFeedbackOption'],
        sourceFile: 'src/components/AstryxChatComposerFeedbackOption.tsx',
      },
    ],
  },
};

export default meta;
export const AstryxChatComposerFeedback = {
  name: 'AstryxChatComposerFeedback',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxChatComposerFeedbackOption optionKey="A" label="Yes" />
      <AstryxChatComposerFeedbackOption optionKey="B" label="Yes, and don’t ask again for `git add` commands" />
      <AstryxChatComposerFeedbackOption optionKey="C" label="No, and tell me what to do differently" />
    </Component>
  ),
};
