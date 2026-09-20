import { CarouselCards as ShadcnCarouselCards } from './carousel-cards';
import { asBoolean, asOption, asText } from './story-utils';

type Args = {
  actionLabel?: boolean | string;
  align?: boolean | string;
  description?: boolean | string;
  itemSize?: boolean | string;
  loop?: boolean | string;
  showAction?: boolean | string;
  showBadges?: boolean | string;
  showControls?: boolean | string;
  title?: boolean | string;
};

const ALIGNS = ['start', 'center', 'end'] as const;
const ITEM_SIZES = ['single', 'half', 'third'] as const;

const DEFAULT_PROPS = {
  title: 'Carousel cards',
  description: 'Carousel card description.',
  actionLabel: 'Action',
  loop: false,
  align: 'start',
  itemSize: 'third',
  showAction: true,
  showBadges: true,
  showControls: true,
} as const;

const meta = {
  title: 'shadcn/Base UI/Carousel Cards',
  component: ShadcnCarouselCards,
  authoring: {
    group: 'Media',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    actionLabel: { control: 'text' },
    loop: { control: 'boolean' },
    align: { control: 'select', options: ALIGNS },
    itemSize: { control: 'select', options: ITEM_SIZES },
    showAction: { control: 'boolean' },
    showBadges: { control: 'boolean' },
    showControls: { control: 'boolean' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const CarouselCards = {
  name: 'CarouselCards',
  render: (args: Args) => (
    <div className="w-[720px]">
      <ShadcnCarouselCards
        actionLabel={asText(args.actionLabel, DEFAULT_PROPS.actionLabel)}
        align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}
        description={asText(args.description, DEFAULT_PROPS.description)}
        itemSize={asOption(args.itemSize, ITEM_SIZES, DEFAULT_PROPS.itemSize)}
        loop={asBoolean(args.loop, DEFAULT_PROPS.loop)}
        showAction={asBoolean(args.showAction, DEFAULT_PROPS.showAction)}
        showBadges={asBoolean(args.showBadges, DEFAULT_PROPS.showBadges)}
        showControls={asBoolean(args.showControls, DEFAULT_PROPS.showControls)}
        title={asText(args.title, DEFAULT_PROPS.title)}
      />
    </div>
  ),
};
