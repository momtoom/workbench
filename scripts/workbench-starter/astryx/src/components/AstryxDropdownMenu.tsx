import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

export type AstryxDropdownMenuButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type AstryxDropdownMenuButtonSize = 'sm' | 'md' | 'lg';
export type AstryxDropdownMenuPlacement = 'above' | 'below' | 'start' | 'end';

type AstryxDropdownMenuRootProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenu>,
  | 'button'
  | 'children'
  | 'className'
  | 'hasChevron'
  | 'isMenuOpen'
  | 'items'
  | 'menuWidth'
  | 'onClick'
  | 'onOpenChange'
  | 'placement'
>;

export interface AstryxDropdownMenuProps extends AstryxDropdownMenuRootProps {
  label?: string;
  icon?: AstryxIconValue | 'none';
  variant?: AstryxDropdownMenuButtonVariant;
  size?: AstryxDropdownMenuButtonSize;
  hasChevron?: boolean;
  isDefaultOpen?: boolean;
  isIconOnly?: boolean;
  menuWidth?: string;
  placement?: AstryxDropdownMenuPlacement;
  tooltip?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxDropdownMenu({
  label = 'Actions',
  icon = 'none',
  variant = 'secondary',
  size = 'md',
  hasChevron = true,
  isDefaultOpen = false,
  isIconOnly = false,
  menuWidth,
  placement = 'below',
  tooltip,
  className,
  children,
  ...rootProps
}: AstryxDropdownMenuProps) {
  const triggerIcon = renderDropdownTriggerIcon(icon, isIconOnly);
  const resolvedIsIconOnly = isIconOnly && triggerIcon != null;
  const { ref: triggerRef, ...dropdownRootProps } = rootProps as AstryxDropdownMenuRootProps & {
    ref?: Ref<HTMLButtonElement>;
  };

  return (
    <DropdownMenu
      {...dropdownRootProps}
      button={{
        ref: triggerRef,
        label,
        icon: triggerIcon,
        size,
        variant,
        isIconOnly: resolvedIsIconOnly,
        tooltip: tooltip || (resolvedIsIconOnly ? label : undefined),
        className: 'astryx-wb-dropdown-menu-trigger',
      }}
      className={cx('astryx-wb-dropdown-menu', className)}
      hasChevron={hasChevron}
      isMenuOpen={isDefaultOpen || undefined}
      menuWidth={resolveOverlayWidth(menuWidth)}
      placement={placement}
    >
      {children}
    </DropdownMenu>
  );
}

function resolveOverlayWidth(width: string | undefined): string | number | undefined {
  if (!width) return undefined;
  const numeric = Number(width);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : width;
}

function renderDropdownTriggerIcon(icon: AstryxIconValue | 'none', isIconOnly: boolean) {
  const resolvedIcon = icon === 'none' || icon === '' ? (isIconOnly ? 'chevronDown' : null) : icon;
  return resolvedIcon ? <AstryxIcon color="inherit" icon={resolvedIcon} size="sm" /> : undefined;
}
