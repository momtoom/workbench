import { AstryxChat as Component } from './AstryxChat';
import { AstryxChatComposer } from './AstryxChatComposer';
import { AstryxChatComposerInput } from './AstryxChatComposerInput';
import { AstryxChatComposerSuggestion } from './AstryxChatComposerSuggestion';
import { AstryxChatMessage } from './AstryxChatMessage';
import { AstryxChatSendButton } from './AstryxChatSendButton';
import { AstryxChatSystemMessage } from './AstryxChatSystemMessage';
type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  density: 'balanced', isStreaming: false,
} as const;
const meta = {
  title: 'Astryx/Chat', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    density: { control: 'select', options: ['compact', 'balanced', 'spacious'] },
    isStreaming: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxChatMessage', 'AstryxChatSystemMessage', 'AstryxChatComposer'],
    group: 'Chat',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxChatSystemMessage message="Today" />\n<AstryxChatMessage message="Hi! How can I help with your project?" timestamp="10:01" />\n<AstryxChatMessage message="Please review the component contracts." name="You" sender="user" status="read" timestamp="11:02" />\n<AstryxChatMessage message="The gallery now uses editable message children." timestamp="12:03" />\n<AstryxChatComposer density="balanced" placeholder="Ask anything"><AstryxChatComposerInput label="Message input" maxRows={8}><AstryxChatComposerSuggestion trigger="@" value="cindy" label="Cindy Zhang" description="Design Systems" tokenLabel="Cindy Zhang" variant="blue" /><AstryxChatComposerSuggestion trigger="@" value="alex" label="Alex Johnson" description="Frontend" tokenLabel="Alex Johnson" variant="blue" /><AstryxChatComposerSuggestion trigger="@" value="sam" label="Sam Rivera" description="Backend" tokenLabel="Sam Rivera" variant="blue" /><AstryxChatComposerSuggestion trigger="@" value="jordan" label="Jordan Lee" description="Product" tokenLabel="Jordan Lee" variant="blue" /><AstryxChatComposerSuggestion trigger="/" value="summarize" label="summarize" description="Summarize the conversation" tokenLabel="/summarize" variant="yellow" /><AstryxChatComposerSuggestion trigger="/" value="translate" label="translate" description="Translate text to another language" tokenLabel="/translate" variant="yellow" /><AstryxChatComposerSuggestion trigger="/" value="search" label="search" description="Search the web or documents" tokenLabel="/search" variant="yellow" /><AstryxChatComposerSuggestion trigger="/" value="code" label="code" description="Generate or explain code" tokenLabel="/code" variant="yellow" /></AstryxChatComposerInput><AstryxChatSendButton size="md" /></AstryxChatComposer>',
    imports: [
      { names: ['AstryxChatComposer'], sourceFile: 'src/components/AstryxChatComposer.tsx' },
      { names: ['AstryxChatComposerInput'], sourceFile: 'src/components/AstryxChatComposerInput.tsx' },
      { names: ['AstryxChatComposerSuggestion'], sourceFile: 'src/components/AstryxChatComposerSuggestion.tsx' },
      { names: ['AstryxChatMessage'], sourceFile: 'src/components/AstryxChatMessage.tsx' },
      { names: ['AstryxChatSendButton'], sourceFile: 'src/components/AstryxChatSendButton.tsx' },
      { names: ['AstryxChatSystemMessage'], sourceFile: 'src/components/AstryxChatSystemMessage.tsx' },
    ],
  },
};
export default meta;
export const AstryxChat = {
  name: 'AstryxChat',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxChatSystemMessage message="Today" />
      <AstryxChatMessage message="Hi! How can I help with your project?" timestamp="10:01" />
      <AstryxChatMessage message="Please review the component contracts." name="You" sender="user" status="read" timestamp="11:02" />
      <AstryxChatMessage message="The gallery now uses editable message children." timestamp="12:03" />
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
