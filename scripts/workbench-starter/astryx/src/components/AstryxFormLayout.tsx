import { FormLayout } from '@astryxdesign/core/FormLayout';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxFormLayoutDirection = 'vertical' | 'horizontal' | 'horizontal-labels';

type AstryxFormLayoutRootProps = Omit<
  ComponentPropsWithoutRef<typeof FormLayout>,
  'children' | 'className' | 'direction'
>;

export interface AstryxFormLayoutProps extends AstryxFormLayoutRootProps {
  direction?: AstryxFormLayoutDirection;
  className?: string;
  children?: ReactNode;
}

export function AstryxFormLayout({
  direction = 'vertical',
  className,
  children,
  ...rootProps
}: AstryxFormLayoutProps) {
  return (
    <FormLayout {...rootProps} className={cx('astryx-wb-form-layout', className)} direction={direction}>
      {children}
    </FormLayout>
  );
}
