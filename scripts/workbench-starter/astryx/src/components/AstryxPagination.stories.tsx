import { AstryxPagination as AstryxPaginationComponent } from './AstryxPagination';
import { AstryxPaginationButton } from './AstryxPaginationButton';
import { AstryxPaginationIndicator } from './AstryxPaginationIndicator';
import { AstryxPaginationPageSize } from './AstryxPaginationPageSize';

type Args = Record<string, boolean | number | string>;

const VARIANTS = ['pages', 'count', 'compact', 'dots', 'none'] as const;
const SIZES = ['sm', 'md'] as const;

const DEFAULT_PROPS = {
  label: 'Pagination',
  variant: 'pages',
  size: 'md',
  hasMore: false,
  isDisabled: false,
  page: 3,
  pageSize: 10,
  siblingCount: 1,
  totalItems: 120,
  totalPages: 12,
} as const;

const PAGINATION_CHILDREN =
  '<AstryxPaginationPageSize label="Items per page" options="10, 25, 50" />\n' +
  '<AstryxPaginationButton direction="previous" label="Previous page" />\n' +
  '<AstryxPaginationIndicator ofLabel="of" pageLabel="Page" />\n' +
  '<AstryxPaginationButton direction="next" label="Next page" />';

const meta = {
  title: 'Astryx/Pagination',
  component: AstryxPaginationComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
    hasMore: { control: 'boolean' },
    isDisabled: { control: 'boolean' },
    page: { control: 'number' },
    pageSize: { control: 'number' },
    siblingCount: { control: 'number' },
    totalItems: { control: 'number' },
    totalPages: { control: 'number' },
  },
  authoring: {
    allowedChildren: ['AstryxPaginationPageSize', 'AstryxPaginationButton', 'AstryxPaginationIndicator'],
    group: 'Navigation',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren: PAGINATION_CHILDREN,
    imports: [
      {
        names: ['AstryxPaginationPageSize'],
        sourceFile: 'src/components/AstryxPaginationPageSize.tsx',
      },
      {
        names: ['AstryxPaginationButton'],
        sourceFile: 'src/components/AstryxPaginationButton.tsx',
      },
      {
        names: ['AstryxPaginationIndicator'],
        sourceFile: 'src/components/AstryxPaginationIndicator.tsx',
      },
    ],
  },
};
export default meta;

export const AstryxPagination = {
  name: 'AstryxPagination',
  render: (args: Args) => (
    <AstryxPaginationComponent
      hasMore={asBoolean(args.hasMore)}
      isDisabled={asBoolean(args.isDisabled)}
      label={asText(args.label, DEFAULT_PROPS.label)}
      page={asNumber(args.page, DEFAULT_PROPS.page)}
      pageSize={asNumber(args.pageSize, DEFAULT_PROPS.pageSize)}
      siblingCount={asNumber(args.siblingCount, DEFAULT_PROPS.siblingCount)}
      size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
      totalItems={asNumber(args.totalItems, DEFAULT_PROPS.totalItems)}
      totalPages={asNumber(args.totalPages, DEFAULT_PROPS.totalPages)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    >
      <AstryxPaginationPageSize label="Items per page" options="10, 25, 50" />
      <AstryxPaginationButton direction="previous" label="Previous page" />
      <AstryxPaginationIndicator ofLabel="of" pageLabel="Page" />
      <AstryxPaginationButton direction="next" label="Next page" />
    </AstryxPaginationComponent>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
