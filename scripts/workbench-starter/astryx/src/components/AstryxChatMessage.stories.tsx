import { AstryxChatMessage as Component } from './AstryxChatMessage';
import { AstryxChatMessageBubble } from './AstryxChatMessageBubble';
import { AstryxChatMessageMetadata } from './AstryxChatMessageMetadata';
import { AstryxChatTokenizedText } from './AstryxChatTokenizedText';

const DEFAULT_PROPS = {
  avatarImage: '',
  avatarName: 'Astryx Assistant',
  density: 'balanced',
  hasAvatar: true,
  sender: 'assistant',
} as const;
const meta = {
  title: 'Astryx/ChatMessage',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    avatarImage: {
      assetKinds: ['image', 'icon'],
      control: 'text',
      name: 'Avatar image',
      picker: 'asset-token',
      tokenTypes: ['string'],
    },
    avatarName: { control: 'text' },
    density: { control: 'select', options: ['compact', 'balanced', 'spacious'] },
    hasAvatar: { control: 'boolean', name: 'Has avatar' },
    sender: { control: 'select', options: ['assistant', 'user'] },
  },
  authoring: {
    allowedChildren: [
      'AstryxChatMessageBubble',
      'AstryxChatToolCalls',
      'AstryxChatMessageMetadata',
      'AstryxChatTokenizedText',
      'AstryxMarkdown',
      'AstryxCode',
      'AstryxCodeBlock',
    ],
    group: 'Chat',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxChatMessageBubble name="Astryx Assistant" variant="filled"><AstryxChatTokenizedText text="Ask @design about the latest changes." tokenLabel="@design" tokenValue="@design" tokenVariant="blue" /></AstryxChatMessageBubble>\n<AstryxChatMessageMetadata status="read" timestamp="10:24" />',
    imports: [
      {
        names: ['AstryxChatMessageBubble'],
        sourceFile: 'src/components/AstryxChatMessageBubble.tsx',
      },
      {
        names: ['AstryxChatMessageMetadata'],
        sourceFile: 'src/components/AstryxChatMessageMetadata.tsx',
      },
      {
        names: ['AstryxChatTokenizedText'],
        sourceFile: 'src/components/AstryxChatTokenizedText.tsx',
      },
    ],
  },
};
export default meta;
export const AstryxChatMessage = {
  name: 'AstryxChatMessage',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxChatMessageBubble
        name="Astryx Assistant"
        variant="filled"
      >
        <AstryxChatTokenizedText
          text="Ask @design about the latest changes."
          tokenLabel="@design"
          tokenValue="@design"
          tokenVariant="blue"
        />
      </AstryxChatMessageBubble>
      <AstryxChatMessageMetadata status="read" timestamp="10:24" />
    </Component>
  ),
};
