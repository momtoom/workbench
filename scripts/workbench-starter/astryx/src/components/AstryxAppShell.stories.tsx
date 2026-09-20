import { AstryxAppShell as AstryxAppShellComponent } from './AstryxAppShell';
import { AstryxBadge } from './AstryxBadge';
import { AstryxBanner } from './AstryxBanner';
import { AstryxButton } from './AstryxButton';
import { AstryxMetadataList } from './AstryxMetadataList';
import { AstryxMetadataListItem } from './AstryxMetadataListItem';
import { AstryxSideNav } from './AstryxSideNav';
import { AstryxSideNavHeading } from './AstryxSideNavHeading';
import { AstryxSideNavItem } from './AstryxSideNavItem';
import { AstryxSideNavSection } from './AstryxSideNavSection';
import { AstryxTopNav } from './AstryxTopNav';
import { AstryxTopNavHeading } from './AstryxTopNavHeading';
import { AstryxTopNavItem } from './AstryxTopNavItem';
import { AstryxTopNavSlot } from './AstryxTopNavSlot';
import { AstryxVStack } from './AstryxVStack';

type Args = Record<string, string | number | boolean>;
type SpacingValue = 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;

const VARIANTS = ['wash', 'surface', 'section', 'elevated'] as const;
const HEIGHTS = ['auto', 'fill'] as const;
const SPACING_VALUES = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;

const DEFAULT_PROPS = {
  variant: 'section',
  height: 'fill',
  contentPadding: 4,
  frameHeight: 560,
  hasMobileNav: false,
} as const;

const meta = {
  title: 'Astryx/AppShell',
  component: AstryxAppShellComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    height: { control: 'select', options: HEIGHTS },
    contentPadding: { control: 'number' },
    frameHeight: { control: 'number' },
    hasMobileNav: { control: 'boolean' },
  },
  authoring: {
    group: 'Layout',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxBadge'], sourceFile: 'src/components/AstryxBadge.tsx' },
      { names: ['AstryxBanner'], sourceFile: 'src/components/AstryxBanner.tsx' },
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
      { names: ['AstryxMetadataList'], sourceFile: 'src/components/AstryxMetadataList.tsx' },
      { names: ['AstryxMetadataListItem'], sourceFile: 'src/components/AstryxMetadataListItem.tsx' },
      { names: ['AstryxSideNav'], sourceFile: 'src/components/AstryxSideNav.tsx' },
      { names: ['AstryxSideNavHeading'], sourceFile: 'src/components/AstryxSideNavHeading.tsx' },
      { names: ['AstryxSideNavItem'], sourceFile: 'src/components/AstryxSideNavItem.tsx' },
      { names: ['AstryxSideNavSection'], sourceFile: 'src/components/AstryxSideNavSection.tsx' },
      { names: ['AstryxTopNav'], sourceFile: 'src/components/AstryxTopNav.tsx' },
      { names: ['AstryxTopNavHeading'], sourceFile: 'src/components/AstryxTopNavHeading.tsx' },
      { names: ['AstryxTopNavItem'], sourceFile: 'src/components/AstryxTopNavItem.tsx' },
      { names: ['AstryxTopNavSlot'], sourceFile: 'src/components/AstryxTopNavSlot.tsx' },
      { names: ['AstryxVStack'], sourceFile: 'src/components/AstryxVStack.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxTopNav label="App navigation"><AstryxTopNavHeading brandDisplay="signature" heading="Astryx" superheading="Workbench" icon="component" /><AstryxTopNavItem href="#" isSelected label="Components" /><AstryxTopNavItem href="#" label="Tokens" /><AstryxTopNavSlot slot="end"><AstryxButton label="Create" variant="primary" /></AstryxTopNavSlot></AstryxTopNav>\n<AstryxSideNav collapsible={true}><AstryxSideNavHeading brandDisplay="signature" collapsedBrandDisplay="symbol" heading="Astryx" subheading="Component library" superheading="Workbench" icon="component"><AstryxBadge label="108" variant="success" /></AstryxSideNavHeading><AstryxSideNavSection title="Library" subtitle="Source-backed wrappers"><AstryxSideNavItem emphasis="button" href="#" icon="component" isSelected label="Components" endLabel="108" /><AstryxSideNavItem href="#" icon="viewColumns" label="Tokens" /><AstryxSideNavItem href="#" icon="settings" label="Guides" /></AstryxSideNavSection></AstryxSideNav>\n<AstryxVStack gap="md"><AstryxMetadataList columns="single" orientation="vertical"><AstryxMetadataListItem label="Shell" value="TopNav + SideNav" /><AstryxMetadataListItem label="Editable children" value="Navigation slots and content" /></AstryxMetadataList><AstryxBanner description="Use AppShell when navigation should behave as an application frame." status="info" title="Official app shell boundary" /></AstryxVStack>',
  },
};
export default meta;

export const AstryxAppShell = {
  name: 'AstryxAppShell',
  render: (args: Args) => (
    <AstryxAppShellComponent
      contentPadding={asSpacing(args.contentPadding, DEFAULT_PROPS.contentPadding)}
      frameHeight={asNumber(args.frameHeight, DEFAULT_PROPS.frameHeight)}
      hasMobileNav={asBoolean(args.hasMobileNav, DEFAULT_PROPS.hasMobileNav)}
      height={asOption(args.height, HEIGHTS, DEFAULT_PROPS.height)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    >
      <AstryxTopNav label="App navigation">
        <AstryxTopNavHeading brandDisplay="signature" heading="Astryx" superheading="Workbench" icon="component" />
        <AstryxTopNavItem href="#" isSelected label="Components" />
        <AstryxTopNavItem href="#" label="Tokens" />
        <AstryxTopNavSlot slot="end">
          <AstryxButton label="Create" variant="primary" />
        </AstryxTopNavSlot>
      </AstryxTopNav>
      <AstryxSideNav collapsible={true}>
        <AstryxSideNavHeading
          brandDisplay="signature"
          collapsedBrandDisplay="symbol"
          heading="Astryx"
          subheading="Component library"
          superheading="Workbench"
          icon="component"
        >
          <AstryxBadge label="108" variant="success" />
        </AstryxSideNavHeading>
        <AstryxSideNavSection title="Library" subtitle="Source-backed wrappers">
          <AstryxSideNavItem emphasis="button" href="#" icon="component" isSelected label="Components" endLabel="108" />
          <AstryxSideNavItem href="#" icon="viewColumns" label="Tokens" />
          <AstryxSideNavItem href="#" icon="settings" label="Guides" />
        </AstryxSideNavSection>
      </AstryxSideNav>
      <AstryxVStack gap="md">
        <AstryxMetadataList columns="single" orientation="vertical">
          <AstryxMetadataListItem label="Shell" value="TopNav + SideNav" />
          <AstryxMetadataListItem label="Editable children" value="Navigation slots and content" />
        </AstryxMetadataList>
        <AstryxBanner
          description="Use AppShell when navigation should behave as an application frame."
          status="info"
          title="Official app shell boundary"
        />
      </AstryxVStack>
    </AstryxAppShellComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asSpacing(value: unknown, fallback: SpacingValue): SpacingValue {
  return typeof value === 'number' && SPACING_VALUES.includes(value as SpacingValue)
    ? (value as SpacingValue)
    : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' ? value : fallback;
}
