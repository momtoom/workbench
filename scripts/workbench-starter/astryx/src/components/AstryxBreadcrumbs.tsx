import { Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxBreadcrumbsVariant = 'default' | 'supporting';

type AstryxBreadcrumbsRootProps = Omit<
  ComponentPropsWithoutRef<typeof Breadcrumbs>,
  'children' | 'className' | 'label' | 'separator' | 'variant'
>;

export interface AstryxBreadcrumbsProps extends AstryxBreadcrumbsRootProps {
  label?: string;
  separator?: string;
  variant?: AstryxBreadcrumbsVariant;
  className?: string;
  children?: ReactNode;
}

export function AstryxBreadcrumbs({
  label = 'Breadcrumb',
  separator = '/',
  variant = 'default',
  className,
  children,
  ...rootProps
}: AstryxBreadcrumbsProps) {
  return (
    <Breadcrumbs
      {...rootProps}
      className={cx('astryx-wb-breadcrumbs', className)}
      label={label}
      separator={separator}
      variant={variant}
    >
      {children}
    </Breadcrumbs>
  );
}
