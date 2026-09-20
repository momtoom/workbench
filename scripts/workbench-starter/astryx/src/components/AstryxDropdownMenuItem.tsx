import { DropdownMenuItem } from '@astryxdesign/core/DropdownMenu';
import type { ComponentPropsWithoutRef } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { AstryxKbd } from './AstryxKbd';
import { cx } from './classNames';

export type AstryxDropdownMenuItemIcon = AstryxIconValue | 'none';

type AstryxDropdownMenuItemRootProps = Omit<
  ComponentPropsWithoutRef<typeof DropdownMenuItem>,
  'className' | 'description' | 'endContent' | 'icon' | 'isDisabled' | 'label' | 'onClick'
>;

export interface AstryxDropdownMenuItemProps extends AstryxDropdownMenuItemRootProps {
  label?: string;
  description?: string;
  icon?: AstryxDropdownMenuItemIcon;
  endLabel?: string;
  isDisabled?: boolean;
  className?: string;
}

export function AstryxDropdownMenuItem({
  label = 'Edit',
  description,
  icon = 'none',
  endLabel,
  isDisabled = false,
  className,
  ...rootProps
}: AstryxDropdownMenuItemProps) {
  return (
    <DropdownMenuItem
      {...rootProps}
      className={cx('astryx-wb-dropdown-menu-item', className)}
      description={description || undefined}
      endContent={endLabel ? <AstryxKbd keys={normalizeShortcutKeys(endLabel)} /> : undefined}
      icon={icon === 'none' ? undefined : <AstryxIcon icon={icon} size="sm" />}
      isDisabled={isDisabled}
      label={label}
      // Astryx closes compound menu items only after their action runs.
      // Workbench-authored placeholder items still need that close lifecycle
      // even when no application callback has been wired yet.
      onClick={() => {}}
    />
  );
}

AstryxDropdownMenuItem.displayName = 'AstryxDropdownMenuItem';

function normalizeShortcutKeys(value: string): string {
  return value
    .replace(/\s+/g, '')
    .replace(/⌘|command|cmd/gi, 'mod')
    .replace(/control|ctrl/gi, 'ctrl')
    .replace(/option|opt|⌥/gi, 'alt')
    .replace(/shift|⇧/gi, 'shift')
    .toLowerCase();
}
