import { AstryxText } from './AstryxText';
import { AstryxVisuallyHidden as Component } from './AstryxVisuallyHidden';
type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = { children: 'Additional context for screen readers', as: 'span', isLiveRegion: false } as const;
const meta = {
  title: 'Astryx/VisuallyHidden', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' }, as: { control: 'select', options: ['span', 'div', 'p'] },
    isLiveRegion: { control: 'boolean' },
  },
  authoring: {
    group: 'Layout',
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxVisuallyHidden = {
  name: 'AstryxVisuallyHidden',
  render: (args: Args) => <div><AstryxText type="body">Visible content</AstryxText><Component {...(args as typeof DEFAULT_PROPS)} /></div>,
};
