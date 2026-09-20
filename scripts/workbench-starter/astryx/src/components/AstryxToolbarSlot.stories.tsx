import { AstryxButton } from './AstryxButton';
import { AstryxToolbarSlot as AstryxToolbarSlotComponent } from './AstryxToolbarSlot';

type Args = Record<string, string>;

const SLOTS = ['start', 'center', 'end'] as const;

const DEFAULT_PROPS = {
  slot: 'start',
} as const;

const meta = {
  title: 'Astryx/ToolbarSlot',
  component: AstryxToolbarSlotComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    slot: { control: 'select', options: SLOTS },
  },
  authoring: {
    group: 'Actions',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxButton label="Action" />',
  },
};
export default meta;

export const AstryxToolbarSlot = {
  name: 'AstryxToolbarSlot',
  render: (args: Args) => (
    <AstryxToolbarSlotComponent slot={asOption(args.slot, SLOTS, DEFAULT_PROPS.slot)}>
      <AstryxButton label="Action" />
    </AstryxToolbarSlotComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
