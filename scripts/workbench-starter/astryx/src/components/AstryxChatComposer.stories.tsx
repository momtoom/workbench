import { AstryxChatComposer as Component } from './AstryxChatComposer';
import { AstryxChatComposerDrawer } from './AstryxChatComposerDrawer';
import { AstryxChatComposerInput } from './AstryxChatComposerInput';
import { AstryxChatComposerSlot } from './AstryxChatComposerSlot';
import { AstryxChatComposerSuggestion } from './AstryxChatComposerSuggestion';
import { AstryxChatComposerTokenElement } from './AstryxChatComposerTokenElement';
import { AstryxChatDictationButton } from './AstryxChatDictationButton';
import { AstryxIconButton } from './AstryxIconButton';
import { AstryxProgressBar } from './AstryxProgressBar';
import { AstryxChatSendButton } from './AstryxChatSendButton';

const DEFAULT_PROPS = {
  placeholder: 'Ask anything',
  status: 'none',
  density: 'balanced',
  isDisabled: false,
  isStopShown: false,
  statusMessage: '',
  statusPosition: 'bottom',
} as const;

const meta = {
  title: 'Astryx/ChatComposer',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    placeholder: { control: 'text' },
    status: { control: 'select', options: ['none', 'warning', 'error'] },
    density: { control: 'select', options: ['compact', 'balanced', 'spacious'] },
    isDisabled: { control: 'boolean' },
    isStopShown: { control: 'boolean' },
    statusMessage: { control: 'text' },
    statusPosition: { control: 'select', options: ['top', 'bottom'] },
  },
  authoring: {
    allowedChildren: [
      'AstryxChatComposerDrawer',
      'AstryxChatComposerInput',
      'AstryxChatComposerSlot',
      'AstryxChatDictationButton',
      'AstryxChatSendButton',
      'AstryxButton',
      'AstryxIconButton',
    ],
    group: 'Chat',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxChatComposerDrawer count={4} label="Attachments"><AstryxChatComposerTokenElement label="design-spec.pdf" value="design-spec.pdf" variant="neutral" /><AstryxChatComposerTokenElement label="api-schema.json" value="api-schema.json" variant="neutral" /><AstryxChatComposerTokenElement label="screenshot.png" value="screenshot.png" variant="neutral" /><AstryxChatComposerTokenElement label="meeting-notes.md" value="meeting-notes.md" variant="neutral" /></AstryxChatComposerDrawer>\n<AstryxChatComposerSlot slot="header-actions"><AstryxIconButton icon="at-sign" label="Mention" size="sm" variant="ghost" /><AstryxIconButton icon="paperclip" label="Attach" size="sm" variant="ghost" /></AstryxChatComposerSlot>\n<AstryxChatComposerSlot slot="header-context"><AstryxProgressBar hasValueLabel={false} isLabelHidden label="Context usage" value={42} /></AstryxChatComposerSlot>\n<AstryxChatComposerInput label="Message input" maxRows={8}><AstryxChatComposerSuggestion trigger="@" value="cindy" label="Cindy Zhang" description="Design Systems" tokenLabel="Cindy Zhang" variant="blue" /><AstryxChatComposerSuggestion trigger="@" value="alex" label="Alex Johnson" description="Frontend" tokenLabel="Alex Johnson" variant="blue" /><AstryxChatComposerSuggestion trigger="@" value="sam" label="Sam Rivera" description="Backend" tokenLabel="Sam Rivera" variant="blue" /><AstryxChatComposerSuggestion trigger="@" value="jordan" label="Jordan Lee" description="Product" tokenLabel="Jordan Lee" variant="blue" /><AstryxChatComposerSuggestion trigger="/" value="summarize" label="summarize" description="Summarize the conversation" tokenLabel="/summarize" variant="yellow" /><AstryxChatComposerSuggestion trigger="/" value="translate" label="translate" description="Translate text to another language" tokenLabel="/translate" variant="yellow" /><AstryxChatComposerSuggestion trigger="/" value="search" label="search" description="Search the web or documents" tokenLabel="/search" variant="yellow" /><AstryxChatComposerSuggestion trigger="/" value="code" label="code" description="Generate or explain code" tokenLabel="/code" variant="yellow" /></AstryxChatComposerInput>\n<AstryxChatDictationButton label="Start dictation" size="md" />\n<AstryxChatSendButton size="md" />',
    imports: [
      { names: ['AstryxChatComposerDrawer'], sourceFile: 'src/components/AstryxChatComposerDrawer.tsx' },
      { names: ['AstryxChatComposerSlot'], sourceFile: 'src/components/AstryxChatComposerSlot.tsx' },
      { names: ['AstryxChatComposerSuggestion'], sourceFile: 'src/components/AstryxChatComposerSuggestion.tsx' },
      { names: ['AstryxChatComposerTokenElement'], sourceFile: 'src/components/AstryxChatComposerTokenElement.tsx' },
      { names: ['AstryxChatComposerInput'], sourceFile: 'src/components/AstryxChatComposerInput.tsx' },
      { names: ['AstryxChatDictationButton'], sourceFile: 'src/components/AstryxChatDictationButton.tsx' },
      { names: ['AstryxIconButton'], sourceFile: 'src/components/AstryxIconButton.tsx' },
      { names: ['AstryxProgressBar'], sourceFile: 'src/components/AstryxProgressBar.tsx' },
      { names: ['AstryxChatSendButton'], sourceFile: 'src/components/AstryxChatSendButton.tsx' },
    ],
  },
};

export default meta;
export const AstryxChatComposer = {
  name: 'AstryxChatComposer',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxChatComposerDrawer count={4} label="Attachments">
        <AstryxChatComposerTokenElement label="design-spec.pdf" value="design-spec.pdf" variant="neutral" />
        <AstryxChatComposerTokenElement label="api-schema.json" value="api-schema.json" variant="neutral" />
        <AstryxChatComposerTokenElement label="screenshot.png" value="screenshot.png" variant="neutral" />
        <AstryxChatComposerTokenElement label="meeting-notes.md" value="meeting-notes.md" variant="neutral" />
      </AstryxChatComposerDrawer>
      <AstryxChatComposerSlot slot="header-actions">
        <AstryxIconButton icon="at-sign" label="Mention" size="sm" variant="ghost" />
        <AstryxIconButton icon="paperclip" label="Attach" size="sm" variant="ghost" />
      </AstryxChatComposerSlot>
      <AstryxChatComposerSlot slot="header-context">
        <AstryxProgressBar hasValueLabel={false} isLabelHidden label="Context usage" value={42} />
      </AstryxChatComposerSlot>
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
      <AstryxChatDictationButton label="Start dictation" size="md" />
      <AstryxChatSendButton size="md" />
    </Component>
  ),
};
