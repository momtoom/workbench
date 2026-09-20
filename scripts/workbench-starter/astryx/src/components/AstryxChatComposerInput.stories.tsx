import { AstryxChatComposerInput as Component } from './AstryxChatComposerInput';
import { AstryxChatComposerSuggestion } from './AstryxChatComposerSuggestion';

const DEFAULT_PROPS = {
  label: 'Message input',
  placeholder: 'Type a message…',
  commandMenuLabel: 'Commands',
  debounceMs: 150,
  emptySearchResultsText: 'No results',
  hasHistory: true,
  isDisabled: false,
  loadingText: 'Searching…',
  maxRows: 8,
  mentionMenuLabel: 'People',
} as const;

const meta = {
  title: 'Astryx/ChatComposerInput',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    commandMenuLabel: { control: 'text' },
    debounceMs: { control: 'number' },
    emptySearchResultsText: { control: 'text' },
    hasHistory: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    loadingText: { control: 'text' },
    maxRows: { control: 'number' },
    mentionMenuLabel: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxChatComposerSuggestion'],
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxChatComposerSuggestion trigger="@" value="cindy" label="Cindy Zhang" description="Design Systems" tokenLabel="Cindy Zhang" variant="blue" />\n<AstryxChatComposerSuggestion trigger="@" value="alex" label="Alex Johnson" description="Frontend" tokenLabel="Alex Johnson" variant="blue" />\n<AstryxChatComposerSuggestion trigger="@" value="sam" label="Sam Rivera" description="Backend" tokenLabel="Sam Rivera" variant="blue" />\n<AstryxChatComposerSuggestion trigger="@" value="jordan" label="Jordan Lee" description="Product" tokenLabel="Jordan Lee" variant="blue" />\n<AstryxChatComposerSuggestion trigger="/" value="summarize" label="summarize" description="Summarize the conversation" tokenLabel="/summarize" variant="yellow" />\n<AstryxChatComposerSuggestion trigger="/" value="translate" label="translate" description="Translate text to another language" tokenLabel="/translate" variant="yellow" />\n<AstryxChatComposerSuggestion trigger="/" value="search" label="search" description="Search the web or documents" tokenLabel="/search" variant="yellow" />\n<AstryxChatComposerSuggestion trigger="/" value="code" label="code" description="Generate or explain code" tokenLabel="/code" variant="yellow" />',
    imports: [
      {
        names: ['AstryxChatComposerSuggestion'],
        sourceFile: 'src/components/AstryxChatComposerSuggestion.tsx',
      },
    ],
  },
};

export default meta;
export const AstryxChatComposerInput = {
  name: 'AstryxChatComposerInput',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxChatComposerSuggestion trigger="@" value="cindy" label="Cindy Zhang" description="Design Systems" tokenLabel="Cindy Zhang" variant="blue" />
      <AstryxChatComposerSuggestion trigger="@" value="alex" label="Alex Johnson" description="Frontend" tokenLabel="Alex Johnson" variant="blue" />
      <AstryxChatComposerSuggestion trigger="@" value="sam" label="Sam Rivera" description="Backend" tokenLabel="Sam Rivera" variant="blue" />
      <AstryxChatComposerSuggestion trigger="@" value="jordan" label="Jordan Lee" description="Product" tokenLabel="Jordan Lee" variant="blue" />
      <AstryxChatComposerSuggestion trigger="/" value="summarize" label="summarize" description="Summarize the conversation" tokenLabel="/summarize" variant="yellow" />
      <AstryxChatComposerSuggestion trigger="/" value="translate" label="translate" description="Translate text to another language" tokenLabel="/translate" variant="yellow" />
      <AstryxChatComposerSuggestion trigger="/" value="search" label="search" description="Search the web or documents" tokenLabel="/search" variant="yellow" />
      <AstryxChatComposerSuggestion trigger="/" value="code" label="code" description="Generate or explain code" tokenLabel="/code" variant="yellow" />
    </Component>
  ),
};
