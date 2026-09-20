import { AstryxTokenizer as Component } from './AstryxTokenizer';
import { AstryxTokenizerItem } from './AstryxTokenizerItem';
type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  label: 'Collaborators',
  description: 'Click the field and type to add another person.',
  placeholder: 'Add collaborators',
  status: 'none',
  size: 'md',
  width: '480px',
  hasAutoFocus: false,
  hasClear: true,
  hasCreate: false,
  hasEntriesOnFocus: true,
  isDisabled: false,
  isLabelHidden: false,
  isOptional: false,
  isRequired: false,
  labelTooltip: '',
  maxEntries: 5,
  maxMenuItems: 10,
  overflowBehavior: 'none',
  statusMessage: '',
} as const;
const meta = {
  title: 'Astryx/Tokenizer', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    status: { control: 'select', options: ['none', 'success', 'warning', 'error'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    width: { control: 'text' },
    hasAutoFocus: { control: 'boolean' },
    hasClear: { control: 'boolean' },
    hasCreate: { control: 'boolean' },
    hasEntriesOnFocus: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isLabelHidden: { control: 'boolean' },
    isOptional: { control: 'boolean' },
    isRequired: { control: 'boolean' },
    labelTooltip: { control: 'text' },
    maxEntries: { control: 'number' },
    maxMenuItems: { control: 'number' },
    overflowBehavior: { control: 'select', options: ['none', 'unfocusedInline', 'unfocusedLayer'] },
    statusMessage: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxTokenizerItem'],
    group: 'Inputs',
  },
  sourceInsert: {
    imports: [{ names: ['AstryxTokenizerItem'], sourceFile: 'src/components/AstryxTokenizerItem.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxTokenizerItem icon="user" id="ada-lovelace" isSelected label="Ada Lovelace" />\n<AstryxTokenizerItem icon="user" id="grace-hopper" isSelected label="Grace Hopper" />\n<AstryxTokenizerItem icon="user" id="margaret-hamilton" label="Margaret Hamilton" />\n<AstryxTokenizerItem icon="user" id="katherine-johnson" label="Katherine Johnson" />',
  },
};
export default meta;
export const AstryxTokenizer = {
  name: 'AstryxTokenizer',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxTokenizerItem icon="user" id="ada-lovelace" isSelected label="Ada Lovelace" />
      <AstryxTokenizerItem icon="user" id="grace-hopper" isSelected label="Grace Hopper" />
      <AstryxTokenizerItem icon="user" id="margaret-hamilton" label="Margaret Hamilton" />
      <AstryxTokenizerItem icon="user" id="katherine-johnson" label="Katherine Johnson" />
    </Component>
  ),
};
