import { AstryxOutlineItem as Component } from './AstryxOutlineItem';

type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  label: 'Section',
  id: 'section',
  isDefaultActive: false,
  level: 1,
} as const;
const meta = {
  title: 'Astryx/OutlineItem',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    id: { control: 'text' },
    isDefaultActive: { control: 'boolean' },
    level: {
      name: 'Depth',
      control: { type: 'number', min: 1, max: 6, step: 1 },
      description: 'Document heading depth. Each step increases the outline indentation.',
    },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxOutlineItem = {
  name: 'AstryxOutlineItem',
  render: (args: Args) => <Component {...(args as typeof DEFAULT_PROPS)} />,
};
