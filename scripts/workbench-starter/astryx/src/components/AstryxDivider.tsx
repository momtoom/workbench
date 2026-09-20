import { Divider } from '@astryxdesign/core/Divider';
import type { ComponentPropsWithoutRef } from 'react';

export type AstryxDividerOrientation = 'horizontal' | 'vertical';
export type AstryxDividerVariant = 'subtle' | 'strong';

type AstryxDividerRootProps = Omit<
  ComponentPropsWithoutRef<typeof Divider>,
  'className' | 'isFullBleed' | 'label' | 'orientation' | 'variant'
>;

export interface AstryxDividerProps extends AstryxDividerRootProps {
  orientation?: AstryxDividerOrientation;
  label?: string;
  variant?: AstryxDividerVariant;
  isFullBleed?: boolean;
  className?: string;
}

export function AstryxDivider({
  orientation = 'horizontal',
  label,
  variant = 'subtle',
  isFullBleed = false,
  className,
  ...rootProps
}: AstryxDividerProps) {
  return (
    <Divider
      {...rootProps}
      className={className}
      isFullBleed={isFullBleed}
      label={label || undefined}
      orientation={orientation}
      variant={variant}
    />
  );
}
