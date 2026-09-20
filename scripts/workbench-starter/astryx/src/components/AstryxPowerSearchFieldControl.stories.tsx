import { AstryxPowerSearchFieldControl as Component } from './AstryxPowerSearchFieldControl';
import { AstryxPowerSearchFieldOption } from './AstryxPowerSearchFieldOption';

const DEFAULT_PROPS = { label: 'Field' } as const;
const meta = {
  title: 'Astryx/PowerSearchFieldControl',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: { label: { control: 'text' } },
  authoring: {
    allowedChildren: ['AstryxPowerSearchFieldOption'],
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxPowerSearchFieldOption'],
        sourceFile: 'src/components/AstryxPowerSearchFieldOption.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxPowerSearchFieldOption label="Title" value="title" />\n<AstryxPowerSearchFieldOption label="Status" value="status" />\n<AstryxPowerSearchFieldOption label="Created date" value="createdAt" />\n<AstryxPowerSearchFieldOption label="Owner" value="owner" />',
  },
};
export default meta;
export const AstryxPowerSearchFieldControl = {
  name: 'AstryxPowerSearchFieldControl',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxPowerSearchFieldOption label="Title" value="title" />
      <AstryxPowerSearchFieldOption label="Status" value="status" />
      <AstryxPowerSearchFieldOption label="Created date" value="createdAt" />
      <AstryxPowerSearchFieldOption label="Owner" value="owner" />
    </Component>
  ),
};
