import { AstryxCollapsible as AstryxCollapsibleComponent } from './AstryxCollapsible';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | string>;

const DEFAULT_PROPS = {
  value: 'wrappers',
  trigger: 'Why wrappers?',
  defaultIsOpen: true,
  isDisabled: false,
} as const;

const meta = {
  title: 'Astryx/Collapsible',
  component: AstryxCollapsibleComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    value: { control: 'text' },
    trigger: { control: 'text' },
    defaultIsOpen: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
  },
  authoring: {
    group: 'Layout',
  },
  sourceInsert: {
    imports: [{ names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxText as="p" color="secondary" type="body">Workbench keeps the disclosure content editable as children.</AstryxText>',
  },
};
export default meta;

export const AstryxCollapsible = {
  name: 'AstryxCollapsible',
  render: (args: Args) => (
    <AstryxCollapsibleComponent
      defaultIsOpen={asBoolean(args.defaultIsOpen)}
      isDisabled={asBoolean(args.isDisabled)}
      trigger={asText(args.trigger, DEFAULT_PROPS.trigger)}
      value={asText(args.value, DEFAULT_PROPS.value)}
    >
      <AstryxText as="p" color="secondary" type="body">
        Workbench keeps the disclosure content editable as children.
      </AstryxText>
    </AstryxCollapsibleComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
