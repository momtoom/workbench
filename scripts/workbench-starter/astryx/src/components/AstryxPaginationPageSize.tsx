import { Selector } from '@astryxdesign/core/Selector';
import { useContext, type ComponentPropsWithoutRef } from 'react';
import {
  AstryxPaginationContext,
  type AstryxPaginationSize,
} from './AstryxPagination';
import { cx } from './classNames';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxPaginationPageSizeProps extends RootProps {
  label?: string;
  options?: string;
  size?: AstryxPaginationSize;
  isDisabled?: boolean;
  className?: string;
}

export function AstryxPaginationPageSize({
  label = 'Items per page',
  options = '10, 25, 50',
  size,
  isDisabled,
  className,
  ...rootProps
}: AstryxPaginationPageSizeProps) {
  const pagination = useContext(AstryxPaginationContext);
  const parsedOptions = parsePageSizeOptions(options);
  const currentPageSize = pagination?.pageSize ?? parsedOptions[0] ?? 10;
  const controlSize = size ?? pagination?.size ?? 'md';

  return (
    <div
      {...rootProps}
      className={cx('astryx-wb-pagination-page-size', className)}
      data-astryx-wb-pagination-part="page-size"
    >
      <Selector
        isDisabled={isDisabled ?? pagination?.isDisabled ?? false}
        isLabelHidden
        label={label}
        onChange={(value) => pagination?.setPageSize(Number(value))}
        options={parsedOptions.map(String)}
        size={controlSize}
        value={String(currentPageSize)}
      />
    </div>
  );
}

AstryxPaginationPageSize.displayName = 'AstryxPaginationPageSize';

function parsePageSizeOptions(value: string): number[] {
  const parsed = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
  return parsed.length ? Array.from(new Set(parsed)) : [10, 25, 50];
}
