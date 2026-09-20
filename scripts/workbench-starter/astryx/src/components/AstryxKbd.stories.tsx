import { AstryxKbd as AstryxKbdComponent } from './AstryxKbd';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  keys: 'mod+k',
} as const;

const meta = {
  title: 'Astryx/Kbd',
  component: AstryxKbdComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    keys: { control: 'text' },
  },
  authoring: {
    group: 'Typography',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxKbd = {
  name: 'AstryxKbd',
  render: (args: Args) => <AstryxKbdComponent keys={asText(args.keys, DEFAULT_PROPS.keys)} />,
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
