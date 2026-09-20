import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxPaginationVariant = 'pages' | 'count' | 'compact' | 'dots' | 'none';
export type AstryxPaginationSize = 'sm' | 'md';

type AstryxPaginationRootProps = Omit<
  ComponentPropsWithoutRef<'nav'>,
  'children' | 'className'
>;

export interface AstryxPaginationProps extends AstryxPaginationRootProps {
  children?: ReactNode;
  page?: number;
  totalItems?: number;
  totalPages?: number;
  hasMore?: boolean;
  pageSize?: number;
  variant?: AstryxPaginationVariant;
  siblingCount?: number;
  size?: AstryxPaginationSize;
  isDisabled?: boolean;
  label?: string;
  className?: string;
}

export interface AstryxPaginationContextValue {
  currentPage: number;
  hasMore: boolean;
  isDisabled: boolean;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  siblingCount: number;
  size: AstryxPaginationSize;
  totalItems?: number;
  totalPages?: number;
  variant: AstryxPaginationVariant;
}

export const AstryxPaginationContext =
  createContext<AstryxPaginationContextValue | null>(null);

export function AstryxPagination({
  children,
  page = 3,
  totalItems = 120,
  totalPages,
  hasMore = false,
  pageSize = 10,
  variant = 'pages',
  siblingCount = 1,
  size = 'md',
  isDisabled = false,
  label = 'Pagination',
  className,
  ...rootProps
}: AstryxPaginationProps) {
  const stableChildren = useStableAstryxChildren(children);
  const [currentPage, setCurrentPageState] = useState(page);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const computedTotalPages = totalPages ??
    (totalItems == null ? undefined : Math.max(1, Math.ceil(totalItems / currentPageSize)));

  useEffect(() => {
    setCurrentPageState(page);
  }, [page]);

  useEffect(() => {
    setCurrentPageSize(pageSize);
  }, [pageSize]);

  const setCurrentPage = (nextPage: number) => {
    if (isDisabled) return;
    const upperBound = computedTotalPages ?? (hasMore ? Number.POSITIVE_INFINITY : currentPage);
    setCurrentPageState(Math.max(1, Math.min(nextPage, upperBound)));
  };
  const setPageSize = (nextPageSize: number) => {
    if (isDisabled || !Number.isFinite(nextPageSize) || nextPageSize <= 0) return;
    setCurrentPageSize(Math.floor(nextPageSize));
    setCurrentPageState(1);
  };

  const context = useMemo<AstryxPaginationContextValue>(() => ({
    currentPage,
    hasMore,
    isDisabled,
    pageSize: currentPageSize,
    setCurrentPage,
    setPageSize,
    siblingCount: Math.max(0, Math.floor(siblingCount)),
    size,
    totalItems,
    totalPages: computedTotalPages,
    variant,
  }), [
    computedTotalPages,
    currentPage,
    currentPageSize,
    hasMore,
    isDisabled,
    siblingCount,
    size,
    totalItems,
    variant,
  ]);

  if (totalItems != null && totalItems <= 0) return null;
  if (computedTotalPages != null && computedTotalPages <= 0) return null;

  return (
    <AstryxPaginationContext.Provider value={context}>
      <nav
        {...rootProps}
        aria-label={label}
        className={cx('astryx-wb-pagination', className)}
        data-astryx-wb-pagination-size={size}
        data-astryx-wb-pagination-variant={variant}
      >
        {stableChildren}
      </nav>
    </AstryxPaginationContext.Provider>
  );
}

AstryxPagination.displayName = 'AstryxPagination';
