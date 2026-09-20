import { AstryxPowerSearch as Component } from './AstryxPowerSearch';
import { AstryxPowerSearchEditor } from './AstryxPowerSearchEditor';
import { AstryxPowerSearchAction } from './AstryxPowerSearchAction';
import { AstryxPowerSearchActions } from './AstryxPowerSearchActions';
import { AstryxPowerSearchFieldControl } from './AstryxPowerSearchFieldControl';
import { AstryxPowerSearchFieldOption } from './AstryxPowerSearchFieldOption';
import { AstryxPowerSearchOperatorControl } from './AstryxPowerSearchOperatorControl';
import { AstryxPowerSearchOperatorOption } from './AstryxPowerSearchOperatorOption';
import { AstryxPowerSearchValueControl } from './AstryxPowerSearchValueControl';
import { AstryxPowerSearchInput } from './AstryxPowerSearchInput';
import { AstryxPowerSearchItem } from './AstryxPowerSearchItem';
import { AstryxPowerSearchMenu } from './AstryxPowerSearchMenu';
import { AstryxPowerSearchOption } from './AstryxPowerSearchOption';

type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  status: 'none',
  size: 'md',
  isDisabled: false,
  isReadOnly: false,
} as const;

const POWER_SEARCH_CHILDREN = `<AstryxPowerSearchInput label="Search projects" placeholder="Filter by title, status, date, or owner" resultCount="24 results" />
<AstryxPowerSearchMenu>
  <AstryxPowerSearchItem fieldKey="title" icon="search" label="Title" type="string">
    <AstryxPowerSearchEditor>
      <AstryxPowerSearchFieldControl label="Field">
        <AstryxPowerSearchFieldOption label="Title" value="title" />
        <AstryxPowerSearchFieldOption label="Status" value="status" />
        <AstryxPowerSearchFieldOption label="Created date" value="createdAt" />
        <AstryxPowerSearchFieldOption label="Owner" value="owner" />
      </AstryxPowerSearchFieldControl>
      <AstryxPowerSearchOperatorControl label="Operator">
        <AstryxPowerSearchOperatorOption label="contains" value="contains" />
        <AstryxPowerSearchOperatorOption label="does not contain" value="not_contains" />
        <AstryxPowerSearchOperatorOption label="starts with" value="starts_with" />
        <AstryxPowerSearchOperatorOption label="does not start with" value="not_starts_with" />
        <AstryxPowerSearchOperatorOption label="ends with" value="ends_with" />
        <AstryxPowerSearchOperatorOption label="does not end with" value="not_ends_with" />
        <AstryxPowerSearchOperatorOption label="is" value="is" />
        <AstryxPowerSearchOperatorOption label="is not" value="is_not" />
        <AstryxPowerSearchOperatorOption label="is before" value="before" />
        <AstryxPowerSearchOperatorOption label="is after" value="after" />
        <AstryxPowerSearchOperatorOption label="is between" value="between" />
      </AstryxPowerSearchOperatorControl>
      <AstryxPowerSearchValueControl label="Value" placeholder="Enter a title">
        <AstryxPowerSearchOption label="Draft" value="draft" />
        <AstryxPowerSearchOption label="Active" value="active" />
        <AstryxPowerSearchOption label="Archived" value="archived" />
      </AstryxPowerSearchValueControl>
      <AstryxPowerSearchActions>
        <AstryxPowerSearchAction action="cancel" label="Cancel" />
        <AstryxPowerSearchAction action="apply" label="Apply" />
      </AstryxPowerSearchActions>
    </AstryxPowerSearchEditor>
  </AstryxPowerSearchItem>
  <AstryxPowerSearchItem fieldKey="status" icon="checkCircle" label="Status" type="enum">
    <AstryxPowerSearchEditor>
      <AstryxPowerSearchFieldControl label="Field">
        <AstryxPowerSearchFieldOption label="Title" value="title" />
        <AstryxPowerSearchFieldOption label="Status" value="status" />
        <AstryxPowerSearchFieldOption label="Created date" value="createdAt" />
        <AstryxPowerSearchFieldOption label="Owner" value="owner" />
      </AstryxPowerSearchFieldControl>
      <AstryxPowerSearchOperatorControl label="Operator">
        <AstryxPowerSearchOperatorOption label="contains" value="contains" />
        <AstryxPowerSearchOperatorOption label="does not contain" value="not_contains" />
        <AstryxPowerSearchOperatorOption label="starts with" value="starts_with" />
        <AstryxPowerSearchOperatorOption label="does not start with" value="not_starts_with" />
        <AstryxPowerSearchOperatorOption label="ends with" value="ends_with" />
        <AstryxPowerSearchOperatorOption label="does not end with" value="not_ends_with" />
        <AstryxPowerSearchOperatorOption label="is" value="is" />
        <AstryxPowerSearchOperatorOption label="is not" value="is_not" />
        <AstryxPowerSearchOperatorOption label="is before" value="before" />
        <AstryxPowerSearchOperatorOption label="is after" value="after" />
        <AstryxPowerSearchOperatorOption label="is between" value="between" />
      </AstryxPowerSearchOperatorControl>
      <AstryxPowerSearchValueControl label="Value" placeholder="Select a status">
        <AstryxPowerSearchOption label="Draft" value="draft" />
        <AstryxPowerSearchOption label="Active" value="active" />
        <AstryxPowerSearchOption label="Archived" value="archived" />
      </AstryxPowerSearchValueControl>
      <AstryxPowerSearchActions>
        <AstryxPowerSearchAction action="cancel" label="Cancel" />
        <AstryxPowerSearchAction action="apply" label="Apply" />
      </AstryxPowerSearchActions>
    </AstryxPowerSearchEditor>
  </AstryxPowerSearchItem>
  <AstryxPowerSearchItem fieldKey="createdAt" icon="calendar" label="Created date" type="date">
    <AstryxPowerSearchEditor>
      <AstryxPowerSearchFieldControl label="Field">
        <AstryxPowerSearchFieldOption label="Title" value="title" />
        <AstryxPowerSearchFieldOption label="Status" value="status" />
        <AstryxPowerSearchFieldOption label="Created date" value="createdAt" />
        <AstryxPowerSearchFieldOption label="Owner" value="owner" />
      </AstryxPowerSearchFieldControl>
      <AstryxPowerSearchOperatorControl label="Operator">
        <AstryxPowerSearchOperatorOption label="contains" value="contains" />
        <AstryxPowerSearchOperatorOption label="does not contain" value="not_contains" />
        <AstryxPowerSearchOperatorOption label="starts with" value="starts_with" />
        <AstryxPowerSearchOperatorOption label="does not start with" value="not_starts_with" />
        <AstryxPowerSearchOperatorOption label="ends with" value="ends_with" />
        <AstryxPowerSearchOperatorOption label="does not end with" value="not_ends_with" />
        <AstryxPowerSearchOperatorOption label="is" value="is" />
        <AstryxPowerSearchOperatorOption label="is not" value="is_not" />
        <AstryxPowerSearchOperatorOption label="is before" value="before" />
        <AstryxPowerSearchOperatorOption label="is after" value="after" />
        <AstryxPowerSearchOperatorOption label="is between" value="between" />
      </AstryxPowerSearchOperatorControl>
      <AstryxPowerSearchValueControl label="Value" placeholder="Select a date">
        <AstryxPowerSearchOption label="Draft" value="draft" />
        <AstryxPowerSearchOption label="Active" value="active" />
        <AstryxPowerSearchOption label="Archived" value="archived" />
      </AstryxPowerSearchValueControl>
      <AstryxPowerSearchActions>
        <AstryxPowerSearchAction action="cancel" label="Cancel" />
        <AstryxPowerSearchAction action="apply" label="Apply" />
      </AstryxPowerSearchActions>
    </AstryxPowerSearchEditor>
  </AstryxPowerSearchItem>
</AstryxPowerSearchMenu>`;

