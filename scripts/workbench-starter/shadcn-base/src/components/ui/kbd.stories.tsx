import { Kbd as ShadcnKbd, KbdGroup } from './kbd';
import { asText } from './story-utils';

type Args = {
  children?: boolean | string;
};

const DEFAULT_PROPS = {
  children: '⌘K',
} as const;

const meta = {
  title: 'shadcn/Base UI/Kbd',
  component: ShadcnKbd,
  authoring: {
    group: 'Typography',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Kbd = {
  name: 'Kbd',
  render: (args: Args) => <ShadcnKbd>{asText(args.children, DEFAULT_PROPS.children)}</ShadcnKbd>,
};

export const KbdGroupStory = {
  name: 'KbdGroup',
  sourceInsert: {
    imports: [
      {
        names: ['Kbd'],
        sourceFile: 'src/components/ui/kbd.tsx',
      },
    ],
    jsxChildren: '<Kbd>⌘</Kbd><Kbd>K</Kbd>',
  },
  render: () => <KbdGroup><ShadcnKbd>⌘</ShadcnKbd><ShadcnKbd>K</ShadcnKbd></KbdGroup>,
};
