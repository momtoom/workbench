import { AstryxButton } from './AstryxButton';
import { AstryxCard } from './AstryxCard';
import { AstryxCarousel as AstryxCarouselComponent } from './AstryxCarousel';
import { AstryxStack } from './AstryxStack';
import { AstryxText } from './AstryxText';

type Args = Record<string, boolean | number | string | undefined>;

const GAPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl', 0, 0.5, 1, 1.5, 2, 3, 4] as const;
const PADDING = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] as const;
const EDGE_FADE_SIZES = ['sm', 'md', 'lg', 'xl'] as const;

const DEFAULT_PROPS = {
  label: 'Featured albums',
  gap: 'sm',
  padding: 'none',
  edgeFadeSize: 'lg',
  hasButtons: true,
  hasEdgeFade: true,
  hasSnap: true,
  itemMaxWidth: '',
  itemMinWidth: '',
  itemsPerView: 3,
  paddingEnd: 0,
  paddingStart: 0,
} as const;

const meta = {
  title: 'Astryx/Carousel',
  component: AstryxCarouselComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    gap: { control: 'select', options: GAPS },
    padding: { control: 'select', options: PADDING },
    edgeFadeSize: { control: 'select', options: EDGE_FADE_SIZES },
    hasButtons: { control: 'boolean' },
    hasEdgeFade: { control: 'boolean' },
    hasSnap: { control: 'boolean' },
    itemMaxWidth: { control: 'text' },
    itemMinWidth: { control: 'text' },
    itemsPerView: { control: 'number' },
    paddingEnd: { control: 'number' },
    paddingStart: { control: 'number' },
  },
  authoring: {
    group: 'Media',
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' },
      { names: ['AstryxCard'], sourceFile: 'src/components/AstryxCard.tsx' },
      { names: ['AstryxStack'], sourceFile: 'src/components/AstryxStack.tsx' },
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxCard padding="md"><AstryxStack gap={2}><AstryxText as="h3" display="block" type="large" weight="bold">New release</AstryxText><AstryxText as="p" color="secondary" display="block" type="supporting">Featured music and editorial picks.</AstryxText><AstryxButton label="Play" variant="primary" /></AstryxStack></AstryxCard>\n<AstryxCard padding="md"><AstryxStack gap={2}><AstryxText as="h3" display="block" type="large" weight="bold">Artist radio</AstryxText><AstryxText as="p" color="secondary" display="block" type="supporting">A rolling mix based on this track.</AstryxText><AstryxButton label="Open" variant="secondary" /></AstryxStack></AstryxCard>\n<AstryxCard padding="md"><AstryxStack gap={2}><AstryxText as="h3" display="block" type="large" weight="bold">Deep cuts</AstryxText><AstryxText as="p" color="secondary" display="block" type="supporting">Less obvious songs worth saving.</AstryxText><AstryxButton label="Browse" variant="secondary" /></AstryxStack></AstryxCard>',
  },
};
export default meta;

export const AstryxCarousel = {
  name: 'AstryxCarousel',
  render: (args: Args) => (
    <AstryxCarouselComponent
      gap={asOption(args.gap, GAPS, DEFAULT_PROPS.gap)}
      edgeFadeSize={asOption(args.edgeFadeSize, EDGE_FADE_SIZES, DEFAULT_PROPS.edgeFadeSize)}
      hasButtons={asBoolean(args.hasButtons)}
      hasEdgeFade={asBoolean(args.hasEdgeFade)}
      hasSnap={asBoolean(args.hasSnap)}
      itemsPerView={asOptionalNumber(args.itemsPerView)}
      itemMinWidth={asText(args.itemMinWidth)}
      itemMaxWidth={asText(args.itemMaxWidth)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      padding={asOption(args.padding, PADDING, DEFAULT_PROPS.padding)}
      paddingStart={asOptionalNumber(args.paddingStart)}
      paddingEnd={asOptionalNumber(args.paddingEnd)}
    >
      <AstryxCard padding="md">
        <AstryxStack gap={2}>
          <AstryxText as="h3" display="block" type="large" weight="bold">New release</AstryxText>
          <AstryxText as="p" color="secondary" display="block" type="supporting">Featured music and editorial picks.</AstryxText>
          <AstryxButton label="Play" variant="primary" />
        </AstryxStack>
      </AstryxCard>
      <AstryxCard padding="md">
        <AstryxStack gap={2}>
          <AstryxText as="h3" display="block" type="large" weight="bold">Artist radio</AstryxText>
          <AstryxText as="p" color="secondary" display="block" type="supporting">A rolling mix based on this track.</AstryxText>
          <AstryxButton label="Open" variant="secondary" />
        </AstryxStack>
      </AstryxCard>
      <AstryxCard padding="md">
        <AstryxStack gap={2}>
          <AstryxText as="h3" display="block" type="large" weight="bold">Deep cuts</AstryxText>
          <AstryxText as="p" color="secondary" display="block" type="supporting">Less obvious songs worth saving.</AstryxText>
          <AstryxButton label="Browse" variant="secondary" />
        </AstryxStack>
      </AstryxCard>
    </AstryxCarouselComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asOption<T extends string | number>(value: unknown, options: readonly T[], fallback: T): T {
  return (typeof value === 'string' || typeof value === 'number') && options.includes(value as T)
    ? (value as T)
    : fallback;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
