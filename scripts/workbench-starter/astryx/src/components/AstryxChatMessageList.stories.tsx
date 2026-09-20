import { AstryxChatMessage } from './AstryxChatMessage';
import { AstryxChatMessageBubble } from './AstryxChatMessageBubble';
import { AstryxChatMessageList as Component } from './AstryxChatMessageList';
import { AstryxChatMessageMetadata } from './AstryxChatMessageMetadata';
import { AstryxChatSystemMessage } from './AstryxChatSystemMessage';

const DEFAULT_PROPS = {
  gap: 4,
  density: 'balanced',
  emptyStateText: 'Start a conversation',
  isStreaming: false,
} as const;

const meta = {
  title: 'Astryx/ChatMessageList',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    gap: { control: 'select', options: [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] },
    density: { control: 'select', options: ['compact', 'balanced', 'spacious'] },
    emptyStateText: { control: 'text' },
    isStreaming: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxChatMessage', 'AstryxChatSystemMessage'],
    group: 'Chat',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxChatSystemMessage message="Today" variant="divider" />\n<AstryxChatMessage avatarName="Astryx Assistant" sender="assistant"><AstryxChatMessageBubble name="Astryx Assistant">How can I help?</AstryxChatMessageBubble><AstryxChatMessageMetadata status="read" timestamp="10:24" /></AstryxChatMessage>\n<AstryxChatMessage sender="user"><AstryxChatMessageBubble name="You">Review the component contracts.</AstryxChatMessageBubble><AstryxChatMessageMetadata status="sent" timestamp="10:25" /></AstryxChatMessage>',
    imports: [
      { names: ['AstryxChatSystemMessage'], sourceFile: 'src/components/AstryxChatSystemMessage.tsx' },
      { names: ['AstryxChatMessage'], sourceFile: 'src/components/AstryxChatMessage.tsx' },
      { names: ['AstryxChatMessageBubble'], sourceFile: 'src/components/AstryxChatMessageBubble.tsx' },
      { names: ['AstryxChatMessageMetadata'], sourceFile: 'src/components/AstryxChatMessageMetadata.tsx' },
    ],
  },
};

export default meta;
export const AstryxChatMessageList = {
  name: 'AstryxChatMessageList',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxChatSystemMessage message="Today" variant="divider" />
      <AstryxChatMessage avatarName="Astryx Assistant" sender="assistant">
        <AstryxChatMessageBubble name="Astryx Assistant">
          How can I help?
        </AstryxChatMessageBubble>
        <AstryxChatMessageMetadata status="read" timestamp="10:24" />
      </AstryxChatMessage>
      <AstryxChatMessage sender="user">
        <AstryxChatMessageBubble name="You">
          Review the component contracts.
        </AstryxChatMessageBubble>
        <AstryxChatMessageMetadata status="sent" timestamp="10:25" />
      </AstryxChatMessage>
    </Component>
  ),
};
