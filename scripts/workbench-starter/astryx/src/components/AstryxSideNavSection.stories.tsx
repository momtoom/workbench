import { AstryxSideNavItem } from './AstryxSideNavItem';
import { AstryxSideNavSection as AstryxSideNavSectionComponent } from './AstryxSideNavSection';

type Args = Record<string, boolean | string>;

const DEFAULT_PROPS = {
  title: 'Main',
  subtitle: 'Project navigation',
  endLabel: '',
  isHeaderHidden: false,
} as const;

const meta = {
  title: 'Astryx/SideNavSection',
  component: AstryxSideNavSectionComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    endLabel: { control: 'text' },
    isHeaderHidden: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxSideNavItem'],
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxSideNavItem'], sourceFile: 'src/components/AstryxSideNavItem.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxSideNavItem href="#" icon="component" isSelected label="Components" />\n<AstryxSideNavItem href="#" icon="settings" label="Tokens" />',
  },
};
export default meta;

export const AstryxSideNavSection = {
  name: 'AstryxSideNavSection',
  render: (args: Args) => (
    <AstryxSideNavSectionComponent
      endLabel={asText(args.endLabel)}
      isHeaderHidden={asBoolean(args.isHeaderHidden)}
      subtitle={asText(args.subtitle, DEFAULT_PROPS.subtitle)}
      title={asText(args.title, DEFAULT_PROPS.title)}
    >
      <AstryxSideNavItem href="#" icon="component" isSelected label="Components" />
      <AstryxSideNavItem href="#" icon="settings" label="Tokens" />
    </AstryxSideNavSectionComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
