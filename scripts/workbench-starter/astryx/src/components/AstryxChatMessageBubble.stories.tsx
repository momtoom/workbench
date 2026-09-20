import { AstryxChatMessageBubble as Component } from './AstryxChatMessageBubble';
import { AstryxChatTokenizedText } from './AstryxChatTokenizedText';

const DEFAULT_PROPS = {
  name: '',
  variant: 'filled',
  group: 'none',
} as const;

const meta = {
  title: 'Astryx/ChatMessageBubble',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    name: { control: 'text' },
    variant: { control: 'select', options: ['filled', 'ghost'] },
    group: { control: 'select', options: ['none', 'first', 'middle', 'last'] },
  },
  authoring: {
    allowedChildren: [
      'AstryxChatTokenizedText',
      'AstryxText',
      'AstryxMarkdown',
      'AstryxCode',
      'AstryxCodeBlock',
      'AstryxLink',
    ],
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxChatTokenizedText text="Ask @design about the latest changes." tokenLabel="@design" tokenValue="@design" tokenVariant="blue" />',
    imports: [
      {
        names: ['AstryxChatTokenizedText'],
        sourceFile: 'src/components/AstryxChatTokenizedText.tsx',
      },
    ],
  },
};

export default meta;
export const AstryxChatMessageBubble = {
  name: 'AstryxChatMessageBubble',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxChatTokenizedText
        text="Ask @design about the latest changes."
        tokenLabel="@design"
        tokenValue="@design"
        tokenVariant="blue"
      />
    </Component>
  ),
};
