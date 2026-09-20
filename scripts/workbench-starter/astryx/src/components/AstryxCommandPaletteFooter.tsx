import { CommandPaletteFooter } from '@astryxdesign/core/CommandPalette';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPaletteFooter>,
  'children' | 'className'
>;

export interface AstryxCommandPaletteFooterProps extends RootProps {
  children?: ReactNode;
  className?: string;
}

export function AstryxCommandPaletteFooter({
  children,
  className,
  ...rootProps
}: AstryxCommandPaletteFooterProps) {
  return (
    <div className={cx('astryx-wb-command-palette-footer', className)}>
      <CommandPaletteFooter {...rootProps}>
        {children ?? <></>}
      </CommandPaletteFooter>
    </div>
  );
}

AstryxCommandPaletteFooter.displayName = 'AstryxCommandPaletteFooter';
