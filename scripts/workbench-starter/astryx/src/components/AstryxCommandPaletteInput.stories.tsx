import { AstryxCommandPaletteInput as Component } from './AstryxCommandPaletteInput';

type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  placeholder: 'Search commands...',
  hasAutoFocus: false,
} as const;

const meta = {
  title: 'Astryx/CommandPaletteInput',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    placeholder: { control: 'text' },
    hasAutoFocus: { control: 'boolean' },
  },
  authoring: {
    group: 'Overlays',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};

export default meta;
export const AstryxCommandPaletteInput = {
  name: 'AstryxCommandPaletteInput',
  render: (args: Args) => <Component {...(args as typeof DEFAULT_PROPS)} />,
};
