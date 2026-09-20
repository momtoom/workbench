import { AstryxTreeListItem as Component } from './AstryxTreeListItem';

type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  label: 'Tree item',
  description: '',
  id: 'workspace',
  href: '',
  isDisabled: false,
  isExpanded: false,
  isSelected: false,
} as const;
const meta = {
  title: 'Astryx/TreeListItem',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    id: { control: 'text' },
    href: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isExpanded: { control: 'boolean' },
    isSelected: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxTreeListItem'],
    group: 'Data',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxTreeListItem = {
  name: 'AstryxTreeListItem',
  render: (args: Args) => <Component {...(args as typeof DEFAULT_PROPS)} />,
};
