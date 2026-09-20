import { LayoutPanel } from '@astryxdesign/core/Layout';
import type { AriaRole, ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';
import { resolveAstryxLayoutPadding, type AstryxLayoutPadding } from './AstryxLayoutHeader';

export type AstryxLayoutPanelSlot = 'start' | 'end';

type AstryxLayoutPanelRootProps = Omit<
  ComponentPropsWithoutRef<typeof LayoutPanel>,
  'children' | 'className' | 'hasDivider' | 'isScrollable' | 'label' | 'padding' | 'resizable' | 'role' | 'width'
>;

export interface AstryxLayoutPanelProps extends AstryxLayoutPanelRootProps {
  slot?: AstryxLayoutPanelSlot;
  hasDivider?: boolean;
  isScrollable?: boolean;
  padding?: AstryxLayoutPadding;
  label?: string;
  role?: AriaRole;
  width?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxLayoutPanel({
  slot = 'start',
  hasDivider = true,
  isScrollable = true,
  padding = 'inherit',
  label,
  role,
  width = '240px',
  className,
  children,
  ...rootProps
}: AstryxLayoutPanelProps) {
  return (
    <LayoutPanel
      {...rootProps}
      className={cx('astryx-wb-layout-panel', className)}
      data-astryx-wb-layout-slot={slot}
      hasDivider={hasDivider}
      isScrollable={isScrollable}
      label={label || undefined}
      padding={resolveAstryxLayoutPadding(padding)}
      role={role}
      width={width || undefined}
    >
      {children}
    </LayoutPanel>
  );
}

AstryxLayoutPanel.displayName = 'AstryxLayoutPanel';
