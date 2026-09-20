import { AstryxOutline as Component } from './AstryxOutline';
import { AstryxOutlineItem } from './AstryxOutlineItem';
type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  label: 'Table of contents',
  density: 'default',
  hasScrollOnClick: false,
  offset: 0,
} as const;
const meta = {
  title: 'Astryx/Outline', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    density: { control: 'select', options: ['default', 'compact'] },
    hasScrollOnClick: { control: 'boolean' },
    offset: { control: 'number' },
  },
  authoring: {
    allowedChildren: ['AstryxOutlineItem'],
    group: 'Navigation',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxOutlineItem id="overview" isDefaultActive label="Overview" level={1} />\n<AstryxOutlineItem id="installation" label="Installation" level={2} />\n<AstryxOutlineItem id="configuration" label="Configuration" level={2} />\n<AstryxOutlineItem id="api-reference" label="API reference" level={2} />',
    imports: [{ names: ['AstryxOutlineItem'], sourceFile: 'src/components/AstryxOutlineItem.tsx' }],
  },
};
export default meta;
export const AstryxOutline = {
  name: 'AstryxOutline',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxOutlineItem id="overview" isDefaultActive label="Overview" level={1} />
      <AstryxOutlineItem id="installation" label="Installation" level={2} />
      <AstryxOutlineItem id="configuration" label="Configuration" level={2} />
      <AstryxOutlineItem id="api-reference" label="API reference" level={2} />
    </Component>
  ),
};
