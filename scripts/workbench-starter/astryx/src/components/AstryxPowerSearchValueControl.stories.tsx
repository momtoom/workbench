import { AstryxPowerSearchValueControl as Component } from './AstryxPowerSearchValueControl';
import { AstryxPowerSearchOption } from './AstryxPowerSearchOption';

const DEFAULT_PROPS = { label: 'Value', placeholder: 'Enter a value' } as const;
const meta = {
  title: 'Astryx/PowerSearchValueControl',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: { label: { control: 'text' }, placeholder: { control: 'text' } },
  authoring: {
    allowedChildren: ['AstryxPowerSearchOption'],
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxPowerSearchOption'],
        sourceFile: 'src/components/AstryxPowerSearchOption.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxPowerSearchOption label="Draft" value="draft" />\n<AstryxPowerSearchOption label="Active" value="active" />\n<AstryxPowerSearchOption label="Archived" value="archived" />',
  },
};
export default meta;
export const AstryxPowerSearchValueControl = {
  name: 'AstryxPowerSearchValueControl',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxPowerSearchOption label="Draft" value="draft" />
      <AstryxPowerSearchOption label="Active" value="active" />
      <AstryxPowerSearchOption label="Archived" value="archived" />
    </Component>
  ),
};
