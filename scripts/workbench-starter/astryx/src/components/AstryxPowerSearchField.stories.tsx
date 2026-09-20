import { AstryxPowerSearchField as Component } from './AstryxPowerSearchField';
import { AstryxPowerSearchEditor } from './AstryxPowerSearchEditor';
import { AstryxPowerSearchAction } from './AstryxPowerSearchAction';
import { AstryxPowerSearchActions } from './AstryxPowerSearchActions';
import { AstryxPowerSearchFieldControl } from './AstryxPowerSearchFieldControl';
import { AstryxPowerSearchOperatorControl } from './AstryxPowerSearchOperatorControl';
import { AstryxPowerSearchValueControl } from './AstryxPowerSearchValueControl';

type Args = Record<string, string>;
const DEFAULT_PROPS = {
  label: 'Search field',
  description: 'Filter by project status.',
  icon: 'search',
  type: 'string',
  fieldKey: 'field',
  group: 'Project',
} as const;
const meta = {
  title: 'Astryx/PowerSearchField',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    icon: { control: 'icon' },
    type: {
      control: 'select',
      options: ['string', 'number', 'boolean', 'date', 'enum', 'enum_list', 'string_list'],
    },
    fieldKey: { control: 'text' },
    group: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxPowerSearchOption', 'AstryxPowerSearchEditor'],
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxPowerSearchEditor'], sourceFile: 'src/components/AstryxPowerSearchEditor.tsx' },
      { names: ['AstryxPowerSearchFieldControl'], sourceFile: 'src/components/AstryxPowerSearchFieldControl.tsx' },
      { names: ['AstryxPowerSearchOperatorControl'], sourceFile: 'src/components/AstryxPowerSearchOperatorControl.tsx' },
      { names: ['AstryxPowerSearchValueControl'], sourceFile: 'src/components/AstryxPowerSearchValueControl.tsx' },
      { names: ['AstryxPowerSearchActions'], sourceFile: 'src/components/AstryxPowerSearchActions.tsx' },
      { names: ['AstryxPowerSearchAction'], sourceFile: 'src/components/AstryxPowerSearchAction.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxPowerSearchEditor>\n  <AstryxPowerSearchFieldControl label="Field" />\n  <AstryxPowerSearchOperatorControl label="Operator" />\n  <AstryxPowerSearchValueControl label="Value" placeholder="Enter a value" />\n  <AstryxPowerSearchActions>\n    <AstryxPowerSearchAction action="cancel" label="Cancel" />\n    <AstryxPowerSearchAction action="apply" label="Apply" />\n  </AstryxPowerSearchActions>\n</AstryxPowerSearchEditor>',
  },
};
export default meta;
export const AstryxPowerSearchField = {
  name: 'AstryxPowerSearchField',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxPowerSearchEditor>
        <AstryxPowerSearchFieldControl label="Field" />
        <AstryxPowerSearchOperatorControl label="Operator" />
        <AstryxPowerSearchValueControl label="Value" placeholder="Enter a value" />
        <AstryxPowerSearchActions>
          <AstryxPowerSearchAction action="cancel" label="Cancel" />
          <AstryxPowerSearchAction action="apply" label="Apply" />
        </AstryxPowerSearchActions>
      </AstryxPowerSearchEditor>
    </Component>
  ),
};
