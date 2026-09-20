import { AstryxSelectorOption } from './AstryxSelectorOption';
import { AstryxSelectorSection as AstryxSelectorSectionComponent } from './AstryxSelectorSection';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  title: 'North America',
} as const;

const meta = {
  title: 'Astryx/SelectorSection',
  component: AstryxSelectorSectionComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxSelectorOption'],
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxSelectorOption'], sourceFile: 'src/components/AstryxSelectorOption.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxSelectorOption value="new-york" label="New York" />\n<AstryxSelectorOption value="san-francisco" label="San Francisco" />',
  },
};
export default meta;

export const AstryxSelectorSection = {
  name: 'AstryxSelectorSection',
  render: (args: Args) => (
    <AstryxSelectorSectionComponent title={asText(args.title, DEFAULT_PROPS.title)}>
      <AstryxSelectorOption value="new-york" label="New York" />
      <AstryxSelectorOption value="san-francisco" label="San Francisco" />
    </AstryxSelectorSectionComponent>
  ),
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