const meta = {
  title: 'Astryx/PowerSearch',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    status: { control: 'select', options: ['none', 'success', 'warning', 'error'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    isDisabled: { control: 'boolean' },
    isReadOnly: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxPowerSearchInput', 'AstryxPowerSearchMenu'],
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxPowerSearchInput'], sourceFile: 'src/components/AstryxPowerSearchInput.tsx' },
      { names: ['AstryxPowerSearchMenu'], sourceFile: 'src/components/AstryxPowerSearchMenu.tsx' },
      { names: ['AstryxPowerSearchItem'], sourceFile: 'src/components/AstryxPowerSearchItem.tsx' },
      { names: ['AstryxPowerSearchOption'], sourceFile: 'src/components/AstryxPowerSearchOption.tsx' },
      { names: ['AstryxPowerSearchEditor'], sourceFile: 'src/components/AstryxPowerSearchEditor.tsx' },
      { names: ['AstryxPowerSearchFieldControl'], sourceFile: 'src/components/AstryxPowerSearchFieldControl.tsx' },
      { names: ['AstryxPowerSearchFieldOption'], sourceFile: 'src/components/AstryxPowerSearchFieldOption.tsx' },
      { names: ['AstryxPowerSearchOperatorControl'], sourceFile: 'src/components/AstryxPowerSearchOperatorControl.tsx' },
      { names: ['AstryxPowerSearchOperatorOption'], sourceFile: 'src/components/AstryxPowerSearchOperatorOption.tsx' },
      { names: ['AstryxPowerSearchValueControl'], sourceFile: 'src/components/AstryxPowerSearchValueControl.tsx' },
      { names: ['AstryxPowerSearchActions'], sourceFile: 'src/components/AstryxPowerSearchActions.tsx' },
      { names: ['AstryxPowerSearchAction'], sourceFile: 'src/components/AstryxPowerSearchAction.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren: POWER_SEARCH_CHILDREN,
  },
};

export default meta;

export const AstryxPowerSearch = {
  name: 'AstryxPowerSearch',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxPowerSearchInput
        label="Search projects"
        placeholder="Filter by title, status, date, or owner"
        resultCount="24 results"
      />
      <AstryxPowerSearchMenu>
        <AstryxPowerSearchItem fieldKey="title" icon="search" label="Title" type="string">
          {renderEditor('Enter a title')}
        </AstryxPowerSearchItem>
        <AstryxPowerSearchItem fieldKey="status" icon="checkCircle" label="Status" type="enum">
          <AstryxPowerSearchEditor>
            {renderFieldControl()}
            {renderOperatorControl()}
            <AstryxPowerSearchValueControl label="Value" placeholder="Select a status">
              <AstryxPowerSearchOption label="Draft" value="draft" />
              <AstryxPowerSearchOption label="Active" value="active" />
              <AstryxPowerSearchOption label="Archived" value="archived" />
            </AstryxPowerSearchValueControl>
            <AstryxPowerSearchActions>
              <AstryxPowerSearchAction action="cancel" label="Cancel" />
              <AstryxPowerSearchAction action="apply" label="Apply" />
            </AstryxPowerSearchActions>
          </AstryxPowerSearchEditor>
        </AstryxPowerSearchItem>
        <AstryxPowerSearchItem fieldKey="createdAt" icon="calendar" label="Created date" type="date">
          {renderEditor('Select a date')}
        </AstryxPowerSearchItem>
      </AstryxPowerSearchMenu>
    </Component>
  ),
};

function renderEditor(placeholder: string) {
  return (
    <AstryxPowerSearchEditor>
      {renderFieldControl()}
      {renderOperatorControl()}
      <AstryxPowerSearchValueControl label="Value" placeholder={placeholder}>
        <AstryxPowerSearchOption label="Draft" value="draft" />
        <AstryxPowerSearchOption label="Active" value="active" />
        <AstryxPowerSearchOption label="Archived" value="archived" />
      </AstryxPowerSearchValueControl>
      <AstryxPowerSearchActions>
        <AstryxPowerSearchAction action="cancel" label="Cancel" />
        <AstryxPowerSearchAction action="apply" label="Apply" />
      </AstryxPowerSearchActions>
    </AstryxPowerSearchEditor>
  );
}

function renderFieldControl() {
  return (
    <AstryxPowerSearchFieldControl label="Field">
      <AstryxPowerSearchFieldOption label="Title" value="title" />
      <AstryxPowerSearchFieldOption label="Status" value="status" />
      <AstryxPowerSearchFieldOption label="Created date" value="createdAt" />
      <AstryxPowerSearchFieldOption label="Owner" value="owner" />
    </AstryxPowerSearchFieldControl>
  );
}

function renderOperatorControl() {
  return (
    <AstryxPowerSearchOperatorControl label="Operator">
      <AstryxPowerSearchOperatorOption label="contains" value="contains" />
      <AstryxPowerSearchOperatorOption label="does not contain" value="not_contains" />
      <AstryxPowerSearchOperatorOption label="starts with" value="starts_with" />
      <AstryxPowerSearchOperatorOption label="does not start with" value="not_starts_with" />
      <AstryxPowerSearchOperatorOption label="ends with" value="ends_with" />
      <AstryxPowerSearchOperatorOption label="does not end with" value="not_ends_with" />
      <AstryxPowerSearchOperatorOption label="is" value="is" />
      <AstryxPowerSearchOperatorOption label="is not" value="is_not" />
      <AstryxPowerSearchOperatorOption label="is before" value="before" />
      <AstryxPowerSearchOperatorOption label="is after" value="after" />
      <AstryxPowerSearchOperatorOption label="is between" value="between" />
    </AstryxPowerSearchOperatorControl>
  );
}
