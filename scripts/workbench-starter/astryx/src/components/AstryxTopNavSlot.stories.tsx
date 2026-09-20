import { AstryxButton } from './AstryxButton';
import { AstryxTopNavSlot as AstryxTopNavSlotComponent } from './AstryxTopNavSlot';

type Args = Record<string, string>;

const SLOTS = ['start', 'center', 'end'] as const;

const DEFAULT_PROPS = {
  slot: 'end',
} as const;

const meta = {
  title: 'Astryx/TopNavSlot',
  component: AstryxTopNavSlotComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    slot: { control: 'select', options: SLOTS },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxButton label="Action" variant="primary" />',
  },
};
export default meta;

export const AstryxTopNavSlot = {
  name: 'AstryxTopNavSlot',
  render: (args: Args) => (
    <AstryxTopNavSlotComponent slot={asOption(args.slot, SLOTS, DEFAULT_PROPS.slot)}>
      <AstryxButton label="Action" variant="primary" />
    </AstryxTopNavSlotComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
