import { AstryxNavHeadingMenuItem as Component } from './AstryxNavHeadingMenuItem';

type Args = Record<string, boolean | string>;
const DEFAULT_PROPS = {
  label: 'Dashboard',
  description: 'Workspace overview',
  href: '#dashboard',
  icon: 'none',
  isDisabled: false,
} as const;
const meta = {
  title: 'Astryx/NavHeadingMenuItem',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    href: { control: 'text' },
    icon: { control: 'icon' },
    isDisabled: { control: 'boolean' },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;
export const AstryxNavHeadingMenuItem = {
  name: 'AstryxNavHeadingMenuItem',
  render: (args: Args) => <Component {...(args as typeof DEFAULT_PROPS)} />,
};
