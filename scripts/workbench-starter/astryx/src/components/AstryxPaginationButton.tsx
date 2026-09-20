import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { useContext, type ComponentPropsWithoutRef } from 'react';
import {
  AstryxPaginationContext,
  type AstryxPaginationSize,
} from './AstryxPagination';
import { cx } from './classNames';

export type AstryxPaginationDirection = 'previous' | 'next';

type RootProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'className'
>;

export interface AstryxPaginationButtonProps extends RootProps {
  direction?: AstryxPaginationDirection;
  label?: string;
  size?: AstryxPaginationSize;
  isDisabled?: boolean;
  className?: string;
}

export function AstryxPaginationButton({
  direction = 'next',
  label,
  size,
  isDisabled,
  className,
  ...rootProps
}: AstryxPaginationButtonProps) {
  const pagination = useContext(AstryxPaginationContext);
  const currentPage = pagination?.currentPage ?? 1;
  const totalPages = pagination?.totalPages;
  const isPrevious = direction === 'previous';
  const canMove = isPrevious
    ? currentPage > 1
    : totalPages != null
      ? currentPage < totalPages
      : pagination?.hasMore ?? false;
  const disabled = isDisabled ?? pagination?.isDisabled ?? false;
  const controlSize = size ?? pagination?.size ?? 'md';
  const resolvedLabel = label || (isPrevious ? 'Previous page' : 'Next page');

  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-pagination-button', className)}
      data-astryx-wb-pagination-direction={direction}
      data-astryx-wb-pagination-part="button"
    >
      <Button
        icon={(
          <Icon
            icon={isPrevious ? 'chevronLeft' : 'chevronRight'}
            size={controlSize === 'sm' ? 'sm' : 'md'}
          />
        )}
        isDisabled={disabled || !canMove}
        isIconOnly
        label={resolvedLabel}
        onClick={() => pagination?.setCurrentPage(currentPage + (isPrevious ? -1 : 1))}
        size={controlSize}
        variant="ghost"
      />
    </div>
  );
}

AstryxPaginationButton.displayName = 'AstryxPaginationButton';
