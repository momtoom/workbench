import { AstryxPowerSearchItem } from './AstryxPowerSearchItem';
import { AstryxPowerSearchMenu as Component } from './AstryxPowerSearchMenu';
const meta = {
  title: 'Astryx/PowerSearchMenu',
  component: Component,
  authoring: {
    allowedChildren: ['AstryxPowerSearchItem'],
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxPowerSearchItem'], sourceFile: 'src/components/AstryxPowerSearchItem.tsx' },
    ],
    jsxChildren: '<AstryxPowerSearchItem fieldKey="title" label="Title" type="string" />',
  },
};
export default meta;
export const AstryxPowerSearchMenu = {
  name: 'AstryxPowerSearchMenu',
  render: () => (
    <Component>
      <AstryxPowerSearchItem fieldKey="title" label="Title" type="string" />
    </Component>
  ),
};
