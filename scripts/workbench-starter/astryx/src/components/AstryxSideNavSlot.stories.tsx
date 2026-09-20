import { AstryxButton } from './AstryxButton';
import { AstryxSideNavSlot as AstryxSideNavSlotComponent } from './AstryxSideNavSlot';

type Args = Record<string, string>;

const SLOTS = ['topContent', 'footer', 'footerIcons'] as const;
const COLLAPSED_BEHAVIORS = ['auto', 'hide', 'show'] as const;

const DEFAULT_PROPS = {
  collapsedBehavior: 'auto',
  slot: 'topContent',
} as const;

const meta = {
  title: 'Astryx/SideNavSlot',
  component: AstryxSideNavSlotComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    collapsedBehavior: { control: 'select', options: COLLAPSED_BEHAVIORS },
    slot: { control: 'select', options: SLOTS },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxButton label="Create" variant="primary" />',
  },
};
export default meta;

export const AstryxSideNavSlot = {
  name: 'AstryxSideNavSlot',
  render: (args: Args) => (
    <AstryxSideNavSlotComponent
      collapsedBehavior={asOption(args.collapsedBehavior, COLLAPSED_BEHAVIORS, DEFAULT_PROPS.collapsedBehavior)}
      slot={asOption(args.slot, SLOTS, DEFAULT_PROPS.slot)}
    >
      <AstryxButton label="Create" variant="primary" />
    </AstryxSideNavSlotComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
