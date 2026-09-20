import { AstryxChatComposerSlot as Component } from './AstryxChatComposerSlot';
import { AstryxIconButton } from './AstryxIconButton';

const DEFAULT_PROPS = {
  slot: 'header-actions',
} as const;

const meta = {
  title: 'Astryx/ChatComposerSlot',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    slot: {
      control: 'select',
      options: [
        'header-actions',
        'header-context',
        'footer-actions',
        'send-actions',
      ],
    },
  },
  authoring: {
    allowedChildren: [
      'AstryxIconButton',
      'AstryxButton',
      'AstryxProgressBar',
      'AstryxText',
      'AstryxBadge',
      'AstryxToken',
    ],
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxIconButton icon="at-sign" label="Mention" size="sm" variant="ghost" />\n<AstryxIconButton icon="paperclip" label="Attach" size="sm" variant="ghost" />',
    imports: [
      {
        names: ['AstryxIconButton'],
        sourceFile: 'src/components/AstryxIconButton.tsx',
      },
    ],
  },
};

export default meta;
export const AstryxChatComposerSlot = {
  name: 'AstryxChatComposerSlot',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxIconButton icon="at-sign" label="Mention" size="sm" variant="ghost" />
      <AstryxIconButton icon="paperclip" label="Attach" size="sm" variant="ghost" />
    </Component>
  ),
};
