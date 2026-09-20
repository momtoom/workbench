import { AstryxBadge } from './AstryxBadge';
import { AstryxIcon } from './AstryxIcon';
import { AstryxItem as AstryxItemComponent } from './AstryxItem';
import { AstryxItemSlot } from './AstryxItemSlot';
import { AstryxStack } from './AstryxStack';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | number | string>;

const ELEMENTS = ['div', 'li', 'span'] as const;
const ALIGNS = ['center', 'start'] as const;
const DENSITIES = ['compact', 'balanced', 'spacious'] as const;

const DEFAULT_PROPS = {
  href: '',
  as: 'div',
  align: 'center',
  density: 'balanced',
  descriptionLines: 2,
  isClickable: false,
  isDisabled: false,
  isHighlighted: false,
  isSelected: false,
  labelLines: 1,
  target: '_self',
} as const;

const meta = {
  title: 'Astryx/Item',
  component: AstryxItemComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    href: { control: 'text' },
    as: { control: 'select', options: ELEMENTS },
    align: { control: 'select', options: ALIGNS },
    density: { control: 'select', options: DENSITIES },
    descriptionLines: { control: 'number' },
    isClickable: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    isHighlighted: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    labelLines: { control: 'number' },
    target: { control: 'select', options: ['_self', '_blank'] },
  },
  authoring: {
    allowedChildren: ['AstryxItemSlot'],
    group: 'Content',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxBadge'],
        sourceFile: 'src/components/AstryxBadge.tsx',
      },
      {
        names: ['AstryxIcon'],
        sourceFile: 'src/components/AstryxIcon.tsx',
      },
      {
        names: ['AstryxItemSlot'],
        sourceFile: 'src/components/AstryxItemSlot.tsx',
      },
      {
        names: ['AstryxStack'],
        sourceFile: 'src/components/AstryxStack.tsx',
      },
      {
        names: ['AstryxText'],
        sourceFile: 'src/components/AstryxText.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxItemSlot slot="start"><AstryxIcon icon="success" size="sm" /></AstryxItemSlot>\n<AstryxItemSlot slot="body"><AstryxStack gap={1}><AstryxText as="span" display="block" type="label">Source-driven registry</AstryxText><AstryxText as="span" color="secondary" display="block" type="supporting">Compose icons, text, badges, metadata, and controls as editable children.</AstryxText></AstryxStack></AstryxItemSlot>\n<AstryxItemSlot slot="end"><AstryxBadge label="Ready" variant="success" /></AstryxItemSlot>',
  },
};
export default meta;

export const AstryxItem = {
  name: 'AstryxItem',
  render: (args: Args) => (
    <AstryxItemComponent
      align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
      as={asOption(args.as, ELEMENTS, DEFAULT_PROPS.as)}
      density={asOption(args.density, DENSITIES, DEFAULT_PROPS.density)}
      descriptionLines={asNumber(args.descriptionLines, DEFAULT_PROPS.descriptionLines)}
      href={asText(args.href)}
      isClickable={asBoolean(args.isClickable)}
      isDisabled={asBoolean(args.isDisabled)}
      isHighlighted={asBoolean(args.isHighlighted)}
      isSelected={asBoolean(args.isSelected)}
      labelLines={asNumber(args.labelLines, DEFAULT_PROPS.labelLines)}
      target={asOption(args.target, ['_self', '_blank'] as const, DEFAULT_PROPS.target)}
    >
      <AstryxItemSlot slot="start">
        <AstryxIcon icon="success" size="sm" />
      </AstryxItemSlot>
      <AstryxItemSlot slot="body">
        <AstryxStack gap={1}>
          <AstryxText as="span" display="block" type="label">
            Source-driven registry
          </AstryxText>
          <AstryxText as="span" color="secondary" display="block" type="supporting">
            Compose icons, text, badges, metadata, and controls as editable children.
          </AstryxText>
        </AstryxStack>
      </AstryxItemSlot>
      <AstryxItemSlot slot="end">
        <AstryxBadge label="Ready" variant="success" />
      </AstryxItemSlot>
    </AstryxItemComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
