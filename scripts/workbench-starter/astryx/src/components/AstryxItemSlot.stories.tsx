import { AstryxIcon } from './AstryxIcon';
import { AstryxItemSlot as AstryxItemSlotComponent } from './AstryxItemSlot';
import { AstryxText } from './AstryxText';

type Args = Record<string, string>;

const SLOTS = ['marker', 'start', 'body', 'end'] as const;

const DEFAULT_PROPS = {
  slot: 'body',
} as const;

const meta = {
  title: 'Astryx/ItemSlot',
  component: AstryxItemSlotComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    slot: { control: 'select', options: SLOTS },
  },
  authoring: {
    group: 'Content',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxIcon'],
        sourceFile: 'src/components/AstryxIcon.tsx',
      },
      {
        names: ['AstryxText'],
        sourceFile: 'src/components/AstryxText.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxIcon icon="success" size="sm" />\n<AstryxText as="span" type="label">Item slot</AstryxText>',
  },
};
export default meta;

export const AstryxItemSlot = {
  name: 'AstryxItemSlot',
  render: (args: Args) => (
    <AstryxItemSlotComponent slot={asOption(args.slot, SLOTS, DEFAULT_PROPS.slot)}>
      <AstryxIcon icon="success" size="sm" />
      <AstryxText as="span" type="label">
        Item slot
      </AstryxText>
    </AstryxItemSlotComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
