import { AstryxMobileNav as Component } from './AstryxMobileNav';
import { AstryxMobileNavTrigger } from './AstryxMobileNavTrigger';
import { AstryxButton } from './AstryxButton';
import { AstryxSideNavItem } from './AstryxSideNavItem';
import { AstryxSideNavSection } from './AstryxSideNavSection';
type Args = Record<string, boolean | number | string>;
const DEFAULT_PROPS = {
  label: 'Mobile navigation',
  width: 320,
  header: 'Navigation',
  isDefaultOpen: false,
  side: 'start',
} as const;
const meta = {
  title: 'Astryx/MobileNav', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    width: { control: 'number' },
    header: { control: 'text' },
    isDefaultOpen: { control: 'boolean' },
    side: { control: 'select', options: ['start', 'end', 'auto'] },
  },
  authoring: {
    allowedChildren: ['AstryxMobileNavTrigger', 'AstryxSideNavItem', 'AstryxSideNavSection'],
    group: 'Navigation',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxMobileNavTrigger>\n  <AstryxButton label="Open navigation" variant="secondary" />\n</AstryxMobileNavTrigger>\n<AstryxSideNavSection title="Primary">\n  <AstryxSideNavItem href="#home" isSelected label="Home" />\n  <AstryxSideNavItem href="#discover" label="Discover" />\n  <AstryxSideNavItem href="#library" label="Library" />\n  <AstryxSideNavItem href="#settings" label="Settings" />\n</AstryxSideNavSection>',
    imports: [
      { names: ['AstryxMobileNavTrigger'], sourceFile: 'src/components/AstryxMobileNavTrigger.tsx' },
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
      { names: ['AstryxSideNavItem'], sourceFile: 'src/components/AstryxSideNavItem.tsx' },
      { names: ['AstryxSideNavSection'], sourceFile: 'src/components/AstryxSideNavSection.tsx' },
    ],
  },
};
export default meta;
export const AstryxMobileNav = {
  name: 'AstryxMobileNav',
  render: (args: Args) => (
    <Component {...(args as typeof DEFAULT_PROPS)}>
      <AstryxMobileNavTrigger>
        <AstryxButton label="Open navigation" variant="secondary" />
      </AstryxMobileNavTrigger>
      <AstryxSideNavSection title="Primary">
        <AstryxSideNavItem href="#home" isSelected label="Home" />
        <AstryxSideNavItem href="#discover" label="Discover" />
        <AstryxSideNavItem href="#library" label="Library" />
        <AstryxSideNavItem href="#settings" label="Settings" />
      </AstryxSideNavSection>
    </Component>
  ),
};
