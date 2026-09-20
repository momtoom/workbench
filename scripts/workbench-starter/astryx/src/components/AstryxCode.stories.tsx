import { AstryxCode as AstryxCodeComponent } from './AstryxCode';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  children: 'theme.current',
} as const;

const meta = {
  title: 'Astryx/Code',
  component: AstryxCodeComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
  },
  authoring: {
    group: 'Typography',
  },
  sourceInsert: {
    jsxChildren: DEFAULT_PROPS.children,
    props: {},
  },
};
export default meta;

export const AstryxCode = {
  name: 'AstryxCode',
  render: (args: Args) => <AstryxCodeComponent>{asText(args.children, DEFAULT_PROPS.children)}</AstryxCodeComponent>,
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
