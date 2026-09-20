import { AstryxBlockquote as AstryxBlockquoteComponent } from './AstryxBlockquote';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  children: 'Design systems work best when intent remains visible in source.',
  cite: 'Workbench note',
} as const;

const meta = {
  title: 'Astryx/Blockquote',
  component: AstryxBlockquoteComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'text' },
    cite: { control: 'text' },
  },
  authoring: {
    group: 'Typography',
  },
  sourceInsert: {
    jsxChildren: DEFAULT_PROPS.children,
    props: {
      cite: DEFAULT_PROPS.cite,
    },
  },
};
export default meta;

export const AstryxBlockquote = {
  name: 'AstryxBlockquote',
  render: (args: Args) => (
    <AstryxBlockquoteComponent cite={asText(args.cite, DEFAULT_PROPS.cite)}>
      {asText(args.children, DEFAULT_PROPS.children)}
    </AstryxBlockquoteComponent>
  ),
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
