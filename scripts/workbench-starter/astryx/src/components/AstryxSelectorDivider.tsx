import { Divider } from '@astryxdesign/core/Divider';
import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './classNames';

type AstryxSelectorDividerRootProps = Omit<
  ComponentPropsWithoutRef<typeof Divider>,
  'className' | 'isFullBleed' | 'label' | 'orientation'
>;

export interface AstryxSelectorDividerProps extends AstryxSelectorDividerRootProps {
  className?: string;
}

export interface AstryxSelectorDividerData {
  type: 'divider';
}

export function AstryxSelectorDivider({
  className,
  ...rootProps
}: AstryxSelectorDividerProps) {
  return (
    <Divider
      {...rootProps}
      className={cx('astryx-wb-selector-divider', className)}
      orientation="horizontal"
    />
  );
}

AstryxSelectorDivider.displayName = 'AstryxSelectorDivider';

export function toAstryxSelectorDividerData(): AstryxSelectorDividerData {
  return { type: 'divider' };
}
