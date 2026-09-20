import { AstryxChatComposer } from './AstryxChatComposer';
import { AstryxChatComposerInput } from './AstryxChatComposerInput';
import { AstryxChatComposerSuggestion } from './AstryxChatComposerSuggestion';
import { AstryxChatLayout as Component } from './AstryxChatLayout';
import { AstryxChatLayoutScrollButton } from './AstryxChatLayoutScrollButton';
import { AstryxChatMessage } from './AstryxChatMessage';
import { AstryxChatMessageBubble } from './AstryxChatMessageBubble';
import { AstryxChatMessageList } from './AstryxChatMessageList';
import { AstryxChatMessageMetadata } from './AstryxChatMessageMetadata';
import { AstryxChatSendButton } from './AstryxChatSendButton';
import { AstryxChatSystemMessage } from './AstryxChatSystemMessage';

const DEFAULT_PROPS = {
  density: 'balanced',
  emptyStateText: 'Start a conversation',
} as const;

const meta = {
  title: 'Astryx/ChatLayout',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    density: { control: 'select', options: ['compact', 'balanced', 'spacious'] },
    emptyStateText: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxChatMessageList', 'AstryxChatLayoutScrollButton', 'AstryxChatComposer'],
    group: 'Chat',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxChatMessageList density="balanced"><AstryxChatSystemMessage message="Today" variant="divider" /><AstryxChatMessage avatarName="Astryx Assistant" sender="assistant"><AstryxChatMessageBubble name="Astryx Assistant">The Chat hierarchy is source-editable.</AstryxChatMessageBubble><AstryxChatMessageMetadata status="read" timestamp="10:24" /></AstryxChatMessage></AstryxChatMessageList>\n<AstryxChatLayoutScrollButton isVisible label="New messages" />\n<AstryxChatComposer density="balanced" placeholder="Ask anything"><AstryxChatComposerInput label="Message input" maxRows={8}><AstryxChatComposerSuggestion trigger="@" value="cindy" label="Cindy Zhang" description="Design Systems" tokenLabel="Cindy Zhang" variant="blue" /><AstryxChatComposerSuggestion trigger="@" value="alex" label="Alex Johnson" description="Frontend" tokenLabel="Alex Johnson" variant="blue" /><AstryxChatComposerSuggestion trigger="@" value="sam" label="Sam Rivera" description="Backend" tokenLabel="Sam Rivera" variant="blue" /><AstryxChatComposerSuggestion trigger="@" value="jordan" label="Jordan Lee" description="Product" tokenLabel="Jordan Lee" variant="blue" /><AstryxChatComposerSuggestion trigger="/" value="summarize" label="summarize" description="Summarize the conversation" tokenLabel="/summarize" variant="yellow" /><AstryxChatComposerSuggestion trigger="/" value="translate" label="translate" description="Translate text to another language" tokenLabel="/translate" variant="yellow" /><AstryxChatComposerSuggestion trigger="/" value="search" label="search" description="Search the web or documents" tokenLabel="/search" variant="yellow" /><AstryxChatComposerSuggestion trigger="/" value="code" label="code" description="Generate or explain code" tokenLabel="/code" variant="yellow" /></AstryxChatComposerInput><AstryxChatSendButton size="md" /></AstryxChatComposer>',
    imports: [
      { names: ['AstryxChatMessageList'], sourceFile: 'src/components/AstryxChatMessageList.tsx' },
      { names: ['AstryxChatSystemMessage'], sourceFile: 'src/components/AstryxChatSystemMessage.tsx' },
      { names: ['AstryxChatMessage'], sourceFile: 'src/components/AstryxChatMessage.tsx' },
      { names: ['AstryxChatMessageBubble'], sourceFile: 'src/components/AstryxChatMessageBubble.tsx' },
      { names: ['AstryxChatMessageMetadata'], sourceFile: 'src/components/AstryxChatMessageMetadata.tsx' },
      { names: ['AstryxChatLayoutScrollButton'], sourceFile: 'src/components/AstryxChatLayoutScrollButton.tsx' },
      { names: ['AstryxChatComposer'], sourceFile: 'src/components/AstryxChatComposer.tsx' },
      { names: ['AstryxChatComposerInput'], sourceFile: 'src/components/AstryxChatComposerInput.tsx' },
      { names: ['AstryxChatComposerSuggestion'], sourceFile: 'src/components/AstryxChatComposerSuggestion.tsx' },
      { names: ['AstryxChatSendButton'], sourceFile: 'src/components/AstryxChatSendButton.tsx' },
    ],
  },
};

export default meta;
export const AstryxChatLayout = {
  name: 'AstryxChatLayout',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxChatMessageList density="balanced">
        <AstryxChatSystemMessage message="Today" variant="divider" />
        <AstryxChatMessage avatarName="Astryx Assistant" sender="assistant">
          <AstryxChatMessageBubble
            name="Astryx Assistant"
          >
            The Chat hierarchy is source-editable.
          </AstryxChatMessageBubble>
          <AstryxChatMessageMetadata status="read" timestamp="10:24" />
        </AstryxChatMessage>
      </AstryxChatMessageList>
      <AstryxChatLayoutScrollButton isVisible label="New messages" />
      <AstryxChatComposer density="balanced" placeholder="Ask anything">
        <AstryxChatComposerInput label="Message input" maxRows={8}>
          <AstryxChatComposerSuggestion trigger="@" value="cindy" label="Cindy Zhang" description="Design Systems" tokenLabel="Cindy Zhang" variant="blue" />
          <AstryxChatComposerSuggestion trigger="@" value="alex" label="Alex Johnson" description="Frontend" tokenLabel="Alex Johnson" variant="blue" />
          <AstryxChatComposerSuggestion trigger="@" value="sam" label="Sam Rivera" description="Backend" tokenLabel="Sam Rivera" variant="blue" />
          <AstryxChatComposerSuggestion trigger="@" value="jordan" label="Jordan Lee" description="Product" tokenLabel="Jordan Lee" variant="blue" />
          <AstryxChatComposerSuggestion trigger="/" value="summarize" label="summarize" description="Summarize the conversation" tokenLabel="/summarize" variant="yellow" />
          <AstryxChatComposerSuggestion trigger="/" value="translate" label="translate" description="Translate text to another language" tokenLabel="/translate" variant="yellow" />
          <AstryxChatComposerSuggestion trigger="/" value="search" label="search" description="Search the web or documents" tokenLabel="/search" variant="yellow" />
          <AstryxChatComposerSuggestion trigger="/" value="code" label="code" description="Generate or explain code" tokenLabel="/code" variant="yellow" />
        </AstryxChatComposerInput>
        <AstryxChatSendButton size="md" />
      </AstryxChatComposer>
    </Component>
  ),
};
