import { ContextMenu } from '@astryxdesign/core/ContextMenu';
import { Text } from '@astryxdesign/core/Text';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxContextMenuSize = 'sm' | 'md' | 'lg';
type RootProps = Omit<
  ComponentPropsWithoutRef<typeof ContextMenu>,
  'children' | 'className' | 'isDisabled' | 'items' | 'label' | 'menuContent' | 'menuWidth' | 'size'
>;
export interface AstryxContextMenuProps extends RootProps {
  label?: string;
  triggerLabel?: string;
  children?: ReactNode;
  menuWidth?: string;
  size?: AstryxContextMenuSize;
  isDisabled?: boolean;
  className?: string;
}
export function AstryxContextMenu({
  label = 'Card actions',
  triggerLabel = 'Right-click this card',
  children,
  menuWidth = '200px',
  size = 'md',
  isDisabled = false,
  className,
  ...rootProps
}: AstryxContextMenuProps) {
  const stableChildren = useStableAstryxChildren(children);
  return (
    <ContextMenu
      {...rootProps}
      className={cx('astryx-wb-context-menu', className)}
      isDisabled={isDisabled}
      label={label}
      menuContent={stableChildren}
      menuWidth={resolveSize(menuWidth)}
      size={size}
    >
      <div className="astryx-wb-context-menu__trigger">
        <Text type="body">{triggerLabel}</Text>
      </div>
    </ContextMenu>
  );
}
function resolveSize(value: string): number | string {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : value;
}
