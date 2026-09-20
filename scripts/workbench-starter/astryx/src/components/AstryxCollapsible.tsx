import { Collapsible } from '@astryxdesign/core/Collapsible';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxCollapsibleRootProps = Omit<
  ComponentPropsWithoutRef<typeof Collapsible>,
  'children' | 'className' | 'defaultIsOpen' | 'isOpen' | 'onOpenChange' | 'trigger' | 'value'
>;

export interface AstryxCollapsibleProps extends AstryxCollapsibleRootProps {
  trigger?: ReactNode;
  defaultIsOpen?: boolean;
  isDisabled?: boolean;
  value?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxCollapsible({
  trigger = 'Details',
  defaultIsOpen = true,
  isDisabled = false,
  value,
  className,
  children,
  ...rootProps
}: AstryxCollapsibleProps) {
  return (
    <Collapsible
      {...rootProps}
      className={cx('astryx-wb-collapsible', className)}
      defaultIsOpen={defaultIsOpen}
      isDisabled={isDisabled}
      trigger={trigger}
      value={value || undefined}
    >
      {children}
    </Collapsible>
  );
}
