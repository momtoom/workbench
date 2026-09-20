import { AstryxChatMessageMetadata as Component } from './AstryxChatMessageMetadata';
import { AstryxIconButton } from './AstryxIconButton';
import { AstryxText } from './AstryxText';

const DEFAULT_PROPS = {
  status: 'none',
  timestamp: '10:24',
} as const;

const meta = {
  title: 'Astryx/ChatMessageMetadata',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    status: {
      control: 'select',
      options: ['none', 'sending', 'sent', 'delivered', 'read', 'error'],
    },
    timestamp: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxIconButton', 'AstryxButton', 'AstryxText', 'AstryxBadge', 'AstryxLink'],
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxIconButton icon="copy" label="Copy" size="xs" variant="ghost" />\n<AstryxIconButton icon="refresh-cw" label="Retry" size="xs" variant="ghost" />\n<AstryxIconButton icon="thumbs-up" label="Good response" size="xs" variant="ghost" />\n<AstryxIconButton icon="thumbs-down" label="Bad response" size="xs" variant="ghost" />\n<AstryxText color="secondary" type="supporting">GPT-4o</AstryxText>',
    imports: [
      {
        names: ['AstryxIconButton'],
        sourceFile: 'src/components/AstryxIconButton.tsx',
      },
      {
        names: ['AstryxText'],
        sourceFile: 'src/components/AstryxText.tsx',
      },
    ],
  },
};

export default meta;
export const AstryxChatMessageMetadata = {
  name: 'AstryxChatMessageMetadata',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxIconButton icon="copy" label="Copy" size="xs" variant="ghost" />
      <AstryxIconButton icon="refresh-cw" label="Retry" size="xs" variant="ghost" />
      <AstryxIconButton icon="thumbs-up" label="Good response" size="xs" variant="ghost" />
      <AstryxIconButton icon="thumbs-down" label="Bad response" size="xs" variant="ghost" />
      <AstryxText color="secondary" type="supporting">GPT-4o</AstryxText>
    </Component>
  ),
};
