import { BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs';
import type { ComponentPropsWithoutRef } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

type AstryxBreadcrumbItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof BreadcrumbItem>,
  'as' | 'children' | 'className' | 'href' | 'isCurrent' | 'onClick' | 'startIcon'
>;

export interface AstryxBreadcrumbItemProps extends AstryxBreadcrumbItemRootProps {
  label?: string;
  href?: string;
  isCurrent?: boolean;
  icon?: AstryxIconValue | 'none';
  isClickable?: boolean;
  className?: string;
}

export function AstryxBreadcrumbItem({
  label = 'Projects',
  href = '#',
  isCurrent = false,
  icon = 'none',
  isClickable = false,
  className,
  ...rootProps
}: AstryxBreadcrumbItemProps) {
  return (
    <BreadcrumbItem
      {...rootProps}
      className={cx('astryx-wb-breadcrumb-item', className)}
      href={isCurrent ? undefined : href || undefined}
      isCurrent={isCurrent}
      onClick={!isCurrent && isClickable ? () => undefined : undefined}
      startIcon={renderBreadcrumbIcon(icon)}
    >
      {label}
    </BreadcrumbItem>
  );
}

function renderBreadcrumbIcon(icon: AstryxIconValue | 'none') {
  if (icon === 'none' || icon === '') return undefined;
  return <AstryxIcon className="astryx-breadcrumb-root-icon" color="secondary" icon={icon} size="sm" />;
}
