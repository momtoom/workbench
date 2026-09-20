import { CommandPaletteInput } from '@astryxdesign/core/CommandPalette';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

type RootProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPaletteInput>,
  'className' | 'hasAutoFocus' | 'placeholder'
>;

export interface AstryxCommandPaletteInputProps extends RootProps {
  placeholder?: string;
  hasAutoFocus?: boolean;
  className?: string;
}

export function AstryxCommandPaletteInput({
  placeholder = 'Search commands...',
  hasAutoFocus = false,
  className,
  ...rootProps
}: AstryxCommandPaletteInputProps) {
  return (
    <CommandPaletteInput
      {...rootProps}
      className={cx('astryx-wb-command-palette-input', className)}
      hasAutoFocus={hasAutoFocus}
      placeholder={placeholder}
    />
  );
}

AstryxCommandPaletteInput.displayName = 'AstryxCommandPaletteInput';
