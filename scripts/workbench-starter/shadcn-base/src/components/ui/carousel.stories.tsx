import {
  Carousel as ShadcnCarousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselSlide,
} from './carousel';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  align?: boolean | string;
  controlOffset?: boolean | string;
  controlPosition?: boolean | string;
  controlShape?: boolean | string;
  controlSize?: boolean | string;
  controlTone?: boolean | string;
  controlVariant?: boolean | string;
  itemsPerView?: boolean | number | string;
  layoutHeight?: boolean | string;
  layoutWidth?: boolean | string;
  loop?: boolean | string;
  orientation?: boolean | string;
  paddingX?: boolean | string;
  paddingY?: boolean | string;
  radius?: boolean | string;
  showControls?: boolean | string;
  verticalPaddingX?: boolean | string;
  verticalPaddingY?: boolean | string;
};

const ALIGNS = ['start', 'center', 'end'] as const;
const CONTROL_POSITIONS = ['outside', 'inside'] as const;
const CONTROL_SHAPES = ['rounded', 'pill'] as const;
const CONTROL_SIZES = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const;
const CONTROL_TONES = ['default', 'diff'] as const;
const CONTROL_VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;
const ORIENTATIONS = ['horizontal', 'vertical'] as const;
const RADII = ['none', 'default', 'sm', 'md', 'lg', 'xl', 'full'] as const;

const DEFAULT_PROPS = {
  loop: false,
  radius: 'default',
  orientation: 'horizontal',
  controlPosition: 'outside',
  controlOffset: '3rem',
  controlShape: 'pill',
  controlSize: 'icon-sm',
  controlTone: 'default',
  controlVariant: 'outline',
  align: 'start',
  itemsPerView: 1,
  layoutHeight: '360px',
  layoutWidth: '360px',
  paddingX: '3rem',
  paddingY: '2.5rem',
  showControls: true,
  verticalPaddingX: '2.5rem',
  verticalPaddingY: '3rem',
} as const;

const slides = ['Slide 1', 'Slide 2', 'Slide 3'];
const DEFAULT_SLIDE_CLASS_NAME =
  'flex h-40 items-center justify-center rounded-lg border bg-muted text-lg font-medium';

const meta = {
  title: 'shadcn/Base UI/Carousel',
  component: ShadcnCarousel,
  authoring: {
    group: 'Media',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    loop: { control: 'boolean' },
    radius: { control: 'select', options: RADII },
    orientation: { control: 'select', options: ORIENTATIONS },
    controlPosition: { control: 'select', options: CONTROL_POSITIONS },
    controlOffset: { control: 'text' },
    controlShape: { control: 'select', options: CONTROL_SHAPES },
    controlSize: { control: 'select', options: CONTROL_SIZES },
    controlTone: { control: 'select', options: CONTROL_TONES },
    controlVariant: { control: 'select', options: CONTROL_VARIANTS },
    align: { control: 'select', options: ALIGNS },
    itemsPerView: { control: { type: 'number', min: 1, max: 4, step: 1 } },
    layoutHeight: { control: 'text' },
    layoutWidth: { control: 'text' },
    paddingX: { control: 'text' },
    paddingY: { control: 'text' },
    showControls: { control: 'boolean' },
    verticalPaddingX: { control: 'text' },
    verticalPaddingY: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['CarouselSlide'],
        sourceFile: 'src/components/ui/carousel.tsx',
      },
    ],
    jsxChildren:
      '<CarouselSlide><div className="flex h-40 items-center justify-center rounded-lg border bg-muted text-lg font-medium">Slide 1</div></CarouselSlide><CarouselSlide><div className="flex h-40 items-center justify-center rounded-lg border bg-muted text-lg font-medium">Slide 2</div></CarouselSlide><CarouselSlide><div className="flex h-40 items-center justify-center rounded-lg border bg-muted text-lg font-medium">Slide 3</div></CarouselSlide>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Carousel = {
  name: 'Carousel',
  render: (args: Args) => {
    const align = asOption(args.align, ALIGNS, 'start');
    const controlOffset = asText(args.controlOffset, DEFAULT_PROPS.controlOffset);
    const controlPosition = asOption(args.controlPosition, CONTROL_POSITIONS, DEFAULT_PROPS.controlPosition);
    const controlShape = asOption(args.controlShape, CONTROL_SHAPES, DEFAULT_PROPS.controlShape);
    const controlSize = asOption(args.controlSize, CONTROL_SIZES, DEFAULT_PROPS.controlSize);
    const controlTone = asOption(args.controlTone, CONTROL_TONES, DEFAULT_PROPS.controlTone);
    const controlVariant = asOption(args.controlVariant, CONTROL_VARIANTS, DEFAULT_PROPS.controlVariant);
    const itemsPerView = asNumber(args.itemsPerView, DEFAULT_PROPS.itemsPerView, { min: 1, max: 4 });
    const layoutHeight = asText(args.layoutHeight, DEFAULT_PROPS.layoutHeight);
    const layoutWidth = asText(args.layoutWidth, DEFAULT_PROPS.layoutWidth);
    const loop = asBoolean(args.loop, false);
    const orientation = asOption(args.orientation, ORIENTATIONS, 'horizontal');
    const paddingX = asText(args.paddingX, DEFAULT_PROPS.paddingX);
    const paddingY = asText(args.paddingY, DEFAULT_PROPS.paddingY);
    const radius = asOption(args.radius, RADII, DEFAULT_PROPS.radius);
    const showControls = asBoolean(args.showControls, true);
    const verticalPaddingX = asText(args.verticalPaddingX, DEFAULT_PROPS.verticalPaddingX);
    const verticalPaddingY = asText(args.verticalPaddingY, DEFAULT_PROPS.verticalPaddingY);
    return (
      <ShadcnCarousel
        align={align}
        controlOffset={controlOffset}
        controlPosition={controlPosition}
        controlShape={controlShape}
        controlSize={controlSize}
        controlTone={controlTone}
        controlVariant={controlVariant}
        itemsPerView={itemsPerView}
        layoutHeight={layoutHeight}
        layoutWidth={layoutWidth}
        loop={loop}
        orientation={orientation}
        paddingX={paddingX}
        paddingY={paddingY}
        radius={radius}
        showControls={showControls}
        verticalPaddingX={verticalPaddingX}
        verticalPaddingY={verticalPaddingY}
      >
        {slides.map((slide) => (
          <CarouselSlide key={slide}>
            <div className={DEFAULT_SLIDE_CLASS_NAME}>{slide}</div>
          </CarouselSlide>
        ))}
      </ShadcnCarousel>
    );
  },
};

