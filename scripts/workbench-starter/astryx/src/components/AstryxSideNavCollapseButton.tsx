import { IconButton } from '@astryxdesign/core/IconButton';
import { useSideNavCollapse } from '@astryxdesign/core/SideNav';
import type { ComponentPropsWithoutRef, MouseEventHandler } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

export type AstryxSideNavCollapseButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type AstryxSideNavCollapseButtonSize = 'sm' | 'md' | 'lg';

type AstryxSideNavCollapseButtonRootProps = Omit<
  ComponentPropsWithoutRef<typeof IconButton>,
  'className' | 'icon' | 'isDisabled' | 'isLoading' | 'label' | 'onClick' | 'size' | 'tooltip' | 'variant'
>;

export interface AstryxSideNavCollapseButtonProps extends AstryxSideNavCollapseButtonRootProps {
  label?: string;
  expandedIcon?: AstryxIconValue;
  collapsedIcon?: AstryxIconValue;
  variant?: AstryxSideNavCollapseButtonVariant;
  size?: AstryxSideNavCollapseButtonSize;
  isDisabled?: boolean;
  isLoading?: boolean;
  tooltip?: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function AstryxSideNavCollapseButton({
  label,
  expandedIcon = 'chevronLeft',
  collapsedIcon = 'chevronRight',
  variant = 'ghost',
  size = 'md',
  isDisabled = false,
  isLoading = false,
  tooltip,
  className,
  onClick,
  ...rootProps
}: AstryxSideNavCollapseButtonProps) {
  const { isCollapsed, isCollapsible, toggle } = useSideNavCollapse();

  if (!isCollapsible) return null;

  const resolvedLabel = label ?? (isCollapsed ? 'Expand sidebar' : 'Collapse sidebar');
  const resolvedIcon = isCollapsed ? collapsedIcon : expandedIcon;

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (!event.defaultPrevented) toggle();
  };

  return (
    <IconButton
      {...rootProps}
      className={cx('astryx-wb-side-nav-collapse-button', className)}
      icon={<AstryxIcon icon={resolvedIcon} size="sm" />}
      isDisabled={isDisabled}
      isLoading={isLoading}
      label={resolvedLabel}
      onClick={handleClick}
      size={size}
      tooltip={tooltip || resolvedLabel}
      variant={variant}
    />
  );
}

AstryxSideNavCollapseButton.displayName = 'AstryxSideNavCollapseButton';
