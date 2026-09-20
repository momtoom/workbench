import {
  AstryxPowerSearchAction,
} from './AstryxPowerSearchAction';
import { AstryxPowerSearchActions as Component } from './AstryxPowerSearchActions';

const meta = {
  title: 'Astryx/PowerSearchActions',
  component: Component,
  authoring: {
    allowedChildren: ['AstryxPowerSearchAction'],
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxPowerSearchAction'],
        sourceFile: 'src/components/AstryxPowerSearchAction.tsx',
      },
    ],
    jsxChildren:
      '<AstryxPowerSearchAction action="cancel" label="Cancel" />\n<AstryxPowerSearchAction action="apply" label="Apply" />',
  },
};
export default meta;
export const AstryxPowerSearchActions = {
  name: 'AstryxPowerSearchActions',
  render: () => (
    <Component>
      <AstryxPowerSearchAction action="cancel" label="Cancel" />
      <AstryxPowerSearchAction action="apply" label="Apply" />
    </Component>
  ),
};
