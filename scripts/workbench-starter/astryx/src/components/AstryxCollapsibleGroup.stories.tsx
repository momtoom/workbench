import { AstryxCollapsible } from './AstryxCollapsible';
import { AstryxCollapsibleGroup as AstryxCollapsibleGroupComponent } from './AstryxCollapsibleGroup';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | string>;

const TYPES = ['single', 'multiple'] as const;
const DENSITIES = ['compact', 'balanced', 'spacious'] as const;

const DEFAULT_PROPS = {
  defaultValue: 'shipping',
  type: 'single',
  density: 'balanced',
  hasDividers: true,
} as const;

const meta = {
  title: 'Astryx/CollapsibleGroup',
  component: AstryxCollapsibleGroupComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    defaultValue: { control: 'text' },
    type: { control: 'select', options: TYPES },
    density: { control: 'select', options: DENSITIES },
    hasDividers: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxCollapsible'],
    group: 'Layout',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxCollapsible'], sourceFile: 'src/components/AstryxCollapsible.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxCollapsible trigger="Shipping Information" value="shipping"><AstryxText as="p" color="secondary" type="body">Standard shipping takes 3–5 business days. Express shipping is available for an additional fee.</AstryxText></AstryxCollapsible>\n<AstryxCollapsible trigger="Return Policy" value="returns"><AstryxText as="p" color="secondary" type="body">Unused items can be returned within 30 days of delivery.</AstryxText></AstryxCollapsible>\n<AstryxCollapsible trigger="Payment Methods" value="payment"><AstryxText as="p" color="secondary" type="body">We accept major cards and supported digital wallets.</AstryxText></AstryxCollapsible>',
  },
};
export default meta;

export const AstryxCollapsibleGroup = {
  name: 'AstryxCollapsibleGroup',
  render: (args: Args) => (
    <AstryxCollapsibleGroupComponent
      defaultValue={asText(args.defaultValue, DEFAULT_PROPS.defaultValue)}
      density={asOption(args.density, DENSITIES, DEFAULT_PROPS.density)}
      hasDividers={asBoolean(args.hasDividers)}
      type={asOption(args.type, TYPES, DEFAULT_PROPS.type)}
    >
      <AstryxCollapsible trigger="Shipping Information" value="shipping">
        <AstryxText as="p" color="secondary" type="body">
          Standard shipping takes 3–5 business days. Express shipping is available for an additional fee.
        </AstryxText>
      </AstryxCollapsible>
      <AstryxCollapsible trigger="Return Policy" value="returns">
        <AstryxText as="p" color="secondary" type="body">
          Unused items can be returned within 30 days of delivery.
        </AstryxText>
      </AstryxCollapsible>
      <AstryxCollapsible trigger="Payment Methods" value="payment">
        <AstryxText as="p" color="secondary" type="body">
          We accept major cards and supported digital wallets.
        </AstryxText>
      </AstryxCollapsible>
    </AstryxCollapsibleGroupComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}
