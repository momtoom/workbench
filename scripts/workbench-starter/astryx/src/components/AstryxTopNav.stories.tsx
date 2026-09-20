import { AstryxButton } from './AstryxButton';
import { AstryxTextInput } from './AstryxTextInput';
import { AstryxTopNav as AstryxTopNavComponent } from './AstryxTopNav';
import { AstryxTopNavHeading } from './AstryxTopNavHeading';
import { AstryxTopNavItem } from './AstryxTopNavItem';
import { AstryxTopNavSlot } from './AstryxTopNavSlot';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  label: 'Primary navigation',
} as const;

const meta = {
  title: 'Astryx/TopNav',
  component: AstryxTopNavComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxTopNavHeading', 'AstryxTopNavItem', 'AstryxTopNavSlot'],
    group: 'Navigation',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
      { names: ['AstryxTextInput'], sourceFile: 'src/components/AstryxTextInput.tsx' },
      { names: ['AstryxTopNavHeading'], sourceFile: 'src/components/AstryxTopNavHeading.tsx' },
      { names: ['AstryxTopNavItem'], sourceFile: 'src/components/AstryxTopNavItem.tsx' },
      { names: ['AstryxTopNavSlot'], sourceFile: 'src/components/AstryxTopNavSlot.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxTopNavHeading brandDisplay="symbol" heading="Astryx" superheading="Workbench" icon="component" />\n<AstryxTopNavItem href="#" isSelected label="Components" />\n<AstryxTopNavItem href="#" label="Tokens" />\n<AstryxTopNavSlot slot="center"><AstryxTextInput isLabelHidden label="Search" placeholder="Search" /></AstryxTopNavSlot>\n<AstryxTopNavSlot slot="end"><AstryxButton label="Create" variant="primary" /></AstryxTopNavSlot>',
  },
};
export default meta;

export const AstryxTopNav = {
  name: 'AstryxTopNav',
  render: (args: Args) => (
    <AstryxTopNavComponent label={asText(args.label, DEFAULT_PROPS.label)}>
      <AstryxTopNavHeading brandDisplay="symbol" heading="Astryx" superheading="Workbench" icon="component" />
      <AstryxTopNavItem href="#" isSelected label="Components" />
      <AstryxTopNavItem href="#" label="Tokens" />
      <AstryxTopNavSlot slot="center">
        <AstryxTextInput isLabelHidden label="Search" placeholder="Search" />
      </AstryxTopNavSlot>
      <AstryxTopNavSlot slot="end">
        <AstryxButton label="Create" variant="primary" />
      </AstryxTopNavSlot>
    </AstryxTopNavComponent>
  ),
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