export const CarouselSlideStory = {
  name: 'CarouselSlide',
  sourceInsert: {
    jsxChildren:
      '<div className="flex h-40 items-center justify-center rounded-lg border bg-muted text-lg font-medium">Slide</div>',
  },
  render: () => (
    <ShadcnCarousel layoutWidth="20rem" paddingX="3rem">
      <CarouselSlide>
        <div className={DEFAULT_SLIDE_CLASS_NAME}>Slide</div>
      </CarouselSlide>
    </ShadcnCarousel>
  ),
};

export const CarouselContentStory = {
  name: 'CarouselContent',
  sourceInsert: {
    imports: [
      {
        names: ['CarouselItem'],
        sourceFile: 'src/components/ui/carousel.tsx',
      },
    ],
    jsxChildren: '<CarouselItem>Slide 1</CarouselItem><CarouselItem>Slide 2</CarouselItem>',
  },
  render: () => (
    <ShadcnCarousel layoutWidth="20rem">
      <CarouselContent>
        <CarouselItem>Slide 1</CarouselItem>
        <CarouselItem>Slide 2</CarouselItem>
      </CarouselContent>
    </ShadcnCarousel>
  ),
};

export const CarouselItemStory = {
  name: 'CarouselItem',
  sourceInsert: {
    props: {
      children: 'Slide',
    },
  },
  render: () => (
    <ShadcnCarousel layoutWidth="20rem">
      <CarouselContent>
        <CarouselItem>
          <div className="rounded-lg border p-6">Slide</div>
        </CarouselItem>
      </CarouselContent>
    </ShadcnCarousel>
  ),
};

export const CarouselPreviousStory = {
  name: 'CarouselPrevious',
  sourceInsert: {},
  render: () => (
    <ShadcnCarousel layoutWidth="20rem" paddingX="3rem">
      <CarouselContent><CarouselItem>Slide</CarouselItem></CarouselContent>
      <CarouselPrevious />
    </ShadcnCarousel>
  ),
};

export const CarouselNextStory = {
  name: 'CarouselNext',
  sourceInsert: {},
  render: () => (
    <ShadcnCarousel layoutWidth="20rem" paddingX="3rem">
      <CarouselContent><CarouselItem>Slide</CarouselItem></CarouselContent>
      <CarouselNext />
    </ShadcnCarousel>
  ),
};
