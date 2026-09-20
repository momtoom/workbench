export type TailwindUtilityInfo = {
  category: string;
  className: string;
  description: string;
  docsUrl?: string;
  group?: string;
  valueExamples: string[];
};

export type ClassNameTokenInfo = TailwindUtilityInfo & {
  kind: 'custom' | 'tailwind';
};

const TAILWIND_DOCS = {
  alignItems: 'https://tailwindcss.com/docs/align-items',
  alignContent: 'https://tailwindcss.com/docs/align-content',
  alignSelf: 'https://tailwindcss.com/docs/align-self',
  animation: 'https://tailwindcss.com/docs/animation',
  appearance: 'https://tailwindcss.com/docs/appearance',
  aspectRatio: 'https://tailwindcss.com/docs/aspect-ratio',
  backdropBrightness: 'https://tailwindcss.com/docs/backdrop-brightness',
  backdropBlur: 'https://tailwindcss.com/docs/backdrop-blur',
  backdropContrast: 'https://tailwindcss.com/docs/backdrop-contrast',
  backdropSaturate: 'https://tailwindcss.com/docs/backdrop-saturate',
  backgroundBlendMode: 'https://tailwindcss.com/docs/background-blend-mode',
  backgroundColor: 'https://tailwindcss.com/docs/background-color',
  borderColor: 'https://tailwindcss.com/docs/border-color',
  borderRadius: 'https://tailwindcss.com/docs/border-radius',
  borderWidth: 'https://tailwindcss.com/docs/border-width',
  brightness: 'https://tailwindcss.com/docs/brightness',
  blur: 'https://tailwindcss.com/docs/blur',
  boxShadow: 'https://tailwindcss.com/docs/box-shadow',
  color: 'https://tailwindcss.com/docs/color',
  contrast: 'https://tailwindcss.com/docs/contrast',
  containerQueries: 'https://tailwindcss.com/docs/responsive-design#container-queries',
  cursor: 'https://tailwindcss.com/docs/cursor',
  darkMode: 'https://tailwindcss.com/docs/dark-mode',
  display: 'https://tailwindcss.com/docs/display',
  divideColor: 'https://tailwindcss.com/docs/divide-color',
  divideWidth: 'https://tailwindcss.com/docs/divide-width',
  dropShadow: 'https://tailwindcss.com/docs/drop-shadow',
  flex: 'https://tailwindcss.com/docs/flex',
  flexBasis: 'https://tailwindcss.com/docs/flex-basis',
  flexDirection: 'https://tailwindcss.com/docs/flex-direction',
  flexGrow: 'https://tailwindcss.com/docs/flex-grow',
  flexShrink: 'https://tailwindcss.com/docs/flex-shrink',
  flexWrap: 'https://tailwindcss.com/docs/flex-wrap',
  fontSize: 'https://tailwindcss.com/docs/font-size',
  fontWeight: 'https://tailwindcss.com/docs/font-weight',
  gap: 'https://tailwindcss.com/docs/gap',
  gridAutoFlow: 'https://tailwindcss.com/docs/grid-auto-flow',
  gridColumn: 'https://tailwindcss.com/docs/grid-column',
  gridRow: 'https://tailwindcss.com/docs/grid-row',
  gridTemplateColumns: 'https://tailwindcss.com/docs/grid-template-columns',
  gridTemplateRows: 'https://tailwindcss.com/docs/grid-template-rows',
  height: 'https://tailwindcss.com/docs/height',
  inset: 'https://tailwindcss.com/docs/top-right-bottom-left',
  isolation: 'https://tailwindcss.com/docs/isolation',
  justifyContent: 'https://tailwindcss.com/docs/justify-content',
  justifyItems: 'https://tailwindcss.com/docs/justify-items',
  justifySelf: 'https://tailwindcss.com/docs/justify-self',
  letterSpacing: 'https://tailwindcss.com/docs/letter-spacing',
  lineHeight: 'https://tailwindcss.com/docs/line-height',
  listStyleType: 'https://tailwindcss.com/docs/list-style-type',
  margin: 'https://tailwindcss.com/docs/margin',
  maxWidth: 'https://tailwindcss.com/docs/max-width',
  minHeight: 'https://tailwindcss.com/docs/min-height',
  minWidth: 'https://tailwindcss.com/docs/min-width',
  mixBlendMode: 'https://tailwindcss.com/docs/mix-blend-mode',
  objectFit: 'https://tailwindcss.com/docs/object-fit',
  objectPosition: 'https://tailwindcss.com/docs/object-position',
  opacity: 'https://tailwindcss.com/docs/opacity',
  order: 'https://tailwindcss.com/docs/order',
  outlineColor: 'https://tailwindcss.com/docs/outline-color',
  outlineWidth: 'https://tailwindcss.com/docs/outline-width',
  overflow: 'https://tailwindcss.com/docs/overflow',
  padding: 'https://tailwindcss.com/docs/padding',
  placeContent: 'https://tailwindcss.com/docs/place-content',
  placeItems: 'https://tailwindcss.com/docs/place-items',
  placeSelf: 'https://tailwindcss.com/docs/place-self',
  pointerEvents: 'https://tailwindcss.com/docs/pointer-events',
  position: 'https://tailwindcss.com/docs/position',
  responsiveDesign: 'https://tailwindcss.com/docs/responsive-design',
  ringColor: 'https://tailwindcss.com/docs/ring-color',
  ringWidth: 'https://tailwindcss.com/docs/ring-width',
  rotate: 'https://tailwindcss.com/docs/rotate',
  scale: 'https://tailwindcss.com/docs/scale',
  saturate: 'https://tailwindcss.com/docs/saturate',
  scrollSnapAlign: 'https://tailwindcss.com/docs/scroll-snap-align',
  scrollSnapType: 'https://tailwindcss.com/docs/scroll-snap-type',
  sizing: 'https://tailwindcss.com/docs/width',
  states: 'https://tailwindcss.com/docs/hover-focus-and-other-states',
  textAlign: 'https://tailwindcss.com/docs/text-align',
  textDecoration: 'https://tailwindcss.com/docs/text-decoration-line',
  textOverflow: 'https://tailwindcss.com/docs/text-overflow',
  textTransform: 'https://tailwindcss.com/docs/text-transform',
  transform: 'https://tailwindcss.com/docs/transform',
  transitionDuration: 'https://tailwindcss.com/docs/transition-duration',
  transitionProperty: 'https://tailwindcss.com/docs/transition-property',
  transitionTimingFunction: 'https://tailwindcss.com/docs/transition-timing-function',
  translate: 'https://tailwindcss.com/docs/translate',
  userSelect: 'https://tailwindcss.com/docs/user-select',
  verticalAlign: 'https://tailwindcss.com/docs/vertical-align',
  visibility: 'https://tailwindcss.com/docs/visibility',
  whiteSpace: 'https://tailwindcss.com/docs/white-space',
  width: 'https://tailwindcss.com/docs/width',
  zIndex: 'https://tailwindcss.com/docs/z-index',
} as const;

