import { AstryxTypeahead as Component } from './AstryxTypeahead';
import { AstryxSearchItem } from './AstryxSearchItem';
type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  label: 'Assignee',
  description: 'Search and select one person.',
  placeholder: 'Search people',
  defaultValue: '',
  status: 'none',
  size: 'md',
  width: '360px',
  hasAutoFocus: false,
  hasClear: true,
  hasEntriesOnFocus: true,
  isDisabled: false,
  isLabelHidden: false,
  isOptional: false,
  isRequired: false,
  labelTooltip: '',
  maxMenuItems: 10,
  statusMessage: '',
} as const;
const meta = {
  title: 'Astryx/Typeahead', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    status: { control: 'select', options: ['none', 'success', 'warning', 'error'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    width: { control: 'text' },
    hasAutoFocus: { control: 'boolean' },
    hasClear: { control: 'boolean' },
    hasEntriesOnFocus: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
    maxMenuItems: { control: 'number' },
    statusMessage: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxSearchItem'],
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [{ names: ['AstryxSearchItem'], sourceFile: 'src/components/AstryxSearchItem.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxSearchItem id="ada-lovelace" label="Ada Lovelace" />\n<AstryxSearchItem id="grace-hopper" label="Grace Hopper" />\n<AstryxSearchItem id="margaret-hamilton" label="Margaret Hamilton" />\n<AstryxSearchItem id="katherine-johnson" label="Katherine Johnson" />',
  },
};
export default meta;
export const AstryxTypeahead = {
  name: 'AstryxTypeahead',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxSearchItem id="ada-lovelace" label="Ada Lovelace" />
      <AstryxSearchItem id="grace-hopper" label="Grace Hopper" />
      <AstryxSearchItem id="margaret-hamilton" label="Margaret Hamilton" />
      <AstryxSearchItem id="katherine-johnson" label="Katherine Johnson" />
    </Component>
  ),
};
