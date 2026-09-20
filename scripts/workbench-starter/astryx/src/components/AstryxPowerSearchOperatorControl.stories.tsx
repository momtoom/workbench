import { AstryxPowerSearchOperatorControl as Component } from './AstryxPowerSearchOperatorControl';
import { AstryxPowerSearchOperatorOption } from './AstryxPowerSearchOperatorOption';

const DEFAULT_PROPS = { label: 'Operator' } as const;
const meta = {
  title: 'Astryx/PowerSearchOperatorControl',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: { label: { control: 'text' } },
  authoring: {
    allowedChildren: ['AstryxPowerSearchOperatorOption'],
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxPowerSearchOperatorOption'],
        sourceFile: 'src/components/AstryxPowerSearchOperatorOption.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxPowerSearchOperatorOption label="is before" value="before" />\n<AstryxPowerSearchOperatorOption label="is after" value="after" />\n<AstryxPowerSearchOperatorOption label="is between" value="between" />',
  },
};
export default meta;
export const AstryxPowerSearchOperatorControl = {
  name: 'AstryxPowerSearchOperatorControl',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxPowerSearchOperatorOption label="is before" value="before" />
      <AstryxPowerSearchOperatorOption label="is after" value="after" />
      <AstryxPowerSearchOperatorOption label="is between" value="between" />
    </Component>
  ),
};
