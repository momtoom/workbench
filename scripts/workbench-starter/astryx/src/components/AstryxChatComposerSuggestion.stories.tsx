import { AstryxChatComposerSuggestion as Component } from './AstryxChatComposerSuggestion';

const VARIANTS = [
  'neutral',
  'info',
  'success',
  'warning',
  'error',
  'blue',
  'cyan',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'teal',
  'yellow',
] as const;

const DEFAULT_PROPS = {
  label: 'Cindy Zhang',
  value: 'cindy',
  description: 'Design Systems',
  trigger: '@',
  variant: 'blue',
  tokenLabel: 'Cindy Zhang',
} as const;

const meta = {
  title: 'Astryx/ChatComposerSuggestion',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    value: { control: 'text' },
    description: { control: 'text' },
    trigger: { control: 'select', options: ['@', '/'] },
    variant: { control: 'select', options: VARIANTS },
    tokenLabel: { control: 'text' },
  },
  authoring: {
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};

export default meta;
export const AstryxChatComposerSuggestion = {
  name: 'AstryxChatComposerSuggestion',
  render: (args: typeof DEFAULT_PROPS) => <Component {...args} />,
};
