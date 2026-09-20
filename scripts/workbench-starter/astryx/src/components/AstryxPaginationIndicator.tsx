import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { generatePageRange } from '@astryxdesign/core/Pagination';
import { useContext, type ComponentPropsWithoutRef } from 'react';
import {
  AstryxPaginationContext,
  type AstryxPaginationVariant,
} from './AstryxPagination';
import { cx } from './classNames';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxPaginationIndicatorProps extends RootProps {
  variant?: AstryxPaginationVariant;
  pageLabel?: string;
  ofLabel?: string;
  className?: string;
}

export function AstryxPaginationIndicator({
  variant,
  pageLabel = 'Page',
  ofLabel = 'of',
  className,
  ...rootProps
}: AstryxPaginationIndicatorProps) {
  const pagination = useContext(AstryxPaginationContext);
  const currentPage = pagination?.currentPage ?? 1;
  const totalPages = pagination?.totalPages;
  const totalItems = pagination?.totalItems;
  const pageSize = pagination?.pageSize ?? 10;
  const resolvedVariant = variant ?? pagination?.variant ?? 'compact';
  const size = pagination?.size ?? 'md';
  const isDisabled = pagination?.isDisabled ?? false;

  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-pagination-indicator', className)}
      data-astryx-wb-pagination-indicator={resolvedVariant}
      data-astryx-wb-pagination-part="indicator"
    >
      {resolvedVariant === 'pages' && totalPages != null
        ? generatePageRange(currentPage, totalPages, pagination?.siblingCount ?? 1).map(
            (item, index) => item === '...'
              ? (
                  <span
                    aria-hidden="true"
                    className="astryx-wb-pagination-indicator__ellipsis"
                    key={`ellipsis-${index}`}
                  >
                    …
                  </span>
                )
              : (
                  <Button
                    aria-current={item === currentPage ? 'page' : undefined}
                    isDisabled={isDisabled}
                    key={item}
                    label={`Go to page ${item}`}
                    onClick={() => pagination?.setCurrentPage(item)}
                    size={size}
                    variant="ghost"
                  >
                    {item}
                  </Button>
                ),
          )
        : null}
      {resolvedVariant === 'compact' && totalPages != null ? (
        <Text color="secondary" size="sm" type="body">
          {pageLabel} {currentPage} {ofLabel} {totalPages}
        </Text>
      ) : null}
      {resolvedVariant === 'count' && totalItems != null ? (
        <Text color="secondary" size="sm" type="body">
          {(currentPage - 1) * pageSize + 1}–
          {Math.min(currentPage * pageSize, totalItems)} {ofLabel} {totalItems}
        </Text>
      ) : null}
      {resolvedVariant === 'dots' && totalPages != null ? (
        <div aria-label="Page indicators" className="astryx-wb-pagination-indicator__dots" role="group">
          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            return (
              <button
                aria-current={page === currentPage ? 'page' : undefined}
                aria-label={`Go to page ${page}`}
                className="astryx-wb-pagination-indicator__dot"
                data-active={page === currentPage ? 'true' : undefined}
                disabled={isDisabled}
                key={page}
                onClick={() => pagination?.setCurrentPage(page)}
                type="button"
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

AstryxPaginationIndicator.displayName = 'AstryxPaginationIndicator';
