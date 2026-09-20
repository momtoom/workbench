import { AstryxButton } from './AstryxButton';
import { AstryxAvatar } from './AstryxAvatar';
import { AstryxIconButton } from './AstryxIconButton';
import { AstryxSideNav as AstryxSideNavComponent } from './AstryxSideNav';
import { AstryxSideNavCollapseButton } from './AstryxSideNavCollapseButton';
import { AstryxSideNavCollapseWrapper } from './AstryxSideNavCollapseWrapper';
import { AstryxSideNavHeading } from './AstryxSideNavHeading';
import { AstryxSideNavItem } from './AstryxSideNavItem';
import { AstryxSideNavSection } from './AstryxSideNavSection';
import { AstryxSideNavSlot } from './AstryxSideNavSlot';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | string>;

const DEFAULT_PROPS = {
  collapseButtonLabel: 'Toggle navigation',
  collapsible: true,
  defaultIsCollapsed: false,
  hasCollapseButton: false,
  resizable: false,
} as const;

const meta = {
  title: 'Astryx/SideNav',
  component: AstryxSideNavComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    collapseButtonLabel: { control: 'text' },
    collapsible: { control: 'boolean' },
    defaultIsCollapsed: { control: 'boolean' },
    hasCollapseButton: { control: 'boolean' },
    resizable: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: [
      'AstryxSideNavHeading',
      'AstryxSideNavSection',
      'AstryxSideNavItem',
      'AstryxSideNavSlot',
      'AstryxSideNavCollapseWrapper',
      'AstryxSideNavCollapseButton',
    ],
    group: 'Navigation',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
      { names: ['AstryxAvatar'], sourceFile: 'src/components/AstryxAvatar.tsx' },
      { names: ['AstryxIconButton'], sourceFile: 'src/components/AstryxIconButton.tsx' },
      { names: ['AstryxSideNavCollapseButton'], sourceFile: 'src/components/AstryxSideNavCollapseButton.tsx' },
      { names: ['AstryxSideNavCollapseWrapper'], sourceFile: 'src/components/AstryxSideNavCollapseWrapper.tsx' },
      { names: ['AstryxSideNavHeading'], sourceFile: 'src/components/AstryxSideNavHeading.tsx' },
      { names: ['AstryxSideNavItem'], sourceFile: 'src/components/AstryxSideNavItem.tsx' },
      { names: ['AstryxSideNavSection'], sourceFile: 'src/components/AstryxSideNavSection.tsx' },
      { names: ['AstryxSideNavSlot'], sourceFile: 'src/components/AstryxSideNavSlot.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxSideNavHeading brandDisplay="symbol" collapsedBrandDisplay="symbol" heading="Astryx" superheading="Workbench" icon="component" />\n<AstryxSideNavSlot slot="topContent"><AstryxButton label="Create" variant="primary" /></AstryxSideNavSlot>\n<AstryxSideNavSection title="Main" subtitle="Project navigation"><AstryxSideNavItem emphasis="button" href="#" icon="component" isSelected label="Components" endLabel="108" /><AstryxSideNavItem href="#" icon="settings" label="Tokens" /></AstryxSideNavSection>\n<AstryxSideNavSlot collapsedBehavior="show" slot="footer"><AstryxSideNavCollapseWrapper behavior="show"><AstryxAvatar name="Ada Lovelace" size="small" status="success" /></AstryxSideNavCollapseWrapper><AstryxSideNavCollapseWrapper behavior="hide"><AstryxText as="p" color="secondary" type="supporting">89 registered wrappers</AstryxText></AstryxSideNavCollapseWrapper></AstryxSideNavSlot>\n<AstryxSideNavSlot slot="footerIcons"><AstryxIconButton icon="info" label="Help" /><AstryxIconButton icon="settings" label="Settings" /><AstryxSideNavCollapseButton /></AstryxSideNavSlot>',
  },
};
export default meta;

export const AstryxSideNav = {
  name: 'AstryxSideNav',
  render: (args: Args) => (
    <AstryxSideNavComponent
      collapseButtonLabel={asText(args.collapseButtonLabel, DEFAULT_PROPS.collapseButtonLabel)}
      collapsible={asBoolean(args.collapsible)}
      defaultIsCollapsed={asBoolean(args.defaultIsCollapsed)}
      hasCollapseButton={asBoolean(args.hasCollapseButton)}
      resizable={asBoolean(args.resizable)}
    >
      <AstryxSideNavHeading brandDisplay="symbol" collapsedBrandDisplay="symbol" heading="Astryx" superheading="Workbench" icon="component" />
      <AstryxSideNavSlot slot="topContent">
        <AstryxButton label="Create" variant="primary" />
      </AstryxSideNavSlot>
      <AstryxSideNavSection title="Main" subtitle="Project navigation">
        <AstryxSideNavItem emphasis="button" href="#" icon="component" isSelected label="Components" endLabel="108" />
        <AstryxSideNavItem href="#" icon="settings" label="Tokens" />
      </AstryxSideNavSection>
      <AstryxSideNavSlot collapsedBehavior="show" slot="footer">
        <AstryxSideNavCollapseWrapper behavior="show">
          <AstryxAvatar name="Ada Lovelace" size="small" status="success" />
        </AstryxSideNavCollapseWrapper>
        <AstryxSideNavCollapseWrapper behavior="hide">
          <AstryxText as="p" color="secondary" type="supporting">
            89 registered wrappers
          </AstryxText>
        </AstryxSideNavCollapseWrapper>
      </AstryxSideNavSlot>
      <AstryxSideNavSlot slot="footerIcons">
        <AstryxIconButton icon="info" label="Help" />
        <AstryxIconButton icon="settings" label="Settings" />
        <AstryxSideNavCollapseButton />
      </AstryxSideNavSlot>
    </AstryxSideNavComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
