import {
  AstryxPowerSearchEditor as Component,
} from './AstryxPowerSearchEditor';
import { AstryxPowerSearchAction } from './AstryxPowerSearchAction';
import { AstryxPowerSearchActions } from './AstryxPowerSearchActions';
import { AstryxPowerSearchFieldControl } from './AstryxPowerSearchFieldControl';
import { AstryxPowerSearchFieldOption } from './AstryxPowerSearchFieldOption';
import { AstryxPowerSearchOperatorControl } from './AstryxPowerSearchOperatorControl';
import { AstryxPowerSearchOperatorOption } from './AstryxPowerSearchOperatorOption';
import { AstryxPowerSearchValueControl } from './AstryxPowerSearchValueControl';
import { AstryxPowerSearchOption } from './AstryxPowerSearchOption';

const meta = {
  title: 'Astryx/PowerSearchEditor',
  component: Component,
  authoring: {
    allowedChildren: [
      'AstryxPowerSearchFieldControl',
      'AstryxPowerSearchOperatorControl',
      'AstryxPowerSearchValueControl',
      'AstryxPowerSearchActions',
    ],
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxPowerSearchFieldControl'], sourceFile: 'src/components/AstryxPowerSearchFieldControl.tsx' },
      { names: ['AstryxPowerSearchFieldOption'], sourceFile: 'src/components/AstryxPowerSearchFieldOption.tsx' },
      { names: ['AstryxPowerSearchOperatorControl'], sourceFile: 'src/components/AstryxPowerSearchOperatorControl.tsx' },
      { names: ['AstryxPowerSearchOperatorOption'], sourceFile: 'src/components/AstryxPowerSearchOperatorOption.tsx' },
      { names: ['AstryxPowerSearchValueControl'], sourceFile: 'src/components/AstryxPowerSearchValueControl.tsx' },
      { names: ['AstryxPowerSearchOption'], sourceFile: 'src/components/AstryxPowerSearchOption.tsx' },
      { names: ['AstryxPowerSearchActions'], sourceFile: 'src/components/AstryxPowerSearchActions.tsx' },
      { names: ['AstryxPowerSearchAction'], sourceFile: 'src/components/AstryxPowerSearchAction.tsx' },
    ],
    jsxChildren:
      '<AstryxPowerSearchFieldControl label="Field">\n  <AstryxPowerSearchFieldOption label="Title" value="title" />\n  <AstryxPowerSearchFieldOption label="Status" value="status" />\n  <AstryxPowerSearchFieldOption label="Created date" value="createdAt" />\n  <AstryxPowerSearchFieldOption label="Owner" value="owner" />\n</AstryxPowerSearchFieldControl>\n<AstryxPowerSearchOperatorControl label="Operator">\n  <AstryxPowerSearchOperatorOption label="is before" value="before" />\n  <AstryxPowerSearchOperatorOption label="is after" value="after" />\n  <AstryxPowerSearchOperatorOption label="is between" value="between" />\n</AstryxPowerSearchOperatorControl>\n<AstryxPowerSearchValueControl label="Value" placeholder="Enter a value">\n  <AstryxPowerSearchOption label="Draft" value="draft" />\n  <AstryxPowerSearchOption label="Active" value="active" />\n  <AstryxPowerSearchOption label="Archived" value="archived" />\n</AstryxPowerSearchValueControl>\n<AstryxPowerSearchActions>\n  <AstryxPowerSearchAction action="cancel" label="Cancel" />\n  <AstryxPowerSearchAction action="apply" label="Apply" />\n</AstryxPowerSearchActions>',
  },
};

export default meta;

export const AstryxPowerSearchEditor = {
  name: 'AstryxPowerSearchEditor',
  render: () => (
    <Component>
      <AstryxPowerSearchFieldControl label="Field">
        <AstryxPowerSearchFieldOption label="Title" value="title" />
        <AstryxPowerSearchFieldOption label="Status" value="status" />
        <AstryxPowerSearchFieldOption label="Created date" value="createdAt" />
        <AstryxPowerSearchFieldOption label="Owner" value="owner" />
      </AstryxPowerSearchFieldControl>
      <AstryxPowerSearchOperatorControl label="Operator">
        <AstryxPowerSearchOperatorOption label="is before" value="before" />
        <AstryxPowerSearchOperatorOption label="is after" value="after" />
        <AstryxPowerSearchOperatorOption label="is between" value="between" />
      </AstryxPowerSearchOperatorControl>
      <AstryxPowerSearchValueControl label="Value" placeholder="Enter a value">
        <AstryxPowerSearchOption label="Draft" value="draft" />
        <AstryxPowerSearchOption label="Active" value="active" />
        <AstryxPowerSearchOption label="Archived" value="archived" />
      </AstryxPowerSearchValueControl>
      <AstryxPowerSearchActions>
        <AstryxPowerSearchAction action="cancel" label="Cancel" />
        <AstryxPowerSearchAction action="apply" label="Apply" />
      </AstryxPowerSearchActions>
    </Component>
  ),
};