const TAILWIND_UTILITY_SUGGESTIONS: TailwindUtilityInfo[] = dedupeTailwindUtilitySuggestions([
  {
    category: 'Layout',
    className: 'flex',
    description: 'Uses flexbox layout for direct children.',
    docsUrl: TAILWIND_DOCS.display,
    group: 'display',
    valueExamples: ['flex', 'inline-flex', 'grid', 'block', 'hidden'],
  },
  {
    category: 'Layout',
    className: 'grid',
    description: 'Uses CSS grid layout for direct children.',
    docsUrl: TAILWIND_DOCS.display,
    group: 'display',
    valueExamples: ['grid', 'flex', 'block', 'hidden'],
  },
  {
    category: 'Layout',
    className: 'hidden',
    description: 'Hides the element with display none.',
    docsUrl: TAILWIND_DOCS.display,
    group: 'display',
    valueExamples: ['hidden', 'block', 'flex', 'grid'],
  },
  {
    category: 'Layout',
    className: 'relative',
    description: 'Sets the element position to relative.',
    docsUrl: TAILWIND_DOCS.position,
    group: 'position',
    valueExamples: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  },
  {
    category: 'Layout',
    className: 'overflow-hidden',
    description: 'Clips overflowing content.',
    docsUrl: TAILWIND_DOCS.overflow,
    group: 'overflow',
    valueExamples: ['overflow-hidden', 'overflow-auto', 'overflow-visible'],
  },
  {
    category: 'Flex',
    className: 'items-center',
    description: 'Centers flex or grid children on the cross axis.',
    docsUrl: TAILWIND_DOCS.alignItems,
    group: 'align-items',
    valueExamples: ['items-start', 'items-center', 'items-end', 'items-stretch'],
  },
  {
    category: 'Flex',
    className: 'justify-between',
    description: 'Distributes children with space between them.',
    docsUrl: TAILWIND_DOCS.justifyContent,
    group: 'justify-content',
    valueExamples: ['justify-start', 'justify-center', 'justify-between', 'justify-end'],
  },
  {
    category: 'Flex',
    className: 'flex-col',
    description: 'Stacks flex children vertically.',
    docsUrl: TAILWIND_DOCS.flexDirection,
    group: 'flex-direction',
    valueExamples: ['flex-row', 'flex-col', 'flex-wrap', 'flex-nowrap'],
  },
  {
    category: 'Spacing',
    className: 'gap-4',
    description: 'Adds spacing between grid or flex children.',
    docsUrl: TAILWIND_DOCS.gap,
    group: 'gap',
    valueExamples: ['gap-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8'],
  },
  {
    category: 'Spacing',
    className: 'px-4',
    description: 'Adds horizontal padding on the left and right sides.',
    docsUrl: TAILWIND_DOCS.padding,
    group: 'padding-x',
    valueExamples: ['px-0', 'px-2', 'px-3', 'px-4', 'px-6', 'px-8'],
  },
  {
    category: 'Spacing',
    className: 'py-2',
    description: 'Adds vertical padding on the top and bottom sides.',
    docsUrl: TAILWIND_DOCS.padding,
    group: 'padding-y',
    valueExamples: ['py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-6'],
  },
  {
    category: 'Spacing',
    className: 'p-4',
    description: 'Adds padding on every side.',
    docsUrl: TAILWIND_DOCS.padding,
    group: 'padding',
    valueExamples: ['p-0', 'p-2', 'p-3', 'p-4', 'p-6', 'p-8'],
  },
  {
    category: 'Sizing',
    className: 'w-full',
    description: 'Sets width to 100 percent of the parent.',
    docsUrl: TAILWIND_DOCS.width,
    group: 'width',
    valueExamples: ['w-auto', 'w-full', 'w-fit', 'w-1/2', 'w-64'],
  },
  {
    category: 'Sizing',
    className: 'h-full',
    description: 'Sets height to 100 percent of the parent.',
    docsUrl: TAILWIND_DOCS.height,
    group: 'height',
    valueExamples: ['h-auto', 'h-full', 'h-fit', 'h-screen', 'h-64'],
  },
  {
    category: 'Sizing',
    className: 'min-h-screen',
    description: 'Sets minimum height to the viewport height.',
    docsUrl: TAILWIND_DOCS.minHeight,
    group: 'min-height',
    valueExamples: ['min-h-0', 'min-h-full', 'min-h-screen', 'min-h-dvh'],
  },
  {
    category: 'Typography',
    className: 'text-sm',
    description: 'Sets a small font size.',
    docsUrl: TAILWIND_DOCS.fontSize,
    group: 'font-size',
    valueExamples: ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'],
  },
  {
    category: 'Typography',
    className: 'font-medium',
    description: 'Sets medium font weight.',
    docsUrl: TAILWIND_DOCS.fontWeight,
    group: 'font-weight',
    valueExamples: ['font-normal', 'font-medium', 'font-semibold', 'font-bold'],
  },
  {
    category: 'Typography',
    className: 'text-muted-foreground',
    description: 'Applies the muted foreground color token.',
    docsUrl: TAILWIND_DOCS.color,
    group: 'text-color',
    valueExamples: ['text-foreground', 'text-muted-foreground', 'text-primary', 'text-destructive'],
  },
  {
    category: 'Color',
    className: 'bg-background',
    description: 'Applies the background color token.',
    docsUrl: TAILWIND_DOCS.backgroundColor,
    group: 'background-color',
    valueExamples: ['bg-background', 'bg-card', 'bg-muted', 'bg-primary', 'bg-transparent'],
  },
  {
    category: 'Color',
    className: 'border-border',
    description: 'Applies the border color token.',
    docsUrl: TAILWIND_DOCS.borderColor,
    group: 'border-color',
    valueExamples: ['border-border', 'border-input', 'border-primary', 'border-transparent'],
  },
  {
    category: 'Border',
    className: 'border',
    description: 'Adds a one pixel border.',
    docsUrl: TAILWIND_DOCS.borderWidth,
    group: 'border-width',
    valueExamples: ['border-0', 'border', 'border-2', 'border-x', 'border-y'],
  },
  {
    category: 'Border',
    className: 'rounded-lg',
    description: 'Applies a large border radius.',
    docsUrl: TAILWIND_DOCS.borderRadius,
    group: 'border-radius',
    valueExamples: ['rounded-none', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-full'],
  },
  {
    category: 'Effects',
    className: 'shadow-sm',
    description: 'Applies a subtle box shadow.',
    docsUrl: TAILWIND_DOCS.boxShadow,
    group: 'box-shadow',
    valueExamples: ['shadow-none', 'shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg'],
  },
  {
    category: 'State',
    className: 'hover:bg-muted',
    description: 'Changes background color on hover.',
    docsUrl: TAILWIND_DOCS.states,
    group: 'background-color',
    valueExamples: ['hover:bg-muted', 'hover:bg-accent', 'hover:bg-primary/90'],
  },
  {
    category: 'State',
    className: 'focus-visible:ring-2',
    description: 'Adds a two pixel focus-visible ring.',
    docsUrl: TAILWIND_DOCS.states,
    group: 'ring-width',
    valueExamples: ['focus-visible:ring-1', 'focus-visible:ring-2', 'focus-visible:ring-ring'],
  },
  {
    category: 'Responsive',
    className: 'md:grid-cols-2',
    description: 'Uses two grid columns from the medium breakpoint upward.',
    docsUrl: TAILWIND_DOCS.responsiveDesign,
    group: 'grid-template-columns',
    valueExamples: ['sm:grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4'],
  },
  {
    category: 'Container',
    className: '@container/main',
    description: 'Names this element as a Tailwind container query context.',
    docsUrl: TAILWIND_DOCS.containerQueries,
    group: 'container-name',
    valueExamples: ['@container', '@container/main', '@container/card'],
  },
  {
    category: 'Theme',
    className: 'dark:bg-card',
    description: 'Applies the card background color in dark mode.',
    docsUrl: TAILWIND_DOCS.darkMode,
    group: 'background-color',
    valueExamples: ['dark:bg-card', 'dark:bg-background', 'dark:text-foreground'],
  },
  ...createExpandedTailwindUtilitySuggestions(),
]);

const TAILWIND_UTILITY_SUGGESTION_BY_CLASS_NAME = new Map(
  TAILWIND_UTILITY_SUGGESTIONS.map((utility) => [utility.className, utility]),
);

const TAILWIND_DEFAULT_UTILITY_CLASS_NAMES = [
  'flex',
  'grid',
  'hidden',
  'relative',
  'absolute',
  'overflow-hidden',
  'items-center',
  'justify-between',
  'flex-col',
  'gap-2',
  'gap-4',
  'p-4',
  'px-4',
  'py-2',
  'w-full',
  'min-w-0',
  'h-full',
  'min-h-dvh',
  'text-sm',
  'font-medium',
  'text-muted-foreground',
  'bg-background',
  'bg-card',
  'border',
  'border-border',
  'rounded-md',
  'shadow-sm',
  'transition-colors',
  'hover:bg-muted',
  'focus-visible:ring-2',
  'md:grid-cols-2',
];

function dedupeTailwindUtilitySuggestions(suggestions: TailwindUtilityInfo[]): TailwindUtilityInfo[] {
  const seenClassNames = new Set<string>();
  const result: TailwindUtilityInfo[] = [];
  for (const utility of suggestions) {
    const className = utility.className.trim();
    if (!className || seenClassNames.has(className)) continue;
    seenClassNames.add(className);
    result.push({
      ...utility,
      className,
      valueExamples: utility.valueExamples.length > 0 ? utility.valueExamples : [className],
    });
  }
  return result;
}

function createExpandedTailwindUtilitySuggestions(): TailwindUtilityInfo[] {
  const suggestions: TailwindUtilityInfo[] = [];
  const add = (
    category: string,
    docsUrl: string,
    group: string,
    description: string,
    classNames: string[],
    valueExamples = classNames,
  ) => {
    for (const className of classNames) {
      suggestions.push({ category, className, description, docsUrl, group, valueExamples });
    }
  };

  const spacingScale = ['0', 'px', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '48', '56', '64', '80', '96'];
  const commonSpacingExamples = ['0', 'px', '1', '2', '3', '4', '6', '8', '12', '16'].map((value) => `gap-${value}`);
  const spacingClasses = (prefix: string, values = spacingScale) => values.map((value) => `${prefix}-${value}`);
  for (const [prefix, description, group] of [
    ['p', 'Sets padding on every side.', 'padding'],
    ['px', 'Sets horizontal padding.', 'padding-x'],
    ['py', 'Sets vertical padding.', 'padding-y'],
    ['pt', 'Sets top padding.', 'padding-top'],
    ['pr', 'Sets right padding.', 'padding-right'],
    ['pb', 'Sets bottom padding.', 'padding-bottom'],
    ['pl', 'Sets left padding.', 'padding-left'],
  ] as const) {
    add('Spacing', TAILWIND_DOCS.padding, group, description, spacingClasses(prefix), spacingClasses(prefix, ['0', 'px', '1', '2', '3', '4', '6', '8', '12', '16']));
  }
  const marginScale = [...spacingScale, 'auto'];
  for (const [prefix, description, group] of [
    ['m', 'Sets margin on every side.', 'margin'],
    ['mx', 'Sets horizontal margin.', 'margin-x'],
    ['my', 'Sets vertical margin.', 'margin-y'],
    ['mt', 'Sets top margin.', 'margin-top'],
    ['mr', 'Sets right margin.', 'margin-right'],
    ['mb', 'Sets bottom margin.', 'margin-bottom'],
    ['ml', 'Sets left margin.', 'margin-left'],
  ] as const) {
    add('Spacing', TAILWIND_DOCS.margin, group, description, spacingClasses(prefix, marginScale), spacingClasses(prefix, ['0', 'auto', '1', '2', '4', '6', '8', '12', '16']));
  }
  add('Spacing', TAILWIND_DOCS.gap, 'gap', 'Sets the gap between flex or grid children.', spacingClasses('gap'), commonSpacingExamples);
  add('Spacing', TAILWIND_DOCS.gap, 'gap-x', 'Sets horizontal gap between grid or flex children.', spacingClasses('gap-x'), ['gap-x-0', 'gap-x-2', 'gap-x-4', 'gap-x-6', 'gap-x-8']);
  add('Spacing', TAILWIND_DOCS.gap, 'gap-y', 'Sets vertical gap between grid or flex children.', spacingClasses('gap-y'), ['gap-y-0', 'gap-y-2', 'gap-y-4', 'gap-y-6', 'gap-y-8']);
  add('Spacing', TAILWIND_DOCS.margin, 'space-x', 'Adds horizontal spacing between sibling children.', spacingClasses('space-x'), ['space-x-0', 'space-x-2', 'space-x-4', 'space-x-6', 'space-x-8']);
  add('Spacing', TAILWIND_DOCS.margin, 'space-y', 'Adds vertical spacing between sibling children.', spacingClasses('space-y'), ['space-y-0', 'space-y-2', 'space-y-4', 'space-y-6', 'space-y-8']);

  add('Layout', TAILWIND_DOCS.display, 'display', 'Sets the element display mode.', ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'contents', 'flow-root', 'hidden']);
  add('Layout', TAILWIND_DOCS.position, 'position', 'Sets the positioning mode.', ['static', 'relative', 'absolute', 'fixed', 'sticky']);
  add('Layout', TAILWIND_DOCS.inset, 'inset', 'Sets positioned offsets.', [
    ...spacingClasses('inset', ['0', '1', '2', '4', '6', '8', '12', 'auto']),
    ...spacingClasses('inset-x', ['0', '2', '4', '8', 'auto']),
    ...spacingClasses('inset-y', ['0', '2', '4', '8', 'auto']),
    ...spacingClasses('top', ['0', '2', '4', '8', 'auto']),
    ...spacingClasses('right', ['0', '2', '4', '8', 'auto']),
    ...spacingClasses('bottom', ['0', '2', '4', '8', 'auto']),
    ...spacingClasses('left', ['0', '2', '4', '8', 'auto']),
  ], ['inset-0', 'inset-x-0', 'top-4', 'right-4', 'bottom-0', 'left-auto']);
  add('Layout', TAILWIND_DOCS.zIndex, 'z-index', 'Sets stacking order.', ['z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50', 'z-auto']);
  add('Layout', TAILWIND_DOCS.overflow, 'overflow', 'Controls overflowing content.', ['overflow-auto', 'overflow-hidden', 'overflow-clip', 'overflow-visible', 'overflow-scroll', 'overflow-x-auto', 'overflow-x-hidden', 'overflow-y-auto', 'overflow-y-hidden']);
  add('Layout', TAILWIND_DOCS.visibility, 'visibility', 'Controls element visibility without changing layout.', ['visible', 'invisible', 'collapse']);
  add('Layout', TAILWIND_DOCS.isolation, 'isolation', 'Controls stacking context isolation.', ['isolate', 'isolation-auto']);
  add('Layout', TAILWIND_DOCS.aspectRatio, 'aspect-ratio', 'Sets a fixed aspect ratio.', ['aspect-auto', 'aspect-square', 'aspect-video', 'aspect-3/2', 'aspect-4/3', 'aspect-[16/10]']);
  add('Layout', TAILWIND_DOCS.objectFit, 'object-fit', 'Controls how replaced content fits its box.', ['object-contain', 'object-cover', 'object-fill', 'object-none', 'object-scale-down']);
  add('Layout', TAILWIND_DOCS.objectPosition, 'object-position', 'Sets object alignment within its box.', ['object-center', 'object-top', 'object-right', 'object-bottom', 'object-left', 'object-top-right', 'object-bottom-left']);

  const widthValues = ['auto', 'px', 'full', 'screen', 'svw', 'lvw', 'dvw', 'min', 'max', 'fit', '1/2', '1/3', '2/3', '1/4', '2/4', '3/4', '1/5', '2/5', '3/5', '4/5', '1/6', '5/6', '4', '8', '10', '12', '16', '20', '24', '32', '40', '48', '56', '64', '72', '80', '96'];
  const heightValues = ['auto', 'px', 'full', 'screen', 'svh', 'lvh', 'dvh', 'min', 'max', 'fit', '1/2', '1/3', '2/3', '1/4', '3/4', '4', '8', '10', '12', '16', '20', '24', '32', '40', '48', '56', '64', '80', '96'];
  add('Sizing', TAILWIND_DOCS.width, 'width', 'Sets width.', spacingClasses('w', widthValues), ['w-auto', 'w-full', 'w-fit', 'w-screen', 'w-1/2', 'w-64']);
  add('Sizing', TAILWIND_DOCS.minWidth, 'min-width', 'Sets minimum width.', spacingClasses('min-w', ['0', 'full', 'min', 'max', 'fit', '64', '80']), ['min-w-0', 'min-w-full', 'min-w-fit']);
  add('Sizing', TAILWIND_DOCS.maxWidth, 'max-width', 'Sets maximum width.', spacingClasses('max-w', ['0', 'none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full', 'screen', 'fit', 'prose']), ['max-w-none', 'max-w-sm', 'max-w-xl', 'max-w-full']);
  add('Sizing', TAILWIND_DOCS.height, 'height', 'Sets height.', spacingClasses('h', heightValues), ['h-auto', 'h-full', 'h-fit', 'h-dvh', 'h-screen', 'h-64']);
  add('Sizing', TAILWIND_DOCS.minHeight, 'min-height', 'Sets minimum height.', spacingClasses('min-h', ['0', 'full', 'screen', 'svh', 'lvh', 'dvh', 'min', 'max', 'fit', '64', '80']), ['min-h-0', 'min-h-full', 'min-h-screen', 'min-h-dvh']);
  add('Sizing', TAILWIND_DOCS.height, 'max-height', 'Sets maximum height.', spacingClasses('max-h', ['0', 'none', 'full', 'screen', 'svh', 'lvh', 'dvh', 'min', 'max', 'fit', '64', '80', '96']), ['max-h-none', 'max-h-full', 'max-h-dvh']);

  // Families the picker previously had no suggestions for, chosen from what the
  // starter libraries actually use. Kept to real scale values so the list stays
  // browsable -- Tailwind's full space is unbounded and cannot be enumerated.
  const sizeValues = ['0', 'px', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', '10', '11', '12', '14', '16', '20', '24', 'full', 'min', 'max', 'fit'];
  add('Sizing', TAILWIND_DOCS.sizing, 'size', 'Sets width and height together.', spacingClasses('size', sizeValues), ['size-4', 'size-8', 'size-10', 'size-full']);
  add('Grid', TAILWIND_DOCS.gridColumn, 'grid-column', 'Places the item across grid columns.', [
    ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'full'].map((value) => `col-span-${value}`),
    'col-auto',
  ], ['col-span-2', 'col-span-6', 'col-span-full']);
  add('Grid', TAILWIND_DOCS.gridRow, 'grid-row', 'Places the item across grid rows.', [
    ...['1', '2', '3', '4', '5', '6', 'full'].map((value) => `row-span-${value}`),
    'row-auto',
  ], ['row-span-2', 'row-span-full']);
  add('Spacing', TAILWIND_DOCS.margin, 'space-y', 'Sets the vertical gap between adjacent children.', spacingClasses('space-y'), ['space-y-1', 'space-y-2', 'space-y-4']);
  add('Spacing', TAILWIND_DOCS.margin, 'space-x', 'Sets the horizontal gap between adjacent children.', spacingClasses('space-x'), ['space-x-1', 'space-x-2', 'space-x-4']);
  add('Spacing', TAILWIND_DOCS.margin, 'scroll-margin', 'Sets scroll margin for anchors and scroll snapping.', [
    ...spacingClasses('scroll-mt', ['0', '4', '8', '12', '16', '20', '24', '32']),
    ...spacingClasses('scroll-mb', ['0', '4', '8', '12', '16', '20', '24', '32']),
  ], ['scroll-mt-24', 'scroll-mb-8']);
  add('Typography', TAILWIND_DOCS.textDecoration, 'text-underline-offset', 'Sets the distance between text and its underline.', [
    'underline-offset-auto', 'underline-offset-0', 'underline-offset-1', 'underline-offset-2', 'underline-offset-4', 'underline-offset-8',
  ], ['underline-offset-2', 'underline-offset-4']);
  add('Typography', TAILWIND_DOCS.fontSize, 'font-variant-numeric', 'Sets numeric glyph variants.', [
    'normal-nums', 'ordinal', 'slashed-zero', 'lining-nums', 'oldstyle-nums', 'proportional-nums', 'tabular-nums', 'diagonal-fractions', 'stacked-fractions',
  ], ['tabular-nums', 'slashed-zero']);
  add('Accessibility', TAILWIND_DOCS.display, 'screen-reader', 'Hides content visually while keeping it available to screen readers.', ['sr-only', 'not-sr-only']);

  add('Flex', TAILWIND_DOCS.flexDirection, 'flex-direction', 'Sets flex direction.', ['flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse']);
  add('Flex', TAILWIND_DOCS.flexWrap, 'flex-wrap', 'Controls flex wrapping.', ['flex-wrap', 'flex-wrap-reverse', 'flex-nowrap']);
  add('Flex', TAILWIND_DOCS.flex, 'flex', 'Controls flex grow, shrink, and basis together.', ['flex-1', 'flex-auto', 'flex-initial', 'flex-none']);
  add('Flex', TAILWIND_DOCS.flexGrow, 'flex-grow', 'Controls whether a flex item grows.', ['grow', 'grow-0']);
  add('Flex', TAILWIND_DOCS.flexShrink, 'flex-shrink', 'Controls whether a flex item shrinks.', ['shrink', 'shrink-0']);
  add('Flex', TAILWIND_DOCS.flexBasis, 'flex-basis', 'Sets the initial flex item size.', spacingClasses('basis', ['auto', 'full', '1/2', '1/3', '2/3', '1/4', '3/4', '0', '4', '8', '16', '32', '64']), ['basis-auto', 'basis-full', 'basis-1/2', 'basis-64']);
  add('Flex', TAILWIND_DOCS.order, 'order', 'Controls flex and grid item order.', ['order-first', 'order-last', 'order-none', 'order-1', 'order-2', 'order-3', 'order-4', 'order-5', 'order-6']);
  add('Flex', TAILWIND_DOCS.alignItems, 'align-items', 'Aligns children on the cross axis.', ['items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch']);
  add('Flex', TAILWIND_DOCS.alignSelf, 'align-self', 'Aligns a single item on the cross axis.', ['self-auto', 'self-start', 'self-end', 'self-center', 'self-stretch', 'self-baseline']);
  add('Flex', TAILWIND_DOCS.justifyContent, 'justify-content', 'Distributes children on the main axis.', ['justify-normal', 'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly', 'justify-stretch']);
  add('Flex', TAILWIND_DOCS.alignContent, 'align-content', 'Distributes wrapped rows or columns on the cross axis.', ['content-normal', 'content-center', 'content-start', 'content-end', 'content-between', 'content-around', 'content-evenly', 'content-stretch']);

  const gridColumnCounts = Array.from({ length: 12 }, (_, index) => `grid-cols-${index + 1}`);
  const gridRowCounts = Array.from({ length: 6 }, (_, index) => `grid-rows-${index + 1}`);
  add('Grid', TAILWIND_DOCS.gridTemplateColumns, 'grid-template-columns', 'Sets grid column tracks.', ['grid-cols-none', 'grid-cols-subgrid', ...gridColumnCounts], ['grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-12']);
  add('Grid', TAILWIND_DOCS.gridTemplateRows, 'grid-template-rows', 'Sets grid row tracks.', ['grid-rows-none', 'grid-rows-subgrid', ...gridRowCounts], ['grid-rows-1', 'grid-rows-2', 'grid-rows-3', 'grid-rows-6']);
  add('Grid', TAILWIND_DOCS.gridColumn, 'grid-column', 'Controls grid column placement.', ['col-auto', 'col-span-full', ...Array.from({ length: 12 }, (_, index) => `col-span-${index + 1}`), ...Array.from({ length: 13 }, (_, index) => `col-start-${index + 1}`), ...Array.from({ length: 13 }, (_, index) => `col-end-${index + 1}`)], ['col-auto', 'col-span-2', 'col-span-4', 'col-span-full', 'col-start-1', 'col-end-7']);
  add('Grid', TAILWIND_DOCS.gridRow, 'grid-row', 'Controls grid row placement.', ['row-auto', 'row-span-full', ...Array.from({ length: 6 }, (_, index) => `row-span-${index + 1}`), ...Array.from({ length: 7 }, (_, index) => `row-start-${index + 1}`), ...Array.from({ length: 7 }, (_, index) => `row-end-${index + 1}`)], ['row-auto', 'row-span-2', 'row-span-full', 'row-start-1', 'row-end-4']);
  add('Grid', TAILWIND_DOCS.gridAutoFlow, 'grid-auto-flow', 'Controls how auto-placed grid items flow.', ['grid-flow-row', 'grid-flow-col', 'grid-flow-dense', 'grid-flow-row-dense', 'grid-flow-col-dense']);
  add('Grid', TAILWIND_DOCS.placeItems, 'place-items', 'Aligns grid children on both axes.', ['place-items-start', 'place-items-end', 'place-items-center', 'place-items-baseline', 'place-items-stretch']);
  add('Grid', TAILWIND_DOCS.placeContent, 'place-content', 'Distributes grid content on both axes.', ['place-content-center', 'place-content-start', 'place-content-end', 'place-content-between', 'place-content-around', 'place-content-evenly', 'place-content-stretch']);
  add('Grid', TAILWIND_DOCS.placeSelf, 'place-self', 'Aligns one grid item on both axes.', ['place-self-auto', 'place-self-start', 'place-self-end', 'place-self-center', 'place-self-stretch']);
  add('Grid', TAILWIND_DOCS.justifyItems, 'justify-items', 'Aligns grid children on the inline axis.', ['justify-items-start', 'justify-items-end', 'justify-items-center', 'justify-items-stretch']);
  add('Grid', TAILWIND_DOCS.justifySelf, 'justify-self', 'Aligns one grid item on the inline axis.', ['justify-self-auto', 'justify-self-start', 'justify-self-end', 'justify-self-center', 'justify-self-stretch']);

  add('Typography', TAILWIND_DOCS.fontSize, 'font-size', 'Sets font size.', ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl']);
  add('Typography', TAILWIND_DOCS.fontWeight, 'font-weight', 'Sets font weight.', ['font-thin', 'font-extralight', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black']);
  add('Typography', TAILWIND_DOCS.lineHeight, 'line-height', 'Sets line height.', ['leading-none', 'leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose', 'leading-3', 'leading-4', 'leading-5', 'leading-6', 'leading-7', 'leading-8', 'leading-9', 'leading-10']);
  add('Typography', TAILWIND_DOCS.letterSpacing, 'letter-spacing', 'Sets tracking between letters.', ['tracking-tighter', 'tracking-tight', 'tracking-normal', 'tracking-wide', 'tracking-wider', 'tracking-widest']);
  add('Typography', TAILWIND_DOCS.textAlign, 'text-align', 'Sets text alignment.', ['text-left', 'text-center', 'text-right', 'text-justify', 'text-start', 'text-end']);
  add('Typography', TAILWIND_DOCS.textTransform, 'text-transform', 'Transforms text casing.', ['uppercase', 'lowercase', 'capitalize', 'normal-case']);
  add('Typography', TAILWIND_DOCS.textDecoration, 'text-decoration', 'Controls text decoration.', ['underline', 'overline', 'line-through', 'no-underline', 'decoration-solid', 'decoration-dashed', 'decoration-dotted', 'decoration-wavy']);
  add('Typography', TAILWIND_DOCS.textOverflow, 'text-overflow', 'Controls text overflow behavior.', ['truncate', 'text-ellipsis', 'text-clip']);
  add('Typography', TAILWIND_DOCS.whiteSpace, 'white-space', 'Controls whitespace handling.', ['whitespace-normal', 'whitespace-nowrap', 'whitespace-pre', 'whitespace-pre-line', 'whitespace-pre-wrap', 'whitespace-break-spaces']);
  add('Typography', TAILWIND_DOCS.verticalAlign, 'vertical-align', 'Sets vertical alignment for inline or table-cell content.', ['align-baseline', 'align-top', 'align-middle', 'align-bottom', 'align-text-top', 'align-text-bottom', 'align-sub', 'align-super']);
  add('Typography', TAILWIND_DOCS.listStyleType, 'list-style-type', 'Sets list marker style.', ['list-none', 'list-disc', 'list-decimal', 'list-inside', 'list-outside']);

  const semanticColorClasses = [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground',
    'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive',
    'destructive-foreground', 'border', 'input', 'ring', 'sidebar', 'sidebar-foreground', 'sidebar-primary',
    'sidebar-primary-foreground', 'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
    'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
  ];
  const colorFamilies = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
  const colorSteps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  const paletteColors = colorFamilies.flatMap((family) => colorSteps.map((step) => `${family}-${step}`));
  add('Color', TAILWIND_DOCS.backgroundColor, 'background-color', 'Sets background color.', [
    'bg-transparent', 'bg-current', 'bg-black', 'bg-white', ...semanticColorClasses.map((color) => `bg-${color}`), ...paletteColors.map((color) => `bg-${color}`),
  ], ['bg-background', 'bg-card', 'bg-muted', 'bg-accent', 'bg-primary', 'bg-destructive', 'bg-transparent']);
  add('Color', TAILWIND_DOCS.color, 'text-color', 'Sets text color.', [
    'text-transparent', 'text-current', 'text-black', 'text-white', ...semanticColorClasses.map((color) => `text-${color}`), ...paletteColors.map((color) => `text-${color}`),
  ], ['text-foreground', 'text-muted-foreground', 'text-primary', 'text-primary-foreground', 'text-destructive']);
  add('Color', TAILWIND_DOCS.borderColor, 'border-color', 'Sets border color.', [
    'border-transparent', 'border-current', 'border-black', 'border-white', ...semanticColorClasses.map((color) => `border-${color}`), ...paletteColors.map((color) => `border-${color}`),
  ], ['border-border', 'border-input', 'border-primary', 'border-muted', 'border-transparent']);
  add('Color', TAILWIND_DOCS.ringColor, 'ring-color', 'Sets ring color.', [
    'ring-transparent', 'ring-current', 'ring-black', 'ring-white', ...semanticColorClasses.map((color) => `ring-${color}`), ...paletteColors.map((color) => `ring-${color}`),
  ], ['ring-ring', 'ring-primary', 'ring-destructive', 'ring-offset-background']);
  add('Color', TAILWIND_DOCS.divideColor, 'divide-color', 'Sets divider color between children.', ['divide-transparent', 'divide-current', 'divide-border', 'divide-input', 'divide-muted', 'divide-slate-200', 'divide-zinc-200']);

  add('Border', TAILWIND_DOCS.borderWidth, 'border-width', 'Sets border width.', ['border', 'border-0', 'border-2', 'border-4', 'border-8', 'border-x', 'border-y', 'border-t', 'border-r', 'border-b', 'border-l']);
  add('Border', TAILWIND_DOCS.borderRadius, 'border-radius', 'Sets border radius.', ['rounded-none', 'rounded-xs', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full', 'rounded-t-lg', 'rounded-r-lg', 'rounded-b-lg', 'rounded-l-lg']);
  add('Border', TAILWIND_DOCS.divideWidth, 'divide-width', 'Adds borders between children.', ['divide-x', 'divide-y', 'divide-x-0', 'divide-y-0', 'divide-x-2', 'divide-y-2']);
  add('Border', TAILWIND_DOCS.outlineWidth, 'outline-width', 'Sets outline width.', ['outline', 'outline-0', 'outline-1', 'outline-2', 'outline-4', 'outline-none']);
  add('Border', TAILWIND_DOCS.outlineColor, 'outline-color', 'Sets outline color.', ['outline-transparent', 'outline-ring', 'outline-primary', 'outline-destructive', 'outline-offset-0', 'outline-offset-2', 'outline-offset-4']);
  add('Effects', TAILWIND_DOCS.boxShadow, 'box-shadow', 'Sets box shadow.', ['shadow-none', 'shadow-2xs', 'shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-inner']);
  add('Effects', TAILWIND_DOCS.opacity, 'opacity', 'Sets opacity.', ['opacity-0', 'opacity-5', 'opacity-10', 'opacity-20', 'opacity-25', 'opacity-30', 'opacity-40', 'opacity-50', 'opacity-60', 'opacity-70', 'opacity-75', 'opacity-80', 'opacity-90', 'opacity-95', 'opacity-100']);
  add('Effects', TAILWIND_DOCS.ringWidth, 'ring-width', 'Sets focus or emphasis ring width.', ['ring', 'ring-0', 'ring-1', 'ring-2', 'ring-4', 'ring-8', 'ring-inset', 'ring-offset-0', 'ring-offset-1', 'ring-offset-2', 'ring-offset-4']);
  add('Effects', TAILWIND_DOCS.blur, 'blur', 'Applies a blur filter.', ['blur-none', 'blur-xs', 'blur-sm', 'blur-md', 'blur-lg', 'blur-xl', 'blur-2xl', 'blur-3xl']);
  add('Effects', TAILWIND_DOCS.brightness, 'brightness', 'Adjusts element brightness.', ['brightness-0', 'brightness-50', 'brightness-75', 'brightness-90', 'brightness-95', 'brightness-100', 'brightness-105', 'brightness-110', 'brightness-125', 'brightness-150', 'brightness-200']);
  add('Effects', TAILWIND_DOCS.contrast, 'contrast', 'Adjusts element contrast.', ['contrast-0', 'contrast-50', 'contrast-75', 'contrast-100', 'contrast-125', 'contrast-150', 'contrast-200']);
  add('Effects', TAILWIND_DOCS.saturate, 'saturate', 'Adjusts element saturation.', ['saturate-0', 'saturate-50', 'saturate-100', 'saturate-150', 'saturate-200']);
  add('Effects', TAILWIND_DOCS.backdropBlur, 'backdrop-blur', 'Applies backdrop blur.', ['backdrop-blur-none', 'backdrop-blur-xs', 'backdrop-blur-sm', 'backdrop-blur-md', 'backdrop-blur-lg', 'backdrop-blur-xl', 'backdrop-blur-2xl', 'backdrop-blur-3xl']);
  add('Effects', TAILWIND_DOCS.backdropBrightness, 'backdrop-brightness', 'Adjusts backdrop brightness.', ['backdrop-brightness-0', 'backdrop-brightness-50', 'backdrop-brightness-75', 'backdrop-brightness-100', 'backdrop-brightness-125', 'backdrop-brightness-150', 'backdrop-brightness-200']);
  add('Effects', TAILWIND_DOCS.backdropContrast, 'backdrop-contrast', 'Adjusts backdrop contrast.', ['backdrop-contrast-0', 'backdrop-contrast-50', 'backdrop-contrast-75', 'backdrop-contrast-100', 'backdrop-contrast-125', 'backdrop-contrast-150', 'backdrop-contrast-200']);
  add('Effects', TAILWIND_DOCS.backdropSaturate, 'backdrop-saturate', 'Adjusts backdrop saturation.', ['backdrop-saturate-0', 'backdrop-saturate-50', 'backdrop-saturate-100', 'backdrop-saturate-150', 'backdrop-saturate-200']);
  add('Effects', TAILWIND_DOCS.dropShadow, 'drop-shadow', 'Applies drop shadow filter.', ['drop-shadow-none', 'drop-shadow-xs', 'drop-shadow-sm', 'drop-shadow-md', 'drop-shadow-lg', 'drop-shadow-xl', 'drop-shadow-2xl']);
  const blendModes = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity',
    'plus-darker',
    'plus-lighter',
  ];
  add(
    'Effects',
    TAILWIND_DOCS.mixBlendMode,
    'mix-blend-mode',
    'Controls how this element blends with content behind it.',
    blendModes.map((mode) => `mix-blend-${mode}`),
    ['mix-blend-normal', 'mix-blend-multiply', 'mix-blend-screen', 'mix-blend-overlay', 'mix-blend-difference'],
  );
  add(
    'Effects',
    TAILWIND_DOCS.backgroundBlendMode,
    'background-blend-mode',
    'Controls how background layers blend together.',
    blendModes.map((mode) => `bg-blend-${mode}`),
    ['bg-blend-normal', 'bg-blend-multiply', 'bg-blend-screen', 'bg-blend-overlay', 'bg-blend-difference'],
  );

  add('Transform', TAILWIND_DOCS.scale, 'scale', 'Scales the element.', ['scale-0', 'scale-50', 'scale-75', 'scale-90', 'scale-95', 'scale-100', 'scale-105', 'scale-110', 'scale-125', 'scale-150', 'scale-x-100', 'scale-y-100']);
  add('Transform', TAILWIND_DOCS.rotate, 'rotate', 'Rotates the element.', ['rotate-0', 'rotate-1', 'rotate-2', 'rotate-3', 'rotate-6', 'rotate-12', 'rotate-45', 'rotate-90', 'rotate-180', '-rotate-1', '-rotate-2', '-rotate-3', '-rotate-6', '-rotate-12']);
  add('Transform', TAILWIND_DOCS.translate, 'translate', 'Translates the element.', ['translate-x-0', 'translate-x-1', 'translate-x-2', 'translate-x-4', 'translate-x-1/2', '-translate-x-1/2', 'translate-y-0', 'translate-y-1', 'translate-y-2', 'translate-y-4', 'translate-y-1/2', '-translate-y-1/2']);
  add('Transition', TAILWIND_DOCS.transitionProperty, 'transition-property', 'Sets transition properties.', ['transition', 'transition-all', 'transition-colors', 'transition-opacity', 'transition-shadow', 'transition-transform', 'transition-none']);
  add('Transition', TAILWIND_DOCS.transitionDuration, 'transition-duration', 'Sets transition duration.', ['duration-0', 'duration-75', 'duration-100', 'duration-150', 'duration-200', 'duration-300', 'duration-500', 'duration-700', 'duration-1000']);
  add('Transition', TAILWIND_DOCS.transitionTimingFunction, 'transition-timing-function', 'Sets transition easing.', ['ease-linear', 'ease-in', 'ease-out', 'ease-in-out']);
  add('Transition', TAILWIND_DOCS.animation, 'animation', 'Applies animation.', ['animate-none', 'animate-spin', 'animate-ping', 'animate-pulse', 'animate-bounce', 'animate-in', 'animate-out', 'fade-in', 'fade-out', 'zoom-in', 'zoom-out', 'slide-in-from-top', 'slide-in-from-bottom']);

  add('Interactivity', TAILWIND_DOCS.cursor, 'cursor', 'Sets mouse cursor.', ['cursor-auto', 'cursor-default', 'cursor-pointer', 'cursor-wait', 'cursor-text', 'cursor-move', 'cursor-help', 'cursor-not-allowed', 'cursor-grab', 'cursor-grabbing']);
  add('Interactivity', TAILWIND_DOCS.pointerEvents, 'pointer-events', 'Controls pointer event handling.', ['pointer-events-none', 'pointer-events-auto']);
  add('Interactivity', TAILWIND_DOCS.userSelect, 'user-select', 'Controls text selection.', ['select-none', 'select-text', 'select-all', 'select-auto']);
  add('Interactivity', TAILWIND_DOCS.appearance, 'appearance', 'Controls native appearance.', ['appearance-none', 'appearance-auto']);
  add('Interactivity', TAILWIND_DOCS.scrollSnapType, 'scroll-snap-type', 'Controls scroll snapping.', ['snap-none', 'snap-x', 'snap-y', 'snap-both', 'snap-mandatory', 'snap-proximity']);
  add('Interactivity', TAILWIND_DOCS.scrollSnapAlign, 'scroll-snap-align', 'Sets scroll snap alignment.', ['snap-start', 'snap-end', 'snap-center', 'snap-align-none']);

  const stateClassNames = [
    'hover:bg-muted', 'hover:bg-accent', 'hover:bg-primary/90', 'hover:text-accent-foreground', 'hover:text-primary',
    'focus-visible:outline-none', 'focus-visible:ring-1', 'focus-visible:ring-2', 'focus-visible:ring-ring',
    'disabled:pointer-events-none', 'disabled:opacity-50', 'aria-invalid:ring-destructive/20', 'aria-invalid:border-destructive',
    'data-[state=open]:animate-in', 'data-[state=closed]:animate-out', 'data-[state=open]:fade-in-0', 'data-[state=closed]:fade-out-0',
    'data-[state=checked]:bg-primary', 'data-[state=checked]:text-primary-foreground',
  ];
  add('State', TAILWIND_DOCS.states, 'state-variant', 'Applies a utility through a state or data variant.', stateClassNames);

  const responsiveClassNames = [
    ...['sm', 'md', 'lg', 'xl', '2xl'].flatMap((breakpoint) => [
      `${breakpoint}:block`,
      `${breakpoint}:flex`,
      `${breakpoint}:grid`,
      `${breakpoint}:hidden`,
      `${breakpoint}:grid-cols-2`,
      `${breakpoint}:grid-cols-3`,
      `${breakpoint}:grid-cols-4`,
      `${breakpoint}:flex-row`,
      `${breakpoint}:flex-col`,
      `${breakpoint}:gap-6`,
      `${breakpoint}:px-6`,
      `${breakpoint}:py-8`,
      `${breakpoint}:text-lg`,
    ]),
  ];
  add('Responsive', TAILWIND_DOCS.responsiveDesign, 'responsive-variant', 'Applies a utility from a breakpoint upward.', responsiveClassNames);
  add('Container', TAILWIND_DOCS.containerQueries, 'container-query', 'Defines or consumes a Tailwind container query.', [
    '@container',
    '@container/main',
    '@container/card',
    '@sm:flex-row',
    '@md:grid-cols-2',
    '@lg:grid-cols-3',
    '@xl:grid-cols-4',
  ]);
  add('Theme', TAILWIND_DOCS.darkMode, 'dark-variant', 'Applies a utility in dark mode.', ['dark:bg-background', 'dark:bg-card', 'dark:bg-popover', 'dark:text-foreground', 'dark:text-muted-foreground', 'dark:border-border', 'dark:ring-ring']);

  return suggestions;
}

export function getTailwindUtilityPickerResults(searchValue: string, activeClassNames: string[]): TailwindUtilityInfo[] {
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  if (!normalizedSearchValue) {
    return getDefaultTailwindUtilityPickerResults(activeClassNames);
  }
  const scoredResults = TAILWIND_UTILITY_SUGGESTIONS.map((utility) => {
    const haystack = [
      utility.className,
      utility.category,
      utility.description,
      ...utility.valueExamples,
    ].join(' ').toLowerCase();
    if (utility.className.toLowerCase() === normalizedSearchValue) return { score: 0, utility };
    if (utility.className.toLowerCase().startsWith(normalizedSearchValue)) return { score: 1, utility };
    if (haystack.includes(normalizedSearchValue)) return { score: 2, utility };
    return { score: 99, utility };
  });

  return scoredResults
    .filter((result) => result.score < 99)
    .sort((left, right) => left.score - right.score || left.utility.className.localeCompare(right.utility.className))
    .slice(0, 18)
    .map((result) => result.utility);
}

function getDefaultTailwindUtilityPickerResults(activeClassNames: string[]): TailwindUtilityInfo[] {
  const activeClassNameSet = new Set(activeClassNames);
  const results: TailwindUtilityInfo[] = [];
  for (const className of TAILWIND_DEFAULT_UTILITY_CLASS_NAMES) {
    if (activeClassNameSet.has(className)) continue;
    const utility = TAILWIND_UTILITY_SUGGESTION_BY_CLASS_NAME.get(className);
    if (!utility) continue;
    results.push(utility);
    if (results.length >= 18) break;
  }
  return results;
}

export function getClassNameTokenInfo(classToken: string): ClassNameTokenInfo {
  const splitToken = splitTailwindClassToken(classToken);
  const exactMatch = TAILWIND_UTILITY_SUGGESTION_BY_CLASS_NAME.get(classToken) ?? TAILWIND_UTILITY_SUGGESTION_BY_CLASS_NAME.get(splitToken.baseClass);
  if (exactMatch) {
    return {
      ...exactMatch,
      className: classToken,
      description: `${formatTailwindVariantDescription(splitToken.variantPrefix)}${exactMatch.description}`,
      kind: 'tailwind',
    };
  }

  const inferred = inferTailwindUtilityInfo(classToken, splitToken);
  if (!inferred) return createCustomClassNameInfo(classToken);

  return {
    ...inferred,
    description: `${formatTailwindVariantDescription(splitToken.variantPrefix)}${inferred.description}`,
    kind: 'tailwind',
  };
}

function inferTailwindUtilityInfo(
  classToken: string,
  splitToken: ReturnType<typeof splitTailwindClassToken>,
): TailwindUtilityInfo | null {
  const baseClass = splitToken.baseClass;
  if (baseClass.startsWith('p-')) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets padding on every side.', TAILWIND_DOCS.padding, 'padding', ['p-0', 'p-2', 'p-4', 'p-6']);
  if (baseClass.startsWith('px-')) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets horizontal padding.', TAILWIND_DOCS.padding, 'padding-x', ['px-0', 'px-2', 'px-4', 'px-6']);
  if (baseClass.startsWith('py-')) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets vertical padding.', TAILWIND_DOCS.padding, 'padding-y', ['py-0', 'py-2', 'py-4', 'py-6']);
  if (/^p[trbl]-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets padding on one side.', TAILWIND_DOCS.padding, `padding-${baseClass.slice(1, 2)}`, ['pt-0', 'pr-2', 'pb-4', 'pl-6']);
  if (baseClass.startsWith('m-')) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets margin on every side.', TAILWIND_DOCS.margin, 'margin', ['m-0', 'm-2', 'm-4', 'm-auto']);
  if (baseClass.startsWith('mx-')) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets horizontal margin.', TAILWIND_DOCS.margin, 'margin-x', ['mx-0', 'mx-auto', 'mx-2', 'mx-4']);
  if (baseClass.startsWith('my-')) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets vertical margin.', TAILWIND_DOCS.margin, 'margin-y', ['my-0', 'my-2', 'my-4', 'my-6']);
  if (/^m[trbl]-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets margin on one side.', TAILWIND_DOCS.margin, `margin-${baseClass.slice(1, 2)}`, ['mt-0', 'mr-2', 'mb-4', 'ml-6']);
  if (baseClass.startsWith('gap-')) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets the gap between flex or grid children.', TAILWIND_DOCS.gap, 'gap', ['gap-0', 'gap-2', 'gap-4', 'gap-6']);
  if (baseClass.startsWith('min-w-')) return createInferredTailwindUtilityInfo(classToken, 'Sizing', 'Sets the minimum width.', TAILWIND_DOCS.minWidth, 'min-width', ['min-w-0', 'min-w-full', 'min-w-fit']);
  if (baseClass.startsWith('max-w-')) return createInferredTailwindUtilityInfo(classToken, 'Sizing', 'Sets the maximum width.', TAILWIND_DOCS.maxWidth, 'max-width', ['max-w-none', 'max-w-sm', 'max-w-xl', 'max-w-full']);
  if (baseClass.startsWith('w-')) return createInferredTailwindUtilityInfo(classToken, 'Sizing', 'Sets width.', TAILWIND_DOCS.width, 'width', ['w-auto', 'w-full', 'w-fit', 'w-1/2']);
  if (baseClass.startsWith('min-h-')) return createInferredTailwindUtilityInfo(classToken, 'Sizing', 'Sets minimum height.', TAILWIND_DOCS.minHeight, 'min-height', ['min-h-0', 'min-h-full', 'min-h-screen']);
  if (baseClass.startsWith('h-')) return createInferredTailwindUtilityInfo(classToken, 'Sizing', 'Sets height.', TAILWIND_DOCS.height, 'height', ['h-auto', 'h-full', 'h-fit', 'h-screen']);
  if (/^(?:inset|top|right|bottom|left)-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Layout', 'Sets an inset offset for a positioned element.', TAILWIND_DOCS.inset, 'inset', ['inset-0', 'top-0', 'right-4', 'bottom-4', 'left-4']);
  if (baseClass.startsWith('grid-cols-')) return createInferredTailwindUtilityInfo(classToken, 'Grid', 'Sets the number of grid columns.', TAILWIND_DOCS.gridTemplateColumns, 'grid-template-columns', ['grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4']);
  if (baseClass.startsWith('items-')) return createInferredTailwindUtilityInfo(classToken, 'Flex', 'Sets cross-axis alignment.', TAILWIND_DOCS.alignItems, 'align-items', ['items-start', 'items-center', 'items-end']);
  if (baseClass.startsWith('justify-')) return createInferredTailwindUtilityInfo(classToken, 'Flex', 'Sets main-axis distribution.', TAILWIND_DOCS.justifyContent, 'justify-content', ['justify-start', 'justify-center', 'justify-between', 'justify-end']);
  if (baseClass.startsWith('bg-')) return createInferredTailwindUtilityInfo(classToken, 'Color', 'Sets background color.', TAILWIND_DOCS.backgroundColor, 'background-color', ['bg-background', 'bg-card', 'bg-muted', 'bg-primary']);
  if (baseClass.startsWith('text-') && /^(text-xs|text-sm|text-base|text-lg|text-xl|text-2xl|text-3xl)/.test(baseClass)) {
    return createInferredTailwindUtilityInfo(classToken, 'Typography', 'Sets font size.', TAILWIND_DOCS.fontSize, 'font-size', ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl']);
  }
  if (baseClass.startsWith('text-')) return createInferredTailwindUtilityInfo(classToken, 'Color', 'Sets text color.', TAILWIND_DOCS.color, 'text-color', ['text-foreground', 'text-muted-foreground', 'text-primary']);
  if (baseClass.startsWith('font-')) return createInferredTailwindUtilityInfo(classToken, 'Typography', 'Sets font weight or font family.', TAILWIND_DOCS.fontWeight, 'font-weight', ['font-normal', 'font-medium', 'font-semibold', 'font-bold']);
  if (baseClass.startsWith('leading-')) return createInferredTailwindUtilityInfo(classToken, 'Typography', 'Sets line height.', TAILWIND_DOCS.lineHeight, 'line-height', ['leading-none', 'leading-tight', 'leading-normal', 'leading-relaxed']);
  if (baseClass.startsWith('rounded')) return createInferredTailwindUtilityInfo(classToken, 'Border', 'Sets border radius.', TAILWIND_DOCS.borderRadius, 'border-radius', ['rounded-none', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-full']);
  if (baseClass.startsWith('border-') || baseClass === 'border') return createInferredTailwindUtilityInfo(classToken, 'Border', 'Sets border width or color.', TAILWIND_DOCS.borderWidth, baseClass === 'border' ? 'border-width' : 'border-color', ['border-0', 'border', 'border-2', 'border-border']);
  if (baseClass.startsWith('shadow')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Sets box shadow.', TAILWIND_DOCS.boxShadow, 'box-shadow', ['shadow-none', 'shadow-xs', 'shadow-sm', 'shadow-md']);
  if (baseClass.startsWith('opacity-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Sets opacity.', TAILWIND_DOCS.opacity, 'opacity', ['opacity-0', 'opacity-50', 'opacity-100']);
  if (baseClass.startsWith('mix-blend-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Sets mix blend mode.', TAILWIND_DOCS.mixBlendMode, 'mix-blend-mode', ['mix-blend-normal', 'mix-blend-multiply', 'mix-blend-screen', 'mix-blend-difference']);
  if (baseClass.startsWith('bg-blend-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Sets background blend mode.', TAILWIND_DOCS.backgroundBlendMode, 'background-blend-mode', ['bg-blend-normal', 'bg-blend-multiply', 'bg-blend-screen', 'bg-blend-difference']);
  if (baseClass.startsWith('blur-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Applies a blur filter.', TAILWIND_DOCS.blur, 'blur', ['blur-none', 'blur-sm', 'blur-md', 'blur-xl']);
  if (baseClass.startsWith('brightness-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Adjusts element brightness.', TAILWIND_DOCS.brightness, 'brightness', ['brightness-75', 'brightness-100', 'brightness-125', 'brightness-150']);
  if (baseClass.startsWith('contrast-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Adjusts element contrast.', TAILWIND_DOCS.contrast, 'contrast', ['contrast-75', 'contrast-100', 'contrast-125', 'contrast-150']);
  if (baseClass.startsWith('saturate-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Adjusts element saturation.', TAILWIND_DOCS.saturate, 'saturate', ['saturate-0', 'saturate-100', 'saturate-150', 'saturate-200']);
  if (baseClass.startsWith('backdrop-blur-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Applies backdrop blur.', TAILWIND_DOCS.backdropBlur, 'backdrop-blur', ['backdrop-blur-none', 'backdrop-blur-sm', 'backdrop-blur-md', 'backdrop-blur-xl']);
  if (baseClass.startsWith('backdrop-brightness-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Adjusts backdrop brightness.', TAILWIND_DOCS.backdropBrightness, 'backdrop-brightness', ['backdrop-brightness-75', 'backdrop-brightness-100', 'backdrop-brightness-125']);
  if (baseClass.startsWith('backdrop-contrast-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Adjusts backdrop contrast.', TAILWIND_DOCS.backdropContrast, 'backdrop-contrast', ['backdrop-contrast-75', 'backdrop-contrast-100', 'backdrop-contrast-125']);
  if (baseClass.startsWith('backdrop-saturate-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Adjusts backdrop saturation.', TAILWIND_DOCS.backdropSaturate, 'backdrop-saturate', ['backdrop-saturate-0', 'backdrop-saturate-100', 'backdrop-saturate-150']);
  if (baseClass === 'container' || baseClass.startsWith('@container')) return createInferredTailwindUtilityInfo(classToken, 'Container', 'Defines a Tailwind container context.', TAILWIND_DOCS.containerQueries, 'container-name', ['@container', '@container/main']);
  if (baseClass.startsWith('size-')) return createInferredTailwindUtilityInfo(classToken, 'Sizing', 'Sets width and height together.', TAILWIND_DOCS.sizing, 'width/height', ['size-4', 'size-8', 'size-full']);
  if (baseClass.startsWith('max-h-')) return createInferredTailwindUtilityInfo(classToken, 'Sizing', 'Sets the maximum height.', TAILWIND_DOCS.height, 'max-height', ['max-h-40', 'max-h-screen', 'max-h-none']);
  if (/^col-(?:span|start|end)-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Grid', 'Places the item across grid columns.', TAILWIND_DOCS.gridColumn, 'grid-column', ['col-span-2', 'col-span-full', 'col-start-1']);
  if (/^row-(?:span|start|end)-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Grid', 'Places the item across grid rows.', TAILWIND_DOCS.gridRow, 'grid-row', ['row-span-2', 'row-start-1', 'row-span-full']);
  if (baseClass.startsWith('grid-rows-')) return createInferredTailwindUtilityInfo(classToken, 'Grid', 'Sets the number of grid rows.', TAILWIND_DOCS.gridTemplateRows, 'grid-template-rows', ['grid-rows-2', 'grid-rows-3', 'grid-rows-none']);
  if (/^space-[xy]-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets the gap between adjacent children.', TAILWIND_DOCS.margin, 'margin', ['space-y-2', 'space-x-4', 'space-y-px']);
  if (/^scroll-m[trblxy]?-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets scroll margin for scroll snapping and anchors.', TAILWIND_DOCS.margin, 'scroll-margin', ['scroll-mt-24', 'scroll-mb-8']);
  if (/^scroll-p[trblxy]?-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Spacing', 'Sets scroll padding for scroll snapping.', TAILWIND_DOCS.padding, 'scroll-padding', ['scroll-pt-24', 'scroll-p-4']);
  if (baseClass.startsWith('divide-')) return createInferredTailwindUtilityInfo(classToken, 'Border', 'Sets dividers between adjacent children.', TAILWIND_DOCS.divideWidth, 'border-width', ['divide-y', 'divide-x', 'divide-border']);
  if (baseClass.startsWith('ring-offset-')) return createInferredTailwindUtilityInfo(classToken, 'Border', 'Sets the offset around a focus ring.', TAILWIND_DOCS.ringWidth, 'box-shadow', ['ring-offset-2', 'ring-offset-background']);
  if (baseClass.startsWith('ring-') || baseClass === 'ring') return createInferredTailwindUtilityInfo(classToken, 'Border', 'Sets a focus ring.', TAILWIND_DOCS.ringWidth, 'box-shadow', ['ring', 'ring-2', 'ring-ring/50']);
  if (baseClass.startsWith('outline-')) return createInferredTailwindUtilityInfo(classToken, 'Border', 'Sets the outline.', TAILWIND_DOCS.outlineWidth, 'outline', ['outline-none', 'outline-2', 'outline-offset-2']);
  if (baseClass.startsWith('underline-offset-')) return createInferredTailwindUtilityInfo(classToken, 'Typography', 'Sets the distance between text and its underline.', TAILWIND_DOCS.textDecoration, 'text-underline-offset', ['underline-offset-2', 'underline-offset-4']);
  if (baseClass.startsWith('decoration-')) return createInferredTailwindUtilityInfo(classToken, 'Typography', 'Styles the text decoration.', TAILWIND_DOCS.textDecoration, 'text-decoration', ['decoration-2', 'decoration-dotted']);
  if (baseClass.startsWith('tracking-')) return createInferredTailwindUtilityInfo(classToken, 'Typography', 'Sets letter spacing.', TAILWIND_DOCS.letterSpacing, 'letter-spacing', ['tracking-tight', 'tracking-wide']);
  if (/^(?:tabular|oldstyle|lining|proportional|diagonal|stacked)-nums$|^(?:normal-nums|ordinal|slashed-zero)$/.test(baseClass)) {
    return createInferredTailwindUtilityInfo(classToken, 'Typography', 'Sets numeric glyph variants.', TAILWIND_DOCS.fontSize, 'font-variant-numeric', ['tabular-nums', 'slashed-zero', 'ordinal']);
  }
  if (baseClass === 'sr-only' || baseClass === 'not-sr-only') return createInferredTailwindUtilityInfo(classToken, 'Accessibility', 'Hides content visually while keeping it available to screen readers.', TAILWIND_DOCS.display, 'position/clip', ['sr-only', 'not-sr-only']);
  if (/^-?translate-[xy]-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Transform', 'Translates the element.', TAILWIND_DOCS.translate, 'translate', ['translate-x-1/2', '-translate-y-1/2']);
  if (/^-?rotate-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Transform', 'Rotates the element.', TAILWIND_DOCS.rotate, 'rotate', ['rotate-45', '-rotate-90']);
  if (/^-?scale(?:-[xy])?-/.test(baseClass)) return createInferredTailwindUtilityInfo(classToken, 'Transform', 'Scales the element.', TAILWIND_DOCS.scale, 'scale', ['scale-95', 'scale-x-110']);
  if (baseClass.startsWith('transition')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Sets which properties transition.', TAILWIND_DOCS.transitionProperty, 'transition-property', ['transition', 'transition-colors', 'transition-none']);
  if (baseClass.startsWith('duration-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Sets transition duration.', TAILWIND_DOCS.transitionDuration, 'transition-duration', ['transition', 'transition-colors', 'transition-none']);
  if (baseClass.startsWith('ease-')) return createInferredTailwindUtilityInfo(classToken, 'Effects', 'Sets the transition timing function.', TAILWIND_DOCS.transitionTimingFunction, 'transition-timing-function', ['transition', 'transition-colors', 'transition-none']);
  if (baseClass.startsWith('order-')) return createInferredTailwindUtilityInfo(classToken, 'Flex', 'Sets the flex/grid order.', TAILWIND_DOCS.order, 'order', ['order-first', 'order-2', 'order-last']);
  if (baseClass.startsWith('basis-')) return createInferredTailwindUtilityInfo(classToken, 'Flex', 'Sets the flex basis.', TAILWIND_DOCS.flexBasis, 'flex-basis', ['basis-1/2', 'basis-full', 'basis-auto']);
  if (baseClass.startsWith('object-')) return createInferredTailwindUtilityInfo(classToken, 'Layout', 'Sets how replaced content fits its box.', TAILWIND_DOCS.objectFit, 'object-fit', ['object-cover', 'object-contain', 'object-center']);
  if (baseClass.startsWith('z-')) return createInferredTailwindUtilityInfo(classToken, 'Layout', 'Sets the stacking order.', TAILWIND_DOCS.position, 'z-index', ['z-0', 'z-10', 'z-50']);
  if (baseClass.includes('[')) return createInferredTailwindUtilityInfo(classToken, 'Arbitrary', 'Uses a Tailwind arbitrary value or selector.', TAILWIND_DOCS.states, undefined, []);
  return null;
}

function createCustomClassNameInfo(className: string): ClassNameTokenInfo {
  return {
    category: 'Custom CSS',
    className,
    description: 'Custom CSS class preserved in className. Style it from the project CSS instead of Tailwind utilities.',
    kind: 'custom',
    valueExamples: [],
  };
}

function createInferredTailwindUtilityInfo(
  className: string,
  category: string,
  description: string,
  docsUrl: string,
  group: string | undefined,
  valueExamples: string[],
): TailwindUtilityInfo {
  return { category, className, description, docsUrl, group, valueExamples };
}

export function splitTailwindClassToken(classToken: string): {
  baseClass: string;
  important: boolean;
  variantPrefix: string;
} {
  const trimmedClassToken = classToken.trim();
  const important = trimmedClassToken.startsWith('!');
  const classTokenWithoutImportant = important ? trimmedClassToken.slice(1) : trimmedClassToken;
  const separatorIndex = findTailwindVariantSeparatorIndex(classTokenWithoutImportant);
  if (separatorIndex < 0) {
    return { baseClass: classTokenWithoutImportant, important, variantPrefix: '' };
  }
  return {
    baseClass: classTokenWithoutImportant.slice(separatorIndex + 1),
    important,
    variantPrefix: classTokenWithoutImportant.slice(0, separatorIndex),
  };
}

function findTailwindVariantSeparatorIndex(classToken: string): number {
  let bracketDepth = 0;
  let separatorIndex = -1;
  for (let index = 0; index < classToken.length; index += 1) {
    const character = classToken[index];
    if (character === '[') bracketDepth += 1;
    if (character === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    if (character === ':' && bracketDepth === 0) separatorIndex = index;
  }
  return separatorIndex;
}

function formatTailwindVariantDescription(variantPrefix: string): string {
  if (!variantPrefix) return '';
  return `Applies through ${variantPrefix.split(':').join(' / ')}. `;
}

export function formatTailwindClassTokenWithReplacementValue(classToken: string, replacementValue: string): string {
  const splitToken = splitTailwindClassToken(classToken);
  const importantPrefix = splitToken.important ? '!' : '';
  const variantPrefix = splitToken.variantPrefix ? `${splitToken.variantPrefix}:` : '';
  const normalizedReplacement = replacementValue.trim();
  return `${importantPrefix}${variantPrefix}${normalizedReplacement}`;
}
